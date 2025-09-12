<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

const route = useRoute()
const router = useRouter()
const ticketId = parseInt(route.params.id)

const loading = ref(true)
const error = ref(null)
const selectedSeats = ref([])
const bookedSeats = ref([])  
const seatRows = ref([])
const busInfo = ref(null)

const GET_BUS_INFO = gql`
  query GetBusInfo($id: Int!) {
    Bus_ticket_by_pk(tk_id: $id) {
      tk_id
      tk_price
      queue_op {
        bus {
          bus_id
          bus_capacity
          seats_reserved
          seats_available
          bus_number
          category { cat_type }
        }
        bus_queue {
          bq_distance
          bq_date
          bq_time
          bq_zone
        }
      }
    }
  }
`

const UPDATE_BUS_SEATS = gql`
  mutation UpdateBusSeats($bus_id: Int!, $new_reserved: Int!, $new_available: Int!) {
    update_Bus_bus_by_pk(
      pk_columns: { bus_id: $bus_id },
      _set: { seats_reserved: $new_reserved, seats_available: $new_available }
    ) {
      bus_id
      seats_reserved
      seats_available
    }
  }
`

// เพิ่ม computed สำหรับรวมราคาตั๋วทั้งหมด
const totalPrice = computed(() => {
  if (!busInfo.value) return 0
  return busInfo.value.tk_price * selectedSeats.value.length
})

onMounted(async () => {
  try {
    const savedSeats = localStorage.getItem(`bookedSeats_${ticketId}`)
    bookedSeats.value = savedSeats ? JSON.parse(savedSeats) : []

    const result = await apolloClient.query({
      query: GET_BUS_INFO,
      variables: { id: ticketId },
      fetchPolicy: 'network-only'
    })

    const data = result.data.Bus_ticket_by_pk
    if (data) {
      const bus = data.queue_op.bus
      busInfo.value = {
        bus_id: bus.bus_id,
        bus_capacity: bus.bus_capacity,
        seats_reserved: bus.seats_reserved || 0,
        seats_available:
          bus.seats_available ?? bus.bus_capacity - (bus.seats_reserved || 0),
        bus_number: bus.bus_number,
        category: bus.category.cat_type,
        tk_price: data.tk_price,
        bq_distance: data.queue_op.bus_queue.bq_distance,
        bq_date: data.queue_op.bus_queue.bq_date,
        bq_time: data.queue_op.bus_queue.bq_time,
        bq_zone: data.queue_op.bus_queue.bq_zone
      }

      seatRows.value = []

      const capacity = bus.bus_capacity
      const numRows = Math.ceil(capacity / 4) 
      let seatNumber = 1
      for (let i = 0; i < numRows; i++) {
        const left = []
        const right = []
        for (let j = 0; j < 2; j++) {
          if (seatNumber <= capacity) left.push(`A${seatNumber++}`)
        }
        for (let j = 0; j < 2; j++) {
          if (seatNumber <= capacity) right.push(`B${seatNumber++}`)
        }
        seatRows.value.push({ left, right })
      }
    }
  } catch (err) {
    error.value = err
    console.error(err)
  } finally {
    loading.value = false
  }
})

function toggleSeat(seat) {
  if (bookedSeats.value.includes(seat)) return

  if (selectedSeats.value.includes(seat)) {
    selectedSeats.value = selectedSeats.value.filter(s => s !== seat)
  } else {
    selectedSeats.value.push(seat)
  }
}

async function confirmBooking() {
  if (selectedSeats.value.length === 0) {
    alert('ເລືອກບ່ອນນັ່ງ!')
    return
  }

  const reserveCount = selectedSeats.value.length
  const newReserved = busInfo.value.seats_reserved + reserveCount
  const newAvailable = busInfo.value.bus_capacity - newReserved

  try {
    await apolloClient.mutate({
      mutation: UPDATE_BUS_SEATS,
      variables: {
        bus_id: busInfo.value.bus_id,
        new_reserved: newReserved,
        new_available: newAvailable
      }
    })

    const seatsToSend = [...selectedSeats.value]

    bookedSeats.value = [...bookedSeats.value, ...selectedSeats.value]
    localStorage.setItem(
      `bookedSeats_${ticketId}`,
      JSON.stringify(bookedSeats.value)
    )

    selectedSeats.value = []
    busInfo.value.seats_reserved = newReserved
    busInfo.value.seats_available = newAvailable

    router.push({
      name: 'detail',
      params: { id: ticketId },
      query: {
        seats: seatsToSend.join(','),
        reserved: newReserved,
        available: newAvailable,
        totalPrice: totalPrice.value // ส่งยอดรวมไปด้วยถ้าต้องการ
      }
    })
  } catch (err) {
    console.error(err)
    alert('เกิดข้อผิดพลาดในการจอง')
  }
}

function back() {
  router.push({ name: 'bus-queue' })
}
</script>


<template>
  <v-container>
    <h1>ເລືອກບ່ອນນັ່ງ</h1>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <div class="screen">SCREEN</div>

      <div class="content-wrapper">
        <div class="bus-layout">
          <div v-for="(row, index) in seatRows" :key="index" class="row">
            <div class="side">
              <button
                v-for="seat in row.left"
                :key="seat"
                class="seat"
                :class="{
                  selected: selectedSeats.includes(seat),
                  booked: bookedSeats.includes(seat)
                }"
                @click="toggleSeat(seat)"
                :disabled="bookedSeats.includes(seat)"
                type="button"
              >
                {{ seat }}
              </button>
            </div>

            <div class="aisle"></div>

            <div class="side">
              <button
                v-for="seat in row.right"
                :key="seat"
                class="seat"
                :class="{
                  selected: selectedSeats.includes(seat),
                  booked: bookedSeats.includes(seat)
                }"
                @click="toggleSeat(seat)"
                :disabled="bookedSeats.includes(seat)"
                type="button"
              >
                {{ seat }}
              </button>
            </div>
          </div>
        </div>

        <div class="bus-info">
          <p><strong>ຕົ້ນທາງ-ປາຍທາງ:</strong> {{ busInfo.bq_distance }}</p>
          <p><strong>ລາຄາ:</strong> {{ busInfo.tk_price }} ກີບ</p>
          <p><strong>ລາຄາລວມ:</strong> {{ totalPrice }} ກີບ</p>

          <p><strong>ປະເພດລົດ:</strong> {{ busInfo.category }}</p>
          <p><strong>ປ້າຍລົດ:</strong> {{ busInfo.bus_number }}</p>
          <p><strong>ໂຊນບ່ອນຈອດ:</strong> {{ busInfo.bq_zone }}</p>
          <p><strong>ວັນທີ:</strong> {{ busInfo.bq_date }}</p>
          <p><strong>ເວລາ:</strong> {{ busInfo.bq_time }}</p>
          <p><strong>ຈຳນວນບ່ອນນັ່ງທີ່ຖືກຊື້:</strong> {{ busInfo.seats_reserved }}</p>
          <p><strong>ຈຳນວນບ່ອນນັ່ງທີ່ຍັງເຫຼືອ:</strong> {{ busInfo.seats_available }}</p>

          <div v-if="selectedSeats.length > 0" class="selected-seats">
            <strong>ເລກທີ່ນັ່ງທີ່ເລືອກ:</strong> {{ selectedSeats.join(', ') }}
          </div>

          <div class="btn-group">
            <v-btn
              color="primary"
              @click="confirmBooking"
              :disabled="selectedSeats.length === 0"
            >
              ຢືນຢັນບ່ອນນັ່ງ
            </v-btn>
            <v-btn color="secondary" @click="back">ຍ້ອນກັບ</v-btn>
          </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.content-wrapper {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.bus-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.row {
  display: flex;
  justify-content: center;
  gap: 20px;
  align-items: center;
}

.side {
  display: flex;
  gap: 8px;
}

.aisle {
  width: 40px; /* ช่องว่างระหว่างที่นั่งฝั่งซ้ายและขวา */
}

.seat {
  width: 50px;
  height: 50px;
  background-color: #ddd;
  border-radius: 6px;
  border: 1px solid #aaa;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

.seat.selected {
  background-color: #4caf50;
  color: white;
  border-color: #388e3c;
}

.seat.booked {
  background-color: #f44336;
  color: white;
  cursor: not-allowed;
  border-color: #d32f2f;
}

.seat:disabled {
  cursor: not-allowed;
}

.screen {
  background-color: #512ce4;
  color: white;
  text-align: center;
  font-weight: bold;
  padding: 10px 0;
  margin-bottom: 20px;
  border-radius: 8px;
  user-select: none;
}

.bus-info p {
  margin: 6px 0;
  font-size: 16px;
}

.selected-seats {
  margin: 12px 0;
  font-weight: bold;
  color: #4caf50;
}

.btn-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
</style>

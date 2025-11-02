<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

const router = useRouter()
const route = useRoute()
const queueId = Number(route.params.id)

const loading = ref(true)
const error = ref(null)
const selectedSeats = ref([])
const bookedSeats = ref([])
const seatRows = ref([])
const confirmDialog = ref(false)

const busInfo = reactive({
  queue_id: null,
  bus_id: null,
  bus_capacity: 0,
  seats_reserved: 0,
  seats_available: 0,
  bus_number: '',
  category: '',
  price: 0,
  bq_distance: '',
  bq_zone: '',
  bq_date: '',
  bq_time: ''
})

function formatPrice(value) {
  const num = Number(value)
  return isNaN(num) ? '0' : num.toLocaleString('en-US')
}

const totalPrice = computed(() => {
  return formatPrice(selectedSeats.value.length * (Number(busInfo.price) || 0))
})

// 🔹 Query: ดึงข้อมูลคิวตาม queue_id
const GET_QUEUE_DETAILS = gql`
  query GetQueueDetails($id: Int!) {
    Bus_queue_op_by_pk(queue_id: $id) {
      queue_id
      Date
      seats_reserved
      seats_available
      bus_queue { bq_distance }
      time { time }
      bus {
        bus_id
        bus_number
        bus_capacity
        category { cat_type }
      }
      zone { zone }
      price { price }
    }
  }
`

// 🔹 Mutation: อัปเดตที่ตาราง Bus_queue_op
const UPDATE_QUEUE_SEATS = gql`
  mutation UpdateQueueSeats($queue_id: Int!, $new_reserved: Int!, $new_available: Int!) {
    update_Bus_queue_op_by_pk(
      pk_columns: { queue_id: $queue_id },
      _set: { seats_reserved: $new_reserved, seats_available: $new_available }
    ) {
      queue_id
      seats_reserved
      seats_available
    }
  }
`

// โหลดข้อมูลคิว
async function loadQueue() {
  try {
    const result = await apolloClient.query({
      query: GET_QUEUE_DETAILS,
      variables: { id: queueId }
    })

    const queueOp = result.data.Bus_queue_op_by_pk
    if (!queueOp) {
      error.value = new Error('ไม่พบข้อมูลคิว')
      return
    }

    const bus = queueOp.bus
    Object.assign(busInfo, {
      queue_id: queueOp.queue_id,
      bus_id: bus.bus_id,
      bus_capacity: bus.bus_capacity,
      seats_reserved: queueOp.seats_reserved || 0,
      seats_available: queueOp.seats_available ?? bus.bus_capacity - (queueOp.seats_reserved || 0),
      bus_number: bus.bus_number,
      category: bus.category?.cat_type || '-',
      price: parseInt((queueOp.price?.price || "0").toString().replace(/[^\d]/g, "")),
      bq_distance: queueOp.bus_queue?.bq_distance || '-',
      bq_zone: queueOp.zone?.zone || '-',
      bq_date: queueOp.Date || '-',
      bq_time: queueOp.time?.time || '-'
    })

    // สร้างผังที่นั่ง
    const capacity = bus.bus_capacity
    const numRows = Math.ceil(capacity / 4)
    let seatNumber = 1
    seatRows.value = []
    for (let i = 0; i < numRows; i++) {
      const left = []
      const right = []
      for (let j = 0; j < 2; j++) if (seatNumber <= capacity) left.push(`A${seatNumber++}`)
      for (let j = 0; j < 2; j++) if (seatNumber <= capacity) right.push(`B${seatNumber++}`)
      seatRows.value.push({ left, right })
    }

    const savedSeats = localStorage.getItem(`bookedSeats_${queueOp.queue_id}`)
    bookedSeats.value = savedSeats ? JSON.parse(savedSeats) : []

  } catch (err) {
    console.error(err)
    error.value = err
  } finally {
    loading.value = false
  }
}

// เปลี่ยนสถานะที่นั่ง
function toggleSeat(seat) {
  if (bookedSeats.value.includes(seat)) return
  const index = selectedSeats.value.indexOf(seat)
  if (index > -1) selectedSeats.value.splice(index, 1)
  else selectedSeats.value.push(seat)
}

// ✅ ยืนยันการจอง → update seats_reserved & seats_available ใน Bus_queue_op
async function confirmBooking() {
  if (!selectedSeats.value.length) {
    alert('ເລືອກບ່ອນນັ່ງກ່ອນ!')
    return
  }

  const reserveCount = selectedSeats.value.length
  const totalAmount = reserveCount * (Number(busInfo.price) || 0)
  const newReserved = busInfo.seats_reserved + reserveCount
  const newAvailable = busInfo.bus_capacity - newReserved

  try {
    await apolloClient.mutate({
      mutation: UPDATE_QUEUE_SEATS,
      variables: { 
        queue_id: busInfo.queue_id,
        new_reserved: newReserved, 
        new_available: newAvailable 
      }
    })

    bookedSeats.value.push(...selectedSeats.value)
    busInfo.seats_reserved = newReserved
    busInfo.seats_available = newAvailable
    localStorage.setItem(`bookedSeats_${busInfo.queue_id}`, JSON.stringify(bookedSeats.value))

    const seatsToSend = [...selectedSeats.value]
    selectedSeats.value.splice(0, selectedSeats.value.length)

    router.push({
      name: "detail",
      params: { id: queueId },
      query: { seats: seatsToSend.join(','), totalPrice: totalAmount }
    })

  } catch (err) {
    console.error(err)
    alert('ເກີດຂໍ້ຜິດພາດໃນການຈອງ')
  }
}

function back() {
  router.back()
}

onMounted(loadQueue)
</script>


<template>
  <v-container>
    <h1 align="center" class="page-title">ຈຳນວນບ່ອນນັ່ງ</h1>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <div class="content-wrapper">
        <!-- seat layout -->
        <div class="bus-layout">
          <div v-for="(row, index) in seatRows" :key="index" class="row">
            <div class="side">
              <button
                v-for="seat in row.left"
                :key="seat"
                class="seat"
                :class="{ selected: selectedSeats.includes(seat), booked: bookedSeats.includes(seat) }"
                @click="toggleSeat(seat)"
                :disabled="bookedSeats.includes(seat)"
              >{{ seat }}</button>
            </div>
            <div class="aisle"></div>
            <div class="side">
              <button
                v-for="seat in row.right"
                :key="seat"
                class="seat"
                :class="{ selected: selectedSeats.includes(seat), booked: bookedSeats.includes(seat) }"
                @click="toggleSeat(seat)"
                :disabled="bookedSeats.includes(seat)"
              >{{ seat }}</button>
            </div>
          </div>
        </div>

        <!-- bus info -->
        <div class="bus-info">
          <p><strong>ຕົ້ນທາງ-ປາຍທາງ:</strong> {{ busInfo.bq_distance }}</p>
          <p><strong>ໂຊນ:</strong> {{ busInfo.bq_zone }}</p>
          <p><strong>ລາຄາຕໍ່ບ່ອນ:</strong> {{ formatPrice(busInfo.price) }} ກີບ</p>
          <p><strong>ລາຄາລວມ:</strong> {{ totalPrice }} ກີບ</p>
          <p><strong>ປະເພດລົດ:</strong> {{ busInfo.category }}</p>
          <p><strong>ປ້າຍລົດ:</strong> {{ busInfo.bus_number }}</p>
          <p><strong>ວັນທີ:</strong> {{ busInfo.bq_date }}</p>
          <p><strong>ເວລາ:</strong> {{ busInfo.bq_time }}</p>
          <p><strong>ຈຳນວນບ່ອນນັ່ງທີ່ຖືກຊື້:</strong> {{ busInfo.seats_reserved }}</p>
          <p><strong>ຈຳນວນບ່ອນນັ່ງທີ່ຍັງເຫຼືອ:</strong> {{ busInfo.seats_available }}</p>

          <div v-if="selectedSeats.length" class="selected-seats">
            <strong>ເລກທີ່ນັ່ງທີ່ເລືອກ:</strong> {{ selectedSeats.join(', ') }}
          </div>

          <div class="btn-group">
            <v-btn color="info" size="small" @click="confirmDialog = true" :disabled="!selectedSeats.length">
              ຢືນຢັນບ່ອນນັ່ງ
            </v-btn>
            <v-btn color="secondary" size="small" @click="back">ຍ້ອນກັບ</v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- popup confirm -->
    <v-dialog v-model="confirmDialog" max-width="400" class="page-title">
      <v-card>
        <v-card-title>ຢືນຢັນການຊື້</v-card-title>
        <v-card-text>
          ທ່ານກຳລັງຈະຊື້ {{ selectedSeats.length }} ບ່ອນ  
         <v-card-text> ລາຄາລວມ: {{ totalPrice }} ກີບ</v-card-text>
        <v-card-text>
          ໝາຍເຫດ: ເມື່ອກົດຢືນຢັນຈະບໍ່ສາມາດເເກ້ໃຂໃດ້
        </v-card-text>
        </v-card-text>
        <v-card-actions>
          <v-btn color="secondary" @click="confirmDialog = false">ຍົກເລີກ</v-btn>
          <v-btn color="primary" @click="() => { confirmDialog = false; confirmBooking(); }">ຢືນຢັນ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>


<style scoped>
.page-title { text-align:center; color:#2f54c0; margin-bottom:24px; font-family:'Noto Sans Lao'; }
.content-wrapper { display: flex; gap: 40px; align-items: flex-start; }
.bus-layout { flex: 1; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.row { display: flex; justify-content: center; gap: 20px; align-items: center; }
.side { display: flex; gap: 8px; }
.aisle { width: 40px; }
.seat { width: 50px; height: 50px; background-color: #ddd; border-radius: 6px; border: 1px solid #aaa; font-weight: 600; cursor: pointer; transition: background-color 0.3s; display: flex; justify-content: center; align-items: center; user-select: none; }
.seat.selected { background-color: #4caf50; color: white; border-color: #388e3c; }
.seat.booked { background-color: #f44336; color: white; cursor: not-allowed; border-color: #d32f2f; }
.seat:disabled { cursor: not-allowed; }
.screen { background-color: #bdead7; color: white; text-align: center; font-weight: bold; padding: 10px 0; margin-bottom: 20px; border-radius: 8px; user-select: none; }
.bus-info p { margin: 6px 0; font-size: 16px; }
.selected-seats { margin: 12px 0; font-weight: bold; color: #4caf50; }
.btn-group { display: flex; gap: 10px; margin-top: 15px; }
</style>

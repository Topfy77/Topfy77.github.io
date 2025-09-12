<template>    
  <v-container>
    <h1 class="page-title">ລາຍລະອຽດປີ້ລົດ</h1>
   
    <div v-if="showSuccess" class="popup-overlay">
      <div class="popup">
        <p>ການຊື້ປີ້ລົດສຳເລັດ</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error.message }}</div>

    <div v-else-if="ticket" class="ticket-card">
      
      <div><strong>ຕົ້ນທາງ-ປາຍທາງ:</strong> {{ ticket.queue_op.bus_queue.bq_distance }}</div>
      <div class="info-row">
        <div><strong>ປ້າຍລົດ:</strong> {{ ticket.queue_op.bus.bus_number }}</div>
        <div><strong>ປະເພດລົດ:</strong> {{ ticket.queue_op.bus.category?.cat_type || '-' }}</div>
      </div>

      <div class="info-row">
        <div><strong>ລາຄາຕໍ່ທີ່ນັ່ງ:</strong> {{ ticket.tk_price }} LAK</div>
        <div><strong>ບ່ອນຈອດລົດ:</strong> {{ ticket.queue_op.bus_queue.bq_zone }}</div>
      </div>

      <div class="info-row">
        <div><strong>ວັນທີ:</strong> {{ ticket.queue_op.bus_queue.bq_date }}</div>
      </div>

      <div class="info-row">
        <div><strong>ເວລາ:</strong> {{ ticket.queue_op.bus_queue.bq_time }}</div>
      </div>

      <div v-if="selectedSeats.length > 0" class="info-row">
        <div><strong>ເລກທີ່ນັ່ງ:</strong> {{ selectedSeats.join(', ') }}</div>
      </div>

      <div class="info-row" v-if="selectedSeats.length > 0">
        <div><strong>ລາຄາລວມ:</strong> {{ totalPrice }} LAK</div>
      </div>

      <!-- ข้อมูลผู้โดยสาร -->
      <h2 class="section-title">ຂໍ້ມູນຜູ້ໂດຍສານ</h2>

      <div class="form-group">
        <input v-model="form.name" type="text" placeholder="ຊື່ຜູ້ໂດຍສານ" />
        <input v-model="form.phone" type="tel" placeholder="ເບີໂທ" />
      </div>

      <div class="form-group">
        <select v-model="form.gender">
          <option disabled value="">ເລືອກເພດ</option>
          <option value="male">ຜູ້ຊາຍ</option>
          <option value="female">ຜູ້ຍິງ</option>
        </select>

        <select v-model="form.payment">
          <option disabled value="">ຮູບແບບການຈ່າຍ</option>
          <option value="transfer">ເງິນໂອນ</option>
          <option value="cash">ເງິນສົດ</option>
        </select>
      </div>
      
      <button class="confirm-btn" @click="confirm">ຢືນຢັນການຊື້</button>
      <button class="confirm-btn" @click="backbtn()">ຍ້ອນກັບ</button>
    
    </div>

    <div v-else class="no-data">ບໍ່ມີຂໍ້ມູນປີ້ລົດຄັນນີ້</div>
 </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const ticket = ref(null)
const loading = ref(true)
const error = ref(null)

const form = ref({
  name: '',
  phone: '',
  gender: '',
  payment: ''
})

const selectedSeats = computed(() => {
  const seats = route.query.seats
  return seats ? seats.split(',') : []
})

// คำนวณราคารวม = ราคาต่อที่นั่ง * จำนวนที่นั่ง
const totalPrice = computed(() => {
  if (!ticket.value) return 0
  return ticket.value.tk_price * selectedSeats.value.length
})

const GET_TICKET_BY_ID = gql`
  query GetTicketById($id: Int!) {
    Bus_ticket_by_pk(tk_id: $id) {
      tk_id
      tk_price
      queue_op {
        bus {
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

const INSERT_USER = gql`
  mutation InsertUser($object: Bus_users_insert_input!) {
    insert_Bus_users_one(object: $object) {
      user_id
    }
  }
`

const INSERT_BILL = gql`
  mutation InsertBill($object: Bus_bill_insert_input!) {
    insert_Bus_bill_one(object: $object) {
      bill_id
    }
  }
`

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const result = await apolloClient.query({
      query: GET_TICKET_BY_ID,
      variables: { id: parseInt(route.params.id) }
    })
    ticket.value = result.data.Bus_ticket_by_pk
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
})

function backbtn(){
  router.push({name:"seat"})
}

const showSuccess = ref(false)

async function confirm() {
  if (!form.value.name || !form.value.phone || !form.value.gender || !form.value.payment) {
    alert('ກະລຸນາກອກຂໍ້ມູນທີ່ຈຳເປັນ')
    return
  }

  try {
    // เพิ่มผู้ใช้
    const userResult = await apolloClient.mutate({
      mutation: INSERT_USER,
      variables: {
        object: {
          user_name: form.value.name,
          user_tel: form.value.phone.toString(),
          user_gender: form.value.gender
        }
      }
    })

    const userId = userResult.data.insert_Bus_users_one.user_id

    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const tzOffset = -now.getTimezoneOffset() 
    const sign = tzOffset >= 0 ? '+' : '-'
    const hoursOffset = String(Math.floor(Math.abs(tzOffset)/60)).padStart(2,'0')
    const minutesOffset = String(Math.abs(tzOffset)%60).padStart(2,'0')
    const billTimeWithTZ = `${hours}:${minutes}${sign}${hoursOffset}:${minutesOffset}`

    // ส่งราคารวมไป insert ในบิล
    const billResult = await apolloClient.mutate({
      mutation: INSERT_BILL,
      variables: {
        object: {
          bill_payment: form.value.payment,
          bill_amout: totalPrice.value.toString(),  // ใช้ราคารวม
          datetime: new Date().toISOString(),
          tk_id: ticket.value.tk_id,
          user_id: userId,
          bill_time: billTimeWithTZ
        }
      }
    })

    const billId = billResult.data.insert_Bus_bill_one.bill_id

    showSuccess.value = true

    setTimeout(() => {
      router.push({
        name: 'bill',
        query: {
          bill_id: billId,
          tk_id: ticket.value.tk_id,
          phone: form.value.phone,
          name: form.value.name,
          seats: selectedSeats.value.join(','),
        }
      })
    }, 2000)

  } catch (err) {
    console.error('Insert failed:', err)
    alert('ບັນທຶກບໍ່ສຳເລັດ')
  }
}
</script>

<style scoped>
.content {
  max-width: 700px;
  margin: 40px auto;
  padding: 2em;
  font-family: 'Noto Sans Lao', sans-serif;
  background-color: #fff;
}

.page-title {
  text-align: center;
  color: #2f54c0;
  margin-bottom: 24px;
  font-family: 'Noto Sans Lao', sans-serif;
}

.ticket-card {
  font-family: 'Noto Sans Lao', sans-serif;
  background: #f9f9f9;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.info-row {
  font-family: 'Noto Sans Lao', sans-serif;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 16px;
}

.section-title {
  font-family: 'Noto Sans Lao', sans-serif;
  margin-top: 24px;
  margin-bottom: 12px;
  color: #333;
}

.form-group {
  font-family: 'Noto Sans Lao', sans-serif;
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

input, select {
  flex: 1;
  font-family: 'Noto Sans Lao', sans-serif;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-family: inherit;
}

.confirm-btn {
  font-family: 'Noto Sans Lao', sans-serif;
  background-color: #4372e0;
  color: white;
  padding: 12px 20px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  width: 100%;
  margin-top: 20px;
  transition: background-color 0.3s;
}

.confirm-btn:hover {
  font-family: 'Noto Sans Lao', sans-serif;
  background-color: #2f54c0;
}

.loading, .error, .no-data {
  text-align: center;
  margin-top: 40px;
  font-size: 18px;
  font-family: 'Noto Sans Lao', sans-serif;
  color: #999;
}

.popup-overlay {
  font-family: 'Noto Sans Lao', sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.popup {
  font-family: 'Noto Sans Lao', sans-serif;
  background-color: #2fe654;
  color: white;
  padding: 30px 40px;
  border-radius: 10px;
  font-size: 18px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  animation: popup-fade 0.3s ease-in-out;
}

@keyframes popup-fade {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

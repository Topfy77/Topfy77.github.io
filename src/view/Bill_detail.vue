<template>
  <div class="bill-content">
    <h1 class="title">ລາຍລະອຽດໃບບິນ</h1>

    <div v-if="loading" class="status-message">ກຳລັງໂຫຼດຂໍ້ມູນ...</div>
    <div v-else-if="error" class="status-message error">ມີບັນຫາ: {{ error.message }}</div>

    <div v-else-if="ticket" class="ticket-card">
      <div class="info-group">
        <h1>ຕົ້ນທາງ-ປາຍທາງ:{{ ticket.queue_op.bus_queue.bq_distance }}</h1>
        
        
      </div>
<div class="info-group" v-if="selectedSeats.length">
  <div><strong>ເລກທີ່ນັ່ງ:</strong> {{ selectedSeats.join(', ') }}</div>
  <div><strong>ລາຄາ:</strong> {{ ticket.tk_price }} LAK</div>
  
</div>

      <div class="info-group">
        <div><strong>ປ້າຍລົດ:</strong> {{ ticket.queue_op.bus.bus_number }}</div>
        <div><strong>ປະເພດລົດ:</strong> {{ ticket.queue_op.bus.category?.cat_type || '-' }}</div>
      </div>

      <div class="info-group">
        <div><strong>ວັນທີ ອອກເດີນທາງ:</strong> {{ ticket.queue_op.bus_queue.bq_date }}</div>
        <div><strong>ເວລາ ອອກເດີນທາງ:</strong> {{ ticket.queue_op.bus_queue.bq_time }}</div>
      </div>

      <div class="info-group">
        <div><strong>ໂຊນບ່ອນຂຶ້ນລົດ:</strong> {{ ticket.queue_op.bus_queue.bq_zone }}</div>
        <div><strong>ລາຄາລວມທັງໝົດ:</strong> {{ totalPrice }} LAK</div>
      </div>

      <div class="info-group">
        <div><strong>ຊື່ຜູ້ໂດຍສານ:</strong> {{ userName }}</div>
        <div><strong>ເບີໂທຜູ້ໂດຍສານ:</strong> {{ userPhone }}</div>
      </div>

      <button class="back-btn" @click="backhome()">ກັບໄປໜ້າຫຼັກ</button>
    </div>

    <div v-else class="status-message">ບໍ່ພົບຂໍ້ມູນປີ້</div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

const userPhone = route.query.phone
const userName = route.query.name

const ticket = ref(null)
const loading = ref(true)
const error = ref(null)

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


const selectedSeats = route.query.seats ? route.query.seats.split(',') : []

const totalPrice = computed(() => {
  if (!ticket.value) return 0
  return ticket.value.tk_price * selectedSeats.length
})


function backhome() {
  router.push({ name: "bus-queue" ,
     query: {
      tk_id: ticket.value.tk_id,
      seats: selectedSeats.join(','),
      name: userName,
      phone: userPhone
    }
  })
  
}

onMounted(async () => {
  const tkId = parseInt(route.query.tk_id)
  if (!tkId) {
    error.value = new Error('tk_id is required')
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await apolloClient.query({
      query: GET_TICKET_BY_ID,
      variables: { id: tkId }
    })
    ticket.value = result.data.Bus_ticket_by_pk
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
})
</script>
<style scoped>
.bill-content {

  max-width: 600px;
  margin: 40px auto;
  padding: 2em;
  font-family: 'Noto Sans Lao', sans-serif;
  background-color: #ffffff;
}

.title {
  text-align: center;
  font-size: 28px;
  margin-bottom: 24px;
  color: #2f54c0;
}

.status-message {
  text-align: center;
  font-size: 16px;
  color: #888;
  margin-top: 40px;
}

.status-message.error {
  color: red;
}

.ticket-card {
  background: #f9f9f9;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.info-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
  font-size: 16px;
}

.back-btn {
  margin-top: 24px;
  background-color: #4372e0;
  color: #fff;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
  cursor: pointer;
  font-family: 'Noto Sans Lao', sans-serif;
  transition: background-color 0.3s;
}

.back-btn:hover {
    font-family: 'Noto Sans Lao', sans-serif;
  background-color: #2f54c0;
}
</style>


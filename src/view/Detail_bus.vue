<template>
  <v-container>
    <h1 class="page-title">ລາຍລະອຽດປີ້ລົດ</h1>

    <!-- Popup success -->
    <div v-if="showSuccess" class="popup-overlay">
      <div class="popup">
        <p>ການຊື້ປີ້ລົດສຳເລັດ</p>
      </div>
    </div>

    <!-- Loading & Error -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error.message }}</div>

    <!-- Ticket / Bill Details -->
    <div v-else-if="ticket" class="ticket-card" align="center">
      <div>
        <h1>ຕົ້ນທາງ-ປາຍທາງ: {{ ticket.bus_queue?.bq_distance || '-' }}</h1>
      </div>

      <div class="info-row">
        <div><strong>ປ້າຍລົດ:</strong> {{ ticket.bus?.bus_number || '-' }}</div>
        <div><strong>ປະເພດລົດ:</strong> {{ ticket.bus?.category?.cat_type || '-' }}</div>
      </div>

      <div class="info-row">
        <div><strong>ລາຄາຕໍ່ທີ່ນັ່ງ:</strong> {{ ticket.price?.price || '0.000' }} LAK</div>
        <div><strong>ບ່ອນຈອດລົດ:</strong> {{ ticket.zone?.zone || '-' }}</div>
      </div>

      <div class="info-row" v-if="selectedSeats.length > 0">
        <p><strong>ເລືອກບ່ອນນັ່ງ:</strong> {{ selectedSeats.join(', ') }}</p>
        <p><strong>ລາຄາລວມ:</strong> {{ totalPrice }} ກີບ</p>
      </div>

      <!-- Passenger Info -->
      <h2 class="section-title">ຂໍ້ມູນຜູ້ໂດຍສານ</h2>
      <div class="form-group">
        <input v-model="form.name" type="text" placeholder="ຊື່ຜູ້ໂດຍສານ" />
        <input v-model="form.phone" type="tel" placeholder="ເບີໂທ" />
      </div>

      <div class="form-group">
        <select v-model="form.gender">
          <option disabled value="">ເລືອກເພດ</option>
          <option value="ຜູ້ຊາຍ">ຜູ້ຊາຍ</option>
          <option value="ຜູ້ຍີງ">ຜູ້ຍິງ</option>
        </select>

        <select v-model="form.payment">
          <option disabled value="">ຮູບແບບການຊຳລະເງີນ</option>
          <option value="ເງີນສົດ">ເງິນສົດ</option>
          <option value="ເງີນໂອນ">ເງິນໂອນ</option>
          
        </select>
      </div>

      <div class="buttons">
        <button class="confirm-btn" @click="handleBooking">ຊຳລະເງິນ / ຢືນຢັນການຊື້</button>
       
      </div>
    </div>

    <!-- No Data -->
    <div v-else class="no-data">
      ບໍ່ມີຂໍ້ມູນປີ້ລົດ
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const ticket = ref(null)
const showSuccess = ref(false)
const form = ref({ name:'', phone:'', gender:'', payment:'' })

// reactive array สำหรับ selectedSeats
const selectedSeats = ref(route.query.seats ? route.query.seats.split(',') : [])

// totalPrice เป็น string พร้อม .000
const totalPrice = computed(() => {
  const price = parseFloat(ticket.value?.price?.price) || 0
  const seatCount = selectedSeats.value.length || 0
  return (price * seatCount).toFixed(3) // string เช่น "50000.000"
})

// GraphQL Queries & Mutations
const GET_QUEUE_DETAILS = gql`
query GetQueueDetails($id: Int!) {
  Bus_queue_op_by_pk(queue_id: $id) {
    queue_id
    Date
    time { time }
    bus_queue { bq_distance }
    bus { bus_number bus_capacity category { cat_type } }
    zone { zone }
    price { price }
  }
}`

const INSERT_USER = gql`
mutation InsertUser($object: Bus_users_insert_input!) {
  insert_Bus_users_one(object: $object) { user_id }
}`

const INSERT_BILL = gql`
mutation InsertBill($object: Bus_bill_insert_input!) {
  insert_Bus_bill_one(object: $object) { bill_id }
}`

onMounted(async () => {
  try {
    const queueId = parseInt(route.params.id)
    const result = await apolloClient.query({ query: GET_QUEUE_DETAILS, variables: { id: queueId } })
    ticket.value = result.data.Bus_queue_op_by_pk
  } catch (err) {
    error.value = err
    console.error(err)
  } finally { loading.value = false }
})



async function handleBooking() {
  if (!form.value.name || !form.value.phone || !form.value.gender || !form.value.payment) {
    alert('กรุณากรอกข้อมูลที่จำเป็น')
    return
  }
  if (!selectedSeats.value.length) { 
    alert('กรุณาเลือกที่นั่ง') 
    return 
  }

  const tkPrice = parseFloat(ticket.value?.price?.price) || 0
  const totalAmount = (tkPrice * selectedSeats.value.length).toFixed(3) // string พร้อม .000
  const queueId = parseInt(route.params.id)

  try {
    // Insert user
    const userResult = await apolloClient.mutate({
      mutation: INSERT_USER,
      variables: { object: { user_name: form.value.name, user_tel: form.value.phone, user_gender: form.value.gender } }
    })
    const userId = userResult.data.insert_Bus_users_one.user_id

    // Insert ticket
    const INSERT_TICKET = gql`
      mutation InsertTicket($object:Bus_ticket_insert_input!) {
        insert_Bus_ticket_one(object: $object) { tk_id tk_price }
      }
    `
    const ticketResult = await apolloClient.mutate({
      mutation: INSERT_TICKET,
      variables: { object: { queue_id: queueId, tk_price: tkPrice.toFixed(3) } } // ส่ง string
    })
    const tk_id = ticketResult.data.insert_Bus_ticket_one.tk_id

    // Insert bill
    const billResult = await apolloClient.mutate({
      mutation: INSERT_BILL,
      variables: { object: { 
        bill_payment: form.value.payment,
        bill_amout: totalAmount, 
        datetime: new Date().toISOString(),
        tk_id, 
        user_id: userId,
        bill_time: new Date().toLocaleTimeString()
      }}
    })
    const billId = billResult.data.insert_Bus_bill_one.bill_id

    showSuccess.value = true

    // เก็บข้อมูลก่อนล้าง selectedSeats
    const seatsToSend = [...selectedSeats.value]
    selectedSeats.value.splice(0, selectedSeats.value.length)

    // ส่งไปหน้า bill
    setTimeout(() => {
      router.push({
        name: 'bill',
        params: { id: billId }, 
        query: {
          
          tk_id,
          name: form.value.name,
          phone: form.value.phone,
          seats: seatsToSend.join(','),
          totalPrice: totalAmount
        }
      })
    }, 2000)

  } catch (err) {
    console.error(err)
    alert('บันทึกไม่สำเร็จ: ' + err.message)
  }
}
</script>

<style scoped>
.page-title { text-align:center; color:#2f54c0; margin-bottom:24px; font-family:'Noto Sans Lao'; }
.ticket-card { background:#f9f9f9; padding:25px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
.info-row { display:flex; justify-content:space-between; margin-bottom:12px; font-size:16px; }
.section-title { margin-top:24px; margin-bottom:12px; color:#333; }
.form-group { display:flex; gap:10px; margin-bottom:16px; }
input, select { flex:1; padding:10px 12px; font-size:16px; border:1px solid #ccc; border-radius:8px; }
.confirm-btn { background:#4372e0; color:white; padding:12px 20px; font-size:16px; border:none; border-radius:8px; cursor:pointer; flex:1; margin-top:12px; }
.confirm-btn:hover { background:#2f54c0; }
.cancel-btn { background:#999; }
.buttons { display:flex; gap:10px; margin-top:20px; }
.loading, .error, .no-data { text-align:center; margin-top:40px; font-size:18px; color:#999; }
.popup-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999; }
.popup { background:#2fe654; color:white; padding:30px 40px; border-radius:10px; font-size:18px; text-align:center; box-shadow:0 8px 25px rgba(0,0,0,0.2); animation:popup-fade 0.3s ease-in-out; }
@keyframes popup-fade { from{opacity:0; transform:scale(0.9);} to{opacity:1; transform:scale(1);} }
</style>

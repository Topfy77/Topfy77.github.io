<template>
  <v-container align="center" >
    <h1 class="page-title">ລາຍລະອຽດບິນ</h1>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error.message }}</div>

    <div v-else-if="ticket" class="ticket-card">
      <div>
      <h2>ຕົ້ນທາງ-ປາຍທາງ: {{ ticket.bus_queue?.bq_distance || '-' }}</h2></div>


      <div class="info-row">
        <div><strong>ປ້າຍລົດ:</strong> {{ ticket.bus?.bus_number || '-' }}</div>
        <div><strong>ປະເພດລົດ:</strong> {{ ticket.bus?.category?.cat_type || '-' }}</div>
      </div>

      <div class="info-row">
        <div><strong>ລາຄາຕໍ່ທີ່ນັ່ງ:</strong> {{ ticket.price?.price || '0.000' }} LAK</div>
        <div><strong>ລາຄາລວມ:</strong> {{ formattedTotalPrice }} LAK</div>
        
      </div>

      <div class="info-row">
        <div><strong>ວັນທີ:</strong> {{ ticket.Date || '-' }}</div>
        <div><strong>ເວລາ:</strong> {{ ticket.time?.time || '-' }}</div>
      </div>

      <div v-if="seats.length" class="info-row">
        <div><strong>ເລກທີ່ນັ່ງ:</strong> {{ seats.join(', ') }}</div>
        <div><strong>ບ່ອນຈອດລົດ:</strong> {{ ticket.zone?.zone || '-' }}</div>
      </div>

      <h2 class="section-title">ຂໍ້ມູນຜູ້ໂດຍສານ</h2>
      <div class="form-group">
        <input type="text" :value="name" disabled />
        <input type="tel" :value="phone" disabled /> 
      </div>

      
      <v-btn color="info" size="small"  @click="backToHome" align="center"> ກັບຫາໜ້າຫລັກ</v-btn>
    </div>

    <div v-else class="no-data">
      ບໍ່ມີຂໍ້ມູນບິນ
    </div>
    
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const ticket = ref(null)

// รับข้อมูลจาก query
const tk_id = route.query.tk_id
const seats = route.query.seats ? route.query.seats.split(',') : []
const name = route.query.name || ''
const phone = route.query.phone || ''
const totalPrice = parseFloat(route.query.totalPrice || 0)

// totalPrice แสดง .000
const formattedTotalPrice = computed(() => totalPrice.toFixed(3))

const GET_TICKET_DETAILS = gql`
query GetTicket($id: Int!) {
  Bus_ticket_by_pk(tk_id: $id) {
    tk_id
    tk_price
    queue_op {
      Date
      time { time }
      bus_queue { bq_distance }
      bus {
        bus_number
        category { cat_type }
      }
      zone { zone }
      price { price }
    }
  }
}`

onMounted(async () => {
  if(!tk_id) {
    loading.value = false
    return
  }

  try {
    const result = await apolloClient.query({
      query: GET_TICKET_DETAILS,
      variables: { id: parseInt(tk_id) }
    })
    ticket.value = result.data.Bus_ticket_by_pk.queue_op
  } catch (err) {
    error.value = err
    console.error(err)
  } finally {
    loading.value = false
  }
})

function backToHome() {
  router.push({ name: 'bus-queue' }) 
}
</script>

<style scoped>
.page-title { text-align:center; color:#2f54c0; margin-bottom:24px; font-family:'Noto Sans Lao'; }
.ticket-card { background:#f9f9f9; padding:25px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
.info-row { display:flex; justify-content:space-between; margin-bottom:12px; font-size:16px; }
.section-title { margin-top:24px; margin-bottom:12px; color:#333; }
.form-group { display:flex; gap:10px; margin-bottom:16px; }
input { flex:1; padding:10px 12px; font-size:16px; border:1px solid #ccc; border-radius:8px; background:#eee; }
.confirm-btn { background:#4372e0; color:white; padding:12px 20px; font-size:16px; border:none; border-radius:8px; cursor:pointer; flex:1; margin-top:12px; }
.confirm-btn:hover { background:#2f54c0; }
.loading, .error, .no-data { text-align:center; margin-top:40px; font-size:18px; color:#999; }
</style>

<template> 
  <v-container>
    <h1 align="center" class="page-title">ລາຍລະອຽດລົດ</h1>
<div class="text-end mt-5"><v-btn color="info" size="small" @click="goBack">
      ຍ້ອນກັບ
    </v-btn></div>
    
<div class="mt-5"></div>
    <!-- ตารางข้อมูล -->
    <v-data-table 
      :headers="headers"
      :items="busDetailsFormatted"
      :loading="loading"
      item-key="queue_id"
      hide-default-footer
      class="elevation-1"
    >
      <template v-slot:item.Date="{ item }">{{ item.Date }}</template>
      <template v-slot:item.bq_distance="{ item }">{{ item.bus_queue?.bq_distance }}</template>
      <template v-slot:item.time="{ item }">{{ item.time?.time }}</template>
      <template v-slot:item.bus_number="{ item }">{{ item.bus?.bus_number }}</template>
      <template v-slot:item.bus_capacity="{ item }">{{ item.bus?.bus_capacity }}</template>
      <template v-slot:item.seats_reserved="{ item }">{{ item.seats_reserved }}</template>
      <template v-slot:item.seats_available="{ item }">{{ item.seats_available }}</template>
      <template v-slot:item.category="{ item }">{{ item.bus?.category?.cat_type }}</template>
      <template v-slot:item.zone="{ item }">{{ item.zone?.zone }}</template>
      <template v-slot:item.price="{ item }">{{ item.price?.price }}</template>

      <template  v-slot:item.actions="{ item }">
        <v-btn color="info" size="small" @click="goToDetails(item)">
          ລາຍລະອຽດ
        </v-btn>
      </template>
    </v-data-table>

    <!-- Pagination -->
    <v-row align="center" class="mt-4">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          Items per page:
          <v-select
            :items="limits"
            v-model="pagination.limit"
            dense
            hide-details
            style="width:80px"
            @change="changePage(1)"
          ></v-select>
        </div>
        <div>
          {{ startItem }}-{{ endItem }} of {{ total }}
          <v-btn icon @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1">
            &lt;
          </v-btn>
          <v-btn icon @click="changePage(pagination.page + 1)" :disabled="pagination.page >= totalPages">
            &gt;
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <div v-if="!busDetailsFormatted.length && !loading" class="text-center" style="margin-top: 30px;">
      <p>ບໍ່ພົບຂໍ້ມູນສໍາລັບມື້ນີ້</p>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

const route = useRoute()
const router = useRouter()

// States
const loading = ref(false)
const busDetails = ref([])
const total = ref(0)
const limits = [5, 10, 15, 20]
const pagination = ref({ page: 1, limit: 10 })

// Headers
const headers = [
  { title: 'ວັນທີ', value: 'Date' },
  { title: 'ເສັ້ນທາງ', value: 'bq_distance' },
  { title: 'ເວລາ', value: 'time' },
  { title: 'ປ້າຍລົດ', value: 'bus_number' },
  { title: 'ຈຳນວນບ່ອນນັ່ງ', value: 'bus_capacity' },
  { title: 'ຖືກຈອງແລ້ວ', value: 'seats_reserved' },
  { title: 'ຍັງວ່າງ', value: 'seats_available' },
  { title: 'ປະເພດລົດ', value: 'category' },
  { title: 'ໂຊນ', value: 'zone' },
  { title: 'ລາຄາ', value: 'price' },
  { title: 'ການຈັດການ', value: 'actions', sortable: false }
]

// GraphQL Query พร้อม limit/offset
const GET_QUEUE_DETAILS = gql`
  query GetQueueDetailsByDate($bqId: Int!, $date: date!, $limit: Int!, $offset: Int!) {
    Bus_queue_op (
      where: { bus_queue: { bq_id: { _eq: $bqId } }, Date: { _eq: $date } }
      limit: $limit
      offset: $offset
      
    ) {
      queue_id
      Date
      seats_reserved
      seats_available
      bus_queue { bq_id bq_distance }
      time { time }
      bus {
        bus_number
        bus_capacity
        category { cat_type }
      }
      zone { zone }
      price { price }
    }

    Bus_queue_op_aggregate(
      where: { bus_queue: { bq_id: { _eq: $bqId } }, Date: { _eq: $date } }
    ) {
      aggregate { count(columns: queue_id) }
    }
  }
`

// ฟังก์ชันย้อนกลับ
function goBack() {
  router.push({ name: 'bus-queue' })
}

// ฟังก์ชันเปลี่ยนหน้า
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  pagination.value.page = page
  loadBusDetails()
}

// Computed
const totalPages = computed(() => Math.ceil(total.value / pagination.value.limit))
const startItem = computed(() => (pagination.value.page - 1) * pagination.value.limit + 1)
const endItem = computed(() => Math.min(pagination.value.page * pagination.value.limit, total.value))

// แปลงวันที่ให้สวยงาม
function formatDateDisplay(date) {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// computed แสดงผล
const busDetailsFormatted = computed(() =>
  busDetails.value.map(item => ({
    ...item,
    Date: formatDateDisplay(item.Date)
  }))
)

// โหลดข้อมูลจาก Hasura
async function loadBusDetails() {
  loading.value = true
  try {
    const bqId = Number(route.params.bq_id)
    const date = route.params.date || new Date().toISOString().slice(0, 10)
    const offset = (pagination.value.page - 1) * pagination.value.limit

    const { data } = await apolloClient.query({
      query: GET_QUEUE_DETAILS,
      variables: { bqId, date, limit: pagination.value.limit, offset },
      fetchPolicy: 'network-only'
    })

    busDetails.value = data.Bus_queue_op
    total.value = data.Bus_queue_op_aggregate.aggregate.count
  } catch (err) {
    console.error('Error loading details:', err)
  } finally {
    loading.value = false
  }
}

function goToDetails(item) {
  router.push({ name: 'seat', params: { id: item.queue_id } })
}

onMounted(loadBusDetails)
watch(() => pagination.value.limit, () => loadBusDetails())
</script>

<style>
.page-title {
  text-align: center;
  color: #2f54c0;
  margin-bottom: 24px;
  font-family: 'Noto Sans Lao';
}
</style>

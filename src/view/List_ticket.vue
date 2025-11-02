<template>
  <v-container>
    <h1 class="page-title">ລາຍລະອຽດປີ້ລົດມື້ນີ້</h1>

    <!-- Search Bar -->
    <div class="search-bar">
      <v-text-field
        v-model="searchDistance"
        label="ໄລຍະທາງ"
        dense
        outlined
      ></v-text-field>

      <!-- Date Picker -->
      <v-menu
        v-model="datePickerMenu"
        :close-on-content-click="false"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template #activator="{ props }">
          <v-text-field
            v-model="searchDateFormatted"
            label="ວັນທີ່"
            readonly
            v-bind="props"
            dense
            outlined
          ></v-text-field>
        </template>
        <v-date-picker
          v-model="searchDate"
          @update:modelValue="updateDateFormatted"
        ></v-date-picker>
      </v-menu>

      <v-btn color="primary" @click="changePage(1)">ຄົ້ນຫາ</v-btn>
    </div>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" dense outlined class="mb-4">
      {{ error.message || error }}
    </v-alert>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="bills"
      :loading="loading"
      item-key="bill_id"
      :items-per-page="pagination.limit"
      hide-default-footer
      class="elevation-1"
    >
      <template v-slot:item="{ item }">
        <tr>
          <td>{{ formatDate(item.datetime) }}</td>
          <td>{{ formatTime(item.bill_time) }}</td>
          <td>{{ item.ticket?.queue_op?.bus_queue?.bq_distance || '-' }}</td>
          <td>{{ item.user?.user_name || '-' }}</td>
          <td>{{ item.user?.user_tel || '-' }}</td>
          <td>{{ item.user?.user_gender || '-' }}</td>
          <td>{{ item.ticket?.queue_op?.bus?.bus_number || '-' }}</td>
          <td>{{ item.ticket?.tk_price || '-' }}</td>
          <td>{{ item.bill_payment || '-' }}</td>
          <td>{{ item.bill_amout || '-' }}</td>
          <td>{{ item.ticket?.queue_op?.time?.time || '-' }}</td>
          <td>{{ formatDate(item.ticket?.queue_op?.Date) }}</td>
        </tr>
      </template>

      <template v-slot:no-data>
        <tr>
          <td colspan="12" class="text-center">ບໍ່ມີຂໍ້ມູນບິນ</td>
        </tr>
      </template>

      <template #loading>
        <tr>
          <td colspan="12" class="text-center">Loading...</td>
        </tr>
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
          <v-btn icon @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1"><</v-btn>
          <v-btn icon @click="changePage(pagination.page + 1)" :disabled="pagination.page >= totalPages">></v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

// 🧾 Header ตาราง
const headers = [
  { title: 'ວັນທີ່ຊື້ປີ້ລົດ', value: 'datetime' },
  { title: 'ເວລາຊື້ປີ້ລົດ', value: 'bill_time' },
  { title: 'ໄລຍະທາງ', value: 'ticket.queue_op.bus_queue.bq_distance' },
  { title: 'ຊື່ຄົນຊື້ປີ້ລົດ', value: 'user.user_name' },
  { title: 'ເບີໂທຕິດຕໍ່', value: 'user.user_tel' },
  { title: 'ເພດ', value: 'user.user_gender' },
  { title: 'ປ້າຍລົດເມ', value: 'ticket.queue_op.bus.bus_number' },
  { title: 'ລາຄາ(ຕໍ່ປີ້)', value: 'ticket.tk_price' },
  { title: 'ຮູບເເບບການຊຳລະເງີນ', value: 'bill_payment' },
  { title: 'ຈຳນວນເງິນທັງໝົດ', value: 'bill_amout' },
  { title: 'ເວລາອອກເດີນທາງ', value: 'ticket.queue_op.time.time' },
  { title: 'ວັນທີ່ອອກເດີນທາງ', value: 'ticket.queue_op.Date' }
]

// 🔧 State หลัก
const bills = ref([])
const loading = ref(false)
const error = ref(null)
const total = ref(0)
const pagination = ref({ page: 1, limit: 10 })
const limits = [5, 10, 15, 20]

// 🔍 Search
const searchDistance = ref('')
const searchDate = ref(null)
const searchDateFormatted = ref('')
const datePickerMenu = ref(false)

// 🗓️ คืนค่า yyyy-mm-dd ของวันนี้
function getTodayDate() {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// แปลงวันที่ในช่องค้นหา
function updateDateFormatted() {
  if (!searchDate.value) { searchDateFormatted.value = ''; return }
  const d = new Date(searchDate.value)
  searchDateFormatted.value = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function formatDateForHasura(ddmmyyyy) {
  if (!ddmmyyyy) return null
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  return `${yyyy}-${mm}-${dd}`
}

// 🚀 โหลดข้อมูล
async function loadBills() {
  loading.value = true
  error.value = null
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const distanceVar = searchDistance.value ? `%${searchDistance.value}%` : '%'

    // ✅ เงื่อนไขหลัก: แสดงเฉพาะข้อมูลของวันนี้ (หรือวันที่ค้นหา)
    const today = getTodayDate()
    const selectedDate = searchDateFormatted.value
      ? formatDateForHasura(searchDateFormatted.value)
      : today

    const filters = {
      _and: [
        {
          ticket: {
            queue_op: {
              bus_queue: { bq_distance: { _ilike: distanceVar } }
            }
          }
        },
        { datetime: { _eq: selectedDate } } // ✅ เฉพาะวันที่ที่เลือก หรือวันนี้
      ]
    }

    const { data } = await apolloClient.query({
      query: gql`
        query GetBills($limit:Int, $offset:Int, $filters:Bus_bill_bool_exp!) {
          Bus_bill(
            where: $filters,
            limit: $limit,
            offset: $offset,
            order_by: { bill_id: desc }
          ) {
            bill_id
            bill_payment
            bill_amout
            datetime
            bill_time
            ticket {
              tk_price
              queue_op {
                Date
                bus { bus_number }
                time { time }
                bus_queue { bq_distance }
              }
            }
            user {
              user_name
              user_tel
              user_gender
            }
          }
          Bus_bill_aggregate(where: $filters) {
            aggregate { count }
          }
        }
      `,
      variables: { limit: pagination.value.limit, offset, filters },
      fetchPolicy: "network-only"
    })

    bills.value = data.Bus_bill
    total.value = data.Bus_bill_aggregate.aggregate.count
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
}

// 📄 เปลี่ยนหน้า
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  pagination.value.page = page
  loadBills()
}

const totalPages = computed(() => Math.ceil(total.value / pagination.value.limit))
const startItem = computed(() => (pagination.value.page - 1) * pagination.value.limit + 1)
const endItem = computed(() => Math.min(pagination.value.page * pagination.value.limit, total.value))

// 🕓 Format วันที่ เวลา
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function formatTime(timeStr) { return timeStr ? timeStr.slice(0, 5) : '-' }

// ⚡ เริ่มต้นโหลดเฉพาะข้อมูล "วันนี้"
onMounted(() => loadBills())

// 📊 Reload เมื่อเปลี่ยนจำนวนรายการต่อหน้า
watch(() => pagination.value.limit, () => changePage(1))
</script>


<style scoped>
.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}
.v-data-table thead th {
  background-color: #4372e0;
  color: white;
  font-weight: bold;
}
</style>

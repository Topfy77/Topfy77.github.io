<template> 
  <v-container>
    <h1>ລາຍລະອຽດປີ້ລົດມື້ນີ້</h1>

    <div class="search-bar">
      <v-text-field
        v-model="searchDistance"
        label="ຄົ້ນຫາ: ລະຍະທາງ"
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

      <!-- Time Picker -->
      <v-menu
        v-model="timePickerMenu"
        :close-on-content-click="false"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template #activator="{ props }">
          <v-text-field
            v-model="searchTime"
            label="ເວລາໃບບິນ"
            readonly
            v-bind="props"
            dense
            outlined
          ></v-text-field>
        </template>
        <v-time-picker
          v-model="searchTime"
          format="24hr"
        ></v-time-picker>
      </v-menu>

      <v-btn @click="searchBills" color="primary">ຄົ້ນຫາ</v-btn>
    </div>

    <v-alert
      v-if="error"
      type="error"
      dense
      outlined
      class="mb-4"
    >
      {{ error.message || error }}
    </v-alert>

    <v-data-table
      :headers="headers"
      :items="displayedBills"
      :items-per-page="rowsPerPage"
      class="elevation-1"
      :loading="loading"
      item-value="bill_id"
    >
      <template v-slot:item.user.user_name="{ item }">
        {{ item.user?.user_name || '-' }}
      </template>
      <template v-slot:item.user.user_tel="{ item }">
        {{ item.user?.user_tel || '-' }}
      </template>
      <template v-slot:item.user.user_gender="{ item }">
        {{ item.user?.user_gender || '-' }}
      </template>
      <template v-slot:item.ticket.queue_op.bus.bus_number="{ item }">
        {{ item.ticket?.queue_op?.bus?.bus_number || '-' }}
      </template>
      <template v-slot:item.ticket.queue_op.bus_queue.bq_time="{ item }">
        {{ item.ticket?.queue_op?.bus_queue?.bq_time || '-' }}
      </template>
      <template v-slot:item.ticket.queue_op.bus_queue.bq_distance="{ item }">
        {{ item.ticket?.queue_op?.bus_queue?.bq_distance || '-' }}
      </template>
      <template v-slot:item.ticket.tk_price="{ item }">
        {{ item.ticket?.tk_price || '-' }}
      </template>
      <template v-slot:item.bill_payment="{ item }">
        {{ item.bill_payment || '-' }}
      </template>
      <template v-slot:item.bill_amout="{ item }">
        {{ item.bill_amout || '-' }}
      </template>
      <template v-slot:item.datetime="{ item }">
        {{ formatDate(item.datetime) }}
      </template>
      <template v-slot:item.bill_time="{ item }">
        {{ formatTime(item.bill_time) }}
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'




const headers = [
   { title: 'ວັນທີອອກປີ້ລົດ', value: 'datetime' },
    { title: 'ຕົ້ນທາງ - ປາຍທາງ', value: 'ticket.queue_op.bus_queue.bq_distance' },
  { title: 'ຊື່ຜູ້ໃຊ້', value: 'user.user_name' },
  { title: 'ເບີໂທຕຶດຕໍ່', value: 'user.user_tel' },
  { title: 'ເພດ', value: 'user.user_gender' },
  { title: 'ປ້າຍລົດເມ', value: 'ticket.queue_op.bus.bus_number' },
  { title: 'ເວລາອອກເດີນທາງ', value: 'ticket.queue_op.bus_queue.bq_time' },
 
  { title: 'ລາຄາ(ຕໍ່ປີ້)', value: 'ticket.tk_price' },
  { title: 'ການຊຳລະ', value: 'bill_payment' },
  { title: 'ຈຳນວນເງິນທັງໝົດ', value: 'bill_amout' },
 
  { title: 'ເວລາອອກປີ້ລົດ', value: 'bill_time' },
]

// ตัวแปรค้นหาและ Picker Menu
const searchDistance = ref('')
const searchDate = ref(null)
const searchTime = ref('')
const searchDateFormatted = ref('')
const datePickerMenu = ref(false)
const timePickerMenu = ref(false)

// ฟอร์แมตวันที่ input เป็น dd/mm/yyyy
function updateDateFormatted() {
  if (!searchDate.value) {
    searchDateFormatted.value = ''
    return
  }
  const d = new Date(searchDate.value)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  searchDateFormatted.value = `${day}/${month}/${year}`
}

// ฟอร์แมตวันที่แบบแสดงในตาราง (dd/mm/yyyy)
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// ฟอร์แมตเวลาแบบ HH:mm (ตัด +07 ออก)
function formatTime(timeStr) {
  if (!timeStr) return '-'
  return timeStr.slice(0,5)
}

// ตัวแปรและสถานะการโหลดข้อมูล
const rowsPerPage = ref(10)
const billsToday = ref([])
const billsSearch = ref([])
const loading = ref(false)
const error = ref(null)
const isSearching = ref(false)

// แสดงข้อมูลตามสถานะค้นหาหรือไม่
const displayedBills = computed(() => {
  return isSearching.value ? billsSearch.value : billsToday.value
})

// GraphQL Query ดึงบิลวันที่ระบุ
const GET_BILLS_TODAY = gql`
  query GetTodayBills($today: date!) {
    Bus_bill(where: { datetime: { _eq: $today } }) {
      bill_id
      bill_payment
      bill_amout
      datetime
      bill_time
      ticket {
        tk_price
        queue_op {
          bus {
            bus_number
          }
          bus_queue {
            bq_time
            bq_distance
          }
        }
      }
      user {
        user_name
        user_tel
        user_gender
      }
    }
  }
`

const today = new Date().toISOString().slice(0, 10)

async function loadTodayBills() {
  loading.value = true
  error.value = null
  try {
    const result = await apolloClient.query({
      query: GET_BILLS_TODAY,
      variables: { today },
    })
    billsToday.value = result.data.Bus_bill
  } catch (err) {
    error.value = err
    console.error('loadTodayBills error:', err)
  } finally {
    loading.value = false
  }
}

async function searchBills() {
  updateDateFormatted()
  error.value = null
  if (
    searchDistance.value.trim() ||
    searchDate.value ||
    searchTime.value.trim()
  ) {
    loading.value = true
    isSearching.value = true
    const dateVar = searchDate.value ? new Date(searchDate.value).toISOString().split('T')[0] : today

    try {
      const result = await apolloClient.query({
        query: GET_BILLS_TODAY,
        variables: { today: dateVar },
      })
      // กรองตามระยะทางและเวลา
      billsSearch.value = result.data.Bus_bill.filter(bill => {
        const distance = bill.ticket?.queue_op?.bus_queue?.bq_distance || ''
        const dbTime = bill.ticket?.queue_op?.bus_queue?.bq_time || ''
        const dbTimeShort = dbTime.length >= 5 ? dbTime.slice(0,5) : dbTime

        const matchDistance = searchDistance.value.trim() ? distance.includes(searchDistance.value.trim()) : true
        const matchTime = searchTime.value.trim() ? (dbTimeShort === searchTime.value) : true

        return matchDistance && matchTime
      })
    } catch (err) {
      error.value = err
      console.error('searchBills error:', err)
    } finally {
      loading.value = false
    }
  } else {
    isSearching.value = false
  }
}

onMounted(() => {
  loadTodayBills()
})
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

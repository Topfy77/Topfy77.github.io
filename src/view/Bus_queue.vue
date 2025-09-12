<template> 
  <v-container>
    <h1>ticket</h1>

    <div class="search-bar">
      <v-text-field
        v-model="searchDistance"
        label="ຄົ້ນຫາ: ຕົ້ນທາງ-ປາຍທາງ"
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
            label="ວັນທີອອກເດີນທາງ"
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
            label="ເວລາອອກເດີນທາງ"
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

      <!-- Search Button -->
      <v-btn @click="searchTickets" color="primary">ຄົ້ນຫາ</v-btn>
    </div>

    <!-- ตาราง -->
    <v-data-table
      :headers="headers"
      :items="displayedTickets"
      :items-per-page="rowsPerPage"
      class="elevation-1"
      :loading="loading"
    >
     <template v-slot:item.queue_op.bus_queue.bq_date="{ item }">
  {{ item.queue_op?.bus_queue?.bq_date ? formatDate(item.queue_op.bus_queue.bq_date) : '' }}
</template>


      <template v-slot:item.actions="{ item }">
        <v-btn color="primary" @click="gotodetail(item)">ລາຍລະອຽດ</v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

// Routing
const router = useRouter()
function gotodetail(ticket) {
  router.push({ name: 'seat', params: { id: ticket.tk_id } })
}

// ตัวแปรค้นหา
const searchDistance = ref('')
const searchDate = ref(null)
const searchTime = ref('')
const searchDateFormatted = ref('')

// เมนู picker
const datePickerMenu = ref(false)
const timePickerMenu = ref(false)

// แสดงวันที่แบบ dd/MM/yyyy
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

// แปลง date ISO เป็น dd/MM/yyyy สำหรับแสดงตาราง
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// ตารางและโหลดข้อมูล
const rowsPerPage = ref(10)
const ticketsToday = ref([])      // ข้อมูลวันที่วันนี้ตอนโหลดหน้า
const ticketsSearch = ref([])     // ข้อมูลหลังค้นหา
const loading = ref(false)
const error = ref(null)

// Headers ตาราง
const headers = [
  { title: 'ຕົ້ນທາງ-ປາຍທາງ', value: 'queue_op.bus_queue.bq_distance' },
  { title: 'ລາຄາ', value: 'tk_price' },
  { title: 'ປ້າຍລົດເມ', value: 'queue_op.bus.bus_number' },
  { title: 'ປະເພດລົດເມ', value: 'queue_op.bus.category.cat_type' },
  { title: 'ຈຳນວນບ່ອນນັ່ງ', value: 'queue_op.bus.bus_capacity' },
  { title: 'ຈຳນວນຖືກຊື້', value: 'queue_op.bus.seats_reserved' },
  { title: 'ຈຳນວນຍັງວ່າງ', value: 'queue_op.bus.seats_available' },
  { title: 'ໂຊນຈອດລົດ', value: 'queue_op.bus_queue.bq_zone' },
  { title: 'ວັນທີ ອອກເດີນທາງ', value: 'queue_op.bus_queue.bq_date' },
  { title: 'ເວລາ ອອກເດີນທາງ', value: 'queue_op.bus_queue.bq_time' },
  { title: 'ລາຍລະອຽດ', value: 'actions', sortable: false },
]

// ควบคุมว่าแสดงข้อมูลอะไร
const isSearching = ref(false)
const displayedTickets = computed(() => {
  return isSearching.value ? ticketsSearch.value : ticketsToday.value
})

// GraphQL Query
const GET_TICKETS_BY_DATES = gql`
  query GetTicketsByDates($dates: [date!]) {
    Bus_ticket(where: {
      queue_op: {
        bus_queue: {
          bq_date: { _in: $dates }
        }
      }
    }) {
      tk_id
      tk_price
      queue_op {
        bus {
          bus_number
          bus_capacity
          seats_reserved
          seats_available
          category {
            cat_type
          }
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

// โหลดข้อมูลวันนี้ตอนหน้าโหลด
const today = new Date().toISOString().slice(0, 10)
// โหลดข้อมูลวันนี้ตอนหน้าโหลด
async function loadTodayTickets() {
  loading.value = true
  try {
    const result = await apolloClient.query({
      query: GET_TICKETS_BY_DATES,
      variables: { dates: [today] },
    })
    console.log('Tickets today:', result.data.Bus_ticket)  // ดูข้อมูลที่ได้
    ticketsToday.value = result.data.Bus_ticket || []
  } catch (err) {
    error.value = err
    console.error(err)
  } finally {
    loading.value = false
  }
}


// ค้นหาตาม input กดปุ่ม
async function searchTickets() {
  updateDateFormatted()
  if (
    searchDistance.value.trim() &&
    searchDate.value &&
    searchTime.value
  ) {
    loading.value = true
    isSearching.value = true

    // แปลงวันที่เป็น yyyy-mm-dd (รูปแบบฐานข้อมูล)
    const formattedDate = new Date(searchDate.value).toISOString().split('T')[0]

    try {
      const result = await apolloClient.query({
        query: GET_TICKETS_BY_DATES,
        variables: { dates: [formattedDate] },
      })

      // กรองด้วยระยะทางและเวลา
      ticketsSearch.value = result.data.Bus_ticket.filter(ticket => {
        const distance = ticket.queue_op.bus_queue.bq_distance || ''
        const time = ticket.queue_op.bus_queue.bq_time || ''
        return (
          distance.includes(searchDistance.value.trim()) &&
          time === searchTime.value
        )
      })
    } catch (err) {
      error.value = err
      console.error(err)
    } finally {
      loading.value = false
    }
  } else {
    // ถ้า input ไม่ครบ ให้แสดงข้อมูลวันนี้แทน
    isSearching.value = false
  }
}

// โหลดตอน mount
onMounted(() => {
  loadTodayTickets()
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

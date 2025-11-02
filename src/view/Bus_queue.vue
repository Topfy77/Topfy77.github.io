<template> 
  <v-container>
    <h1 align="center" class="page-title">ປີ້ລົດເມໃນມື້ນີ້</h1>

    <!-- search bar -->
    <div class="search-bar" style="display:flex; gap:10px; margin-bottom:20px;">
      <v-text-field
        v-model="searchDistance"
        label="ຄົ້ນຫາ: ຕົ້ນທາງ-ປາຍທາງ"
        dense outlined
      ></v-text-field>

      <v-menu v-model="datePickerMenu" :close-on-content-click="false"
        transition="scale-transition" offset-y min-width="auto">
        <template #activator="{ props }">
          <v-text-field
            v-model="searchDateFormatted"
            label="ວັນທີອອກເດີນທາງ"
            readonly v-bind="props"
            dense outlined
          ></v-text-field>
        </template>
        <v-date-picker 
          v-model="searchDate" 
          @update:modelValue="updateDateFormatted" 
          @input="updateDateFormatted"
        />
      </v-menu>

      <v-btn @click="searchBusQueue" color="primary">ຄົ້ນຫາ</v-btn>
    </div>

    <!-- ตารางคิว -->
    <v-data-table
      :headers="headers"
      :items="queueOps"
      :loading="loading"
      item-key="queue_id"
      hide-default-footer
      class="elevation-1"
    >
      <template #item.bq_distance="{ item }">
        {{ item.bus_queue?.bq_distance }}
      </template>

      <template #item.Date="{ item }">
        {{ formatDateDisplay(item.Date) }}
      </template>

      <template #item.actions="{ item }">
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

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const queueOps = ref([])
const total = ref(0)

const limits = [5, 10, 15, 20]
const pagination = ref({ page: 1, limit: 10 })

const searchDistance = ref('')
const searchDate = ref(null)
const searchDateFormatted = ref('')
const datePickerMenu = ref(false)

const headers = [
  { title: 'ໃລຍະທາງ', value: 'bq_distance' },
  { title: 'ວັນທີອອກເດີນທາງ', value: 'Date' },
  { title: 'ການຈັດການ', value: 'actions', sortable: false }
]

// GraphQL Query
const GET_QUEUE_OPS = gql`
  query GetQueueOps($limit: Int!, $offset: Int!, $distance: String, $date: date) {
    Bus_queue_op(
      where: {
        _and: [
          { Date: { _eq: $date } },
          { bus_queue: { bq_distance: { _ilike: $distance } } }
        ]
      }
      limit: $limit
      offset: $offset
    ) {
      queue_id
      Date
      bus_queue { bq_id bq_distance }
    }

    Bus_queue_op_aggregate(
      where: {
        _and: [
          { Date: { _eq: $date } },
          { bus_queue: { bq_distance: { _ilike: $distance } } }
        ]
      }
    ) {
      aggregate { count(columns: queue_id) }
    }
  }
`

// Helper functions
function formatDateDisplay(date) {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatLocalDateISO(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateDateFormatted() {
  if (!searchDate.value) {
    searchDateFormatted.value = ''
    return
  }
  searchDateFormatted.value = formatDateDisplay(searchDate.value)
}

// โหลดข้อมูลแบบ server-side
async function loadQueueOps() {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const dateValue = searchDate.value ? formatLocalDateISO(searchDate.value) : formatLocalDateISO(new Date())
    const distanceValue = `%${searchDistance.value.trim()}%`

    const { data } = await apolloClient.query({
      query: GET_QUEUE_OPS,
      variables: {
        limit: pagination.value.limit,
        offset,
        distance: distanceValue,
        date: dateValue
      },
      fetchPolicy: 'network-only'
    })

    queueOps.value = data.Bus_queue_op
    total.value = data.Bus_queue_op_aggregate.aggregate.count
  } catch (err) {
    console.error('Error loading queue ops:', err)
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  pagination.value.page = page
  loadQueueOps()
}

const totalPages = computed(() => Math.ceil(total.value / pagination.value.limit))
const startItem = computed(() => (pagination.value.page - 1) * pagination.value.limit + 1)
const endItem = computed(() => Math.min(pagination.value.page * pagination.value.limit, total.value))

function goToDetails(item) {
  const bqId = item.bus_queue?.bq_id
  const date = item.Date
  if (bqId && date) {
    router.push({ name: 'bus-detail', params: { bq_id: bqId, date } })
  }
}

function searchBusQueue() {
  pagination.value.page = 1
  loadQueueOps()
}

onMounted(loadQueueOps)
watch(() => pagination.value.limit, () => loadQueueOps())
</script>

<style>
.page-title { text-align:center; color:#2f54c0; margin-bottom:24px; font-family:'Noto Sans Lao'; }
</style>

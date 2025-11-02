<template>
  <v-container>
    <h1 class="text-center page-title">ລາຍລະອຽດຄິວລົດ</h1>

    <!-- ✅ Popup success -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2000" top right>
      {{ snackbar.text }}
    </v-snackbar>
<div class="search-bar" style="display:flex; gap:10px; margin-bottom:20px;">
      <v-text-field
        v-model="searchName"
        label="ໃລຍະທາງ"
        dense
        outlined
      ></v-text-field>

      <v-select
        v-model="searchBusNumber"
        
        label="ປ້າຍລັດ"
        dense
        outlined
        clearable
      ></v-select>
      
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
   
    <div class="text-end">
  <v-btn color="primary" fab fixed bottom right @click="openDialog()">
      <span class="material-icons">ເພີ່ມຂໍ້ມູນ</span>
    </v-btn>
</div>
<!-- Dialog ยืนยันการลบ -->
<v-dialog v-model="confirmDialog.show" max-width="400">
  <v-card class="page-title">
    <v-card-title class="">ຢືນຢັນການລົບ</v-card-title>
    <v-card-text>ທ່ານຕ້ອງການລົບຂໍ້ມູນນີ້ ຫຼື ບໍ່?</v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text color="primary" @click="confirmDialog.show = false">ຍົກເລີກ</v-btn>
      <v-btn color="error" @click="confirmDelete">ລົບ</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>


    <!-- Dialog เพิ่ม/แก้ไข -->
    <v-dialog v-model="dialog.show" max-width="600px" class="page-title">
      <v-card>
        <v-card-title>{{ dialog.id ? 'ແກ້ໃຂ' : 'ເພີ່ມ' }} ຄິວລົດ</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="formData.Date" label="ວັນທີ" type="date" required />

            <v-select
              v-model="formData.bq_id"
              :items="queueDropdown"
              item-title="bq_distance"
              item-value="bq_id"
              label="ໃລຍະທາງ"
              required
            />

            <v-select
              v-model="formData.bus_id"
              :items="busesDropdown"
              item-title="bus_number"
              item-value="bus_id"
              label="ລົດ"
              required
            />

            <v-select
              v-model="formData.cat_id"
              :items="cateDropdown"
              item-title="cat_type"
              item-value="cat_id"
              label="ປະເພດລົດ"
              readonly
            />

            <v-select
              v-model="formData.price_id"
              :items="pricesDropdown"
              item-title="price"
              item-value="price_id"
              label="ລາຄາ"
              required
            />

            <v-select
              v-model="formData.time_id"
              :items="timesDropdown"
              item-title="time"
              item-value="time_id"
              label="ເວລາ"
              required
            />

            <v-select
              v-model="formData.zone_id"
              :items="zonesDropdown"
              item-title="zone"
              item-value="zone_id"
              label="ໂຊນ"
              required
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialog.show = false">ຍົກເລີກ</v-btn>
          <v-btn color="primary" @click="saveQueue">ບັນທຶກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DataTable -->
    <!-- DataTable + Pagination -->
<v-data-table
  :headers="headers"
  :items="queues"
  :loading="loading"
  item-key="queue_id"
  :items-per-page="pagination.limit"
  hide-default-footer
  class="elevation-1"
  v-if="queues.length"
>
  <template #item.Date="{ item }">{{ formatDateMMDDYY(item.Date) }}</template>
  <template #item.bus="{ item }">{{ item.bus?.bus_number || '-' }}</template>
  <template #item.bq_distance="{ item }">{{ item.bus_queue?.bq_distance || '- ' }}</template>
  <template #item.zone="{ item }">{{ item.zone?.zone || '-' }}</template>
  <template #item.time="{ item }">{{ item.time?.time || '-' }}</template>
  <template #item.price="{ item }">{{ item.price?.price || '-' }}</template>
  <template #item.cat_type="{ item }">{{ item.bus?.category?.cat_type || '-' }}</template>
  <template #item.bus_capacity="{item}">{{ item.bus?.bus_capacity||'-' }}</template>

  <template #item.actions="{ item }">
    <v-btn color="info" small @click="editQueue(item)">ແກ້ໃຂ</v-btn>
    <v-btn color="error" small @click="deleteQueueDialog(item.queue_id)">ລົບ</v-btn>
  </template>
  
</v-data-table>
 <div v-else-if="!loading" class="text-center my-4">
      <v-alert type="info" variant="tonal">ບໍ່ພົບຂໍ້ມູນ</v-alert>
    </div>

<!-- Footer Pagination -->
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
import { ref, watch, onMounted, computed } from 'vue'
import apolloClient from '../apollo'
import { gql } from '@apollo/client/core'

// Loading และข้อมูลหลัก
const loading = ref(false)
const queues = ref([])
const total = ref(0)
const limits = [5, 10, 15, 20]
const pagination = ref({ page: 1, limit: 10 })

// Dialog & Snackbar
const dialog = ref({ show: false, id: null })
const snackbar = ref({ show: false, text: '', color: 'success' })
const confirmDialog = ref({ show: false, id: null })

// Form data
const formData = ref({
  Date: '',
  bus_id: null,
  price_id: null,
  time_id: null,
  zone_id: null,
  bq_id: null,
  cat_id: null,
})

// Dropdown
const busesDropdown = ref([])
const pricesDropdown = ref([])
const timesDropdown = ref([])
const zonesDropdown = ref([])
const queueDropdown = ref([])
const cateDropdown = ref([])

// Headers
const headers = [
  { title: 'ວັນທີ', value: 'Date' }, 
  { title: 'ລົດ', value: 'bus' },
  { title: 'ໃລຍະທາງ', value: 'bq_distance' },
  { title: 'ໂຊນ', value: 'zone' },
  { title: 'ເວລາ', value: 'time' },
  { title: 'ລາຄາ', value: 'price' },
  { title: 'ປະເພດລົດ', value: 'cat_type' },
  { title: 'ຈຳນວນບ່ອນນັ່ງທັງໝົດ', value: 'bus_capacity' },
  { title: 'ຈຳນວນຖືກຊື້', value: 'seats_reserved' },
  { title: 'ຈຳນວນບ່ອນນັ່ງຍັງວ່າງ', value: 'seats_available' },
  { title: 'ຈັດການ', value: 'actions' },
]

// ฟอร์แมตวันที่ MM/DD/YY
function formatDateMMDDYY(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${mm}/${dd}/${yy}`
}

// ดึง cat_id จาก bus
watch(() => formData.value.bus_id, (newBusId) => {
  const bus = busesDropdown.value.find(b => b.bus_id === newBusId)
  formData.value.cat_id = bus?.category?.cat_id || null
})

// โหลด dropdown
async function loadDropdowns() {
  const query = gql`
    query {
      Bus_bus(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}) { bus_id bus_number category { cat_id cat_type } }
      Bus_bus_queue(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}) { bq_id bq_distance }
      Bus_price(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}) { price_id price }
      Bus_time(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}) { time_id time }
      Bus_zone(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}) { zone_id zone }
      Bus_category(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}) { cat_id cat_type }
    }
  `
  const { data } = await apolloClient.query({ query, fetchPolicy: 'network-only' })
  busesDropdown.value = data.Bus_bus
  pricesDropdown.value = data.Bus_price
  timesDropdown.value = data.Bus_time
  zonesDropdown.value = data.Bus_zone
  queueDropdown.value = data.Bus_bus_queue
  cateDropdown.value = data.Bus_category
}

// GraphQL สำหรับ server-side pagination
const GET_QUEUES = gql`
query GetQueues($limit: Int!, $offset: Int!) {
  Bus_queue_op(
    where: { _or: [{ is_update: { _neq: 3 } }, { is_update: { _is_null: true } }] }
    limit: $limit
    offset: $offset
  ) {
    queue_id
    Date
    seats_reserved
    seats_available
    bus_queue { bq_distance }
    bus { bus_number bus_capacity category { cat_type } }
    price { price }
    time { time }
    zone { zone }
  }
  Bus_queue_op_aggregate(
    where: { _or: [{ is_update: { _neq: 3 } }, { is_update: { _is_null: true } }] }
  ) { aggregate { count } }
}`

// โหลด queues แบบ server-side
async function loadQueues() {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const { data } = await apolloClient.query({
      query: GET_QUEUES,
      variables: { limit: pagination.value.limit, offset },
      fetchPolicy: 'network-only'
    })
    queues.value = data.Bus_queue_op
    total.value = data.Bus_queue_op_aggregate.aggregate.count
  } finally {
    loading.value = false
  }
}

// Pagination
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  pagination.value.page = page
  loadQueues()
}
const totalPages = computed(() => Math.ceil(total.value / pagination.value.limit))
const startItem = computed(() => (pagination.value.page - 1) * pagination.value.limit + 1)
const endItem = computed(() => Math.min(pagination.value.page * pagination.value.limit, total.value))

// Dialog functions
function openDialog() {
  dialog.value = { show: true, id: null }
  formData.value = { Date: '', bus_id: null, price_id: null, time_id: null, zone_id: null, bq_id: null, cat_id: null }
}
function editQueue(item) {
  dialog.value.show = true
  dialog.value.id = item.queue_id
  formData.value = {
    Date: item.Date,
    bq_id: item.bus_queue?.bq_id || null,
    bus_id: item.bus?.bus_id || null,
    price_id: item.price?.price_id || null,
    time_id: item.time?.time_id || null,
    zone_id: item.zone?.zone_id || null,
    cat_id: item.bus?.category?.cat_id || null
  }
}

// Save / Update
async function saveQueue() {
  try {
    const variables = { ...formData.value }

    if (dialog.value.id) {
      // แก้ไข
      const mutation = gql`
        mutation UpdateQueue(
          $id: Int!, $Date: date!, $bus_id: Int!, $bq_id: Int!,
          $price_id: Int!, $time_id: Int!, $zone_id: Int!
        ) {
          update_Bus_queue_op_by_pk(pk_columns: { queue_id: $id }, _set: {
            Date: $Date,
            bq_id: $bq_id,
            bus_id: $bus_id,
            price_id: $price_id,
            time_id: $time_id,
            zone_id: $zone_id,
            is_update: 1
          }) {
            queue_id
            Date
            bus_queue { bq_distance }
            bus { bus_number bus_capacity category { cat_type } }
            price { price }
            time { time }
            zone { zone }
          }
        }
      `
      const { data } = await apolloClient.mutate({
        mutation,
        variables: { id: dialog.value.id, ...variables }
      })
      const updatedQueues = [...queues.value]
      const index = updatedQueues.findIndex(q => q.queue_id === dialog.value.id)
      if (index !== -1) updatedQueues[index] = data.update_Bus_queue_op_by_pk
      queues.value = updatedQueues
    } else {
      // เพิ่มใหม่
      const mutation = gql`
        mutation AddQueue(
          $Date: date!, $bq_id: Int!, $bus_id: Int!,
          $price_id: Int!, $time_id: Int!, $zone_id: Int!
        ) {
          insert_Bus_queue_op_one(object: {
            Date: $Date,
            bq_id: $bq_id,
            bus_id: $bus_id,
            price_id: $price_id,
            time_id: $time_id,
            zone_id: $zone_id,
            is_update: 1
          }) {
            queue_id
            Date
            bus_queue { bq_distance }
            bus { bus_number bus_capacity category { cat_type } }
            price { price }
            time { time }
            zone { zone }
          }
        }
      `
      const { data } = await apolloClient.mutate({ mutation, variables })
      queues.value = [...queues.value, data.insert_Bus_queue_op_one]
    }

    dialog.value.show = false
    snackbar.value = { show: true, text: dialog.value.id ? 'ແກ້ໃຂສຳເລັດ' : 'ເພີ່ມສຳເລັດ', color: 'success' }

  } catch (err) {
    console.error(err)
    snackbar.value = { show: true, text: 'ຜິດພາດໃນການບັນທຶກ', color: 'error' }
  }
}

// Soft delete
function deleteQueueDialog(id) {
  confirmDialog.value = { show: true, id }
}
async function confirmDelete() {
  if (!confirmDialog.value.id) return
  const id = confirmDialog.value.id
  const mutation = gql`
    mutation SoftDeleteQueue($id: Int!) {
      update_Bus_queue_op_by_pk(pk_columns: { queue_id: $id }, _set: { is_update: 3 }) {
        queue_id
      }
    }
  `
  await apolloClient.mutate({ mutation, variables: { id } })
  queues.value = queues.value.filter(q => q.queue_id !== id)
  snackbar.value = { show: true, text: 'ລົບສຳເລັດ', color: 'success' }
  confirmDialog.value.show = false
}

// Mounted
onMounted(() => {
  loadDropdowns()
  loadQueues()
})

// Watch limit change
watch(() => pagination.value.limit, () => changePage(1))
</script>


<style>
.page-title {
  text-align: center;
  color: #030303;
  margin-bottom: 24px;
  font-family: 'Noto Sans Lao';
}
</style>

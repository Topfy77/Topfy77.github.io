<template> 
  <v-container>
    <h1 align="center" class="page-title">ຂໍ້ມູນລົດເມ</h1>
<div class="search-bar" style="display:flex; gap:10px; margin-bottom:20px;">
      <v-text-field
        v-model="searchName"
        label="ປ້າຍລົດ"
        dense
        outlined
      ></v-text-field>

      <v-select
        v-model="searchBusNumber"
        
        label="ຊື່ ຄົນຂັບລົດ"
        dense
        outlined
        clearable
      ></v-select>

      <v-btn @click="searchBusQueue" color="primary">ຄົ້ນຫາ</v-btn>
    </div>
    <!-- ปุ่มเพิ่ม -->
    <div class="text-end mb-3">
      <v-btn color="primary" fab @click="openAddDialog">
        <span class="material-icons">ເພີ່ມຂໍ້ມູນ</span>
      </v-btn>
    </div>

    <!-- ตาราง -->
    <v-data-table
      :headers="headers"
      :items="buses"
      :loading="loading"
      item-key="bus_id"
      :items-per-page="pagination.limit"
      hide-default-footer
      class="elevation-1"
    >
      <template #item.category="{ item }">{{ item.category?.cat_type || '-' }}</template>
      <template #item.driver="{ item }">{{ item.driver?.dv_name || '-' }}</template>
      <template #item.tel="{ item }">{{ item.driver?.dv_tel || '-' }}</template>

      <template #item.actions="{ item }">
        <v-btn color="info" small @click="editBus(item)">ແກ້ໃຂ</v-btn>
        <v-btn color="error" small @click="openConfirmDialog(item.bus_id)">ລົບ</v-btn>
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
            < 
          </v-btn>
          <v-btn icon @click="changePage(pagination.page + 1)" :disabled="pagination.page >= totalPages">
            >
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Dialog เพิ่ม/แก้ไข -->
    <v-dialog v-model="dialog.show" max-width="600px">
      <v-card>
        <v-card-title>{{ dialog.bus_id ? 'ແກ້ໃຂ' : 'ເພີ່ມ' }} ຂໍ້ມູນລົດ</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="formData.bus_number" label="ປ້າຍລົດ" required />
            <v-text-field v-model="formData.bus_capacity" label="ຈຳນວນບ່ອນນັ່ງ" type="number" required />
            <v-select v-model="formData.cat_id" :items="categories" item-title="cat_type" item-value="cat_id" label="ປະເພດລົດ" required />
            <v-select v-model="formData.dv_id" :items="drivers" item-title="dv_name" item-value="dv_id" label="ຄົນຂັບລົດ" @update:modelValue="updateDriverTel" required />
            <v-text-field v-model="formData.dv_tel" label="ເບີໂທ" readonly />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="dialog.show = false">ຍົກເລີກ</v-btn>
          <v-btn color="primary" @click="saveBus">ບັນທຶກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog ยืนยันการลบ -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card class="page-title">
        <v-card-title>ຢືນຢັນການລົບ</v-card-title>
        <v-card-text>ທ່ານຕ້ອງການລົບຂໍ້ມູນນີ້ ຫຼື ບໍ່?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="confirmDialog.show = false">ຍົກເລີກ</v-btn>
          <v-btn color="error" @click="confirmDelete">ລົບ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2000" top right>
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

const buses = ref([])
const loading = ref(false)
const total = ref(0)
const limits = [5, 10, 15, 20]
const pagination = ref({ page: 1, limit: 10 })

const headers = [
  { title: 'ປ້າຍລົດ', value: 'bus_number' },
  { title: 'ຈຳນວນບ່ອນນັ່ງ', value: 'bus_capacity' },
  { title: 'ປະເພດລົດ', value: 'category' },
  { title: 'ຄົນຂັບລົດ', value: 'driver' },
  { title: 'ເບີໂທ', value: 'tel' },
  { title: 'ການຈັດການ', value: 'actions', sortable: false }
]

const dialog = ref({ show: false, bus_id: null })
const confirmDialog = ref({ show: false, bus_id: null })
const snackbar = ref({ show: false, text: '', color: '' })
const categories = ref([])
const drivers = ref([])
const formData = ref({ bus_number: '', bus_capacity: '', cat_id: null, dv_id: null, dv_tel: '' })

// 🚀 QUERY ดึงข้อมูล Bus พร้อมแบ่งหน้า
const GET_BUSES = gql`
query GetBuses($limit:Int,$offset:Int) {
  Bus_bus(where:{_or:[{is_delete:{_neq:3}},{is_delete:{_is_null:true}}]}, limit:$limit, offset:$offset) {
    bus_id
    bus_number
    bus_capacity
    category { cat_type }
    driver { dv_name dv_tel }
  }
  Bus_bus_aggregate(where:{_or:[{is_delete:{_neq:3}},{is_delete:{_is_null:true}}]}) {
    aggregate { count }
  }
}`

// โหลดข้อมูลหลักแบบแบ่งหน้า
async function loadBuses() {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const { data } = await apolloClient.query({
      query: GET_BUSES,
      variables: { limit: pagination.value.limit, offset },
      fetchPolicy: 'network-only'
    })
    buses.value = data.Bus_bus
    total.value = data.Bus_bus_aggregate.aggregate.count
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Pagination Logic
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  pagination.value.page = page
  loadBuses()
}
const totalPages = computed(() => Math.ceil(total.value / pagination.value.limit))
const startItem = computed(() => (pagination.value.page - 1) * pagination.value.limit + 1)
const endItem = computed(() => Math.min(pagination.value.page * pagination.value.limit, total.value))

// โหลด Dropdown
async function loadDropdowns() {
  const query = gql`
    query {
      Bus_category(where:{_or:[{is_delete:{_neq:3}},{is_delete:{_is_null:true}}]}){ cat_id cat_type }
      Bus_driver(where:{_or:[{is_delete:{_neq:3}},{is_delete:{_is_null:true}}]}){ dv_id dv_name dv_tel }
    }
  `
  const res = await apolloClient.query({ query })
  categories.value = res.data.Bus_category
  drivers.value = res.data.Bus_driver
}

function openAddDialog() {
  dialog.value = { show: true, bus_id: null }
  formData.value = { bus_number: '', bus_capacity: '', cat_id: null, dv_id: null, dv_tel: '' }
}
function editBus(item) {
  dialog.value = { show: true, bus_id: item.bus_id }
  formData.value = {
    bus_number: item.bus_number,
    bus_capacity: item.bus_capacity,
    cat_id: item.category?.cat_id || null,
    dv_id: item.driver?.dv_id || null,
    dv_tel: item.driver?.dv_tel || ''
  }
}
function updateDriverTel() {
  const d = drivers.value.find(v => v.dv_id === formData.value.dv_id)
  formData.value.dv_tel = d ? d.dv_tel : ''
}

// ลบ
function openConfirmDialog(id) {
  confirmDialog.value = { show: true, bus_id: id }
}
async function confirmDelete() {
  await apolloClient.mutate({
    mutation: gql`mutation($bus_id:Int!){update_Bus_bus_by_pk(pk_columns:{bus_id:$bus_id},_set:{is_delete:3}){bus_id}}`,
    variables: { bus_id: confirmDialog.value.bus_id }
  })
  snackbar.value = { show: true, text: 'ລົບສຳເລັດ', color: 'success' }
  confirmDialog.value.show = false
  loadBuses()
}

// บันทึก (เพิ่ม/แก้ไข)
async function saveBus() {
  const isEdit = dialog.value.bus_id
  const query = isEdit ? gql`
    mutation Update($bus_id:Int!,$bus_number:String!,$bus_capacity:Int!,$cat_id:Int!,$dv_id:Int!){
      update_Bus_bus_by_pk(pk_columns:{bus_id:$bus_id},_set:{bus_number:$bus_number,bus_capacity:$bus_capacity,cat_id:$cat_id,dv_id:$dv_id}){bus_id}
    }` : gql`
    mutation Add($bus_number:String!,$bus_capacity:Int!,$cat_id:Int!,$dv_id:Int!){
      insert_Bus_bus_one(object:{bus_number:$bus_number,bus_capacity:$bus_capacity,cat_id:$cat_id,dv_id:$dv_id}){bus_id}
    }`
  const variables = {
    bus_id: dialog.value.bus_id,
    bus_number: formData.value.bus_number,
    bus_capacity: Number(formData.value.bus_capacity),
    cat_id: formData.value.cat_id,
    dv_id: formData.value.dv_id
  }
  await apolloClient.mutate({ mutation: query, variables })
  snackbar.value = { show: true, text: isEdit ? 'ແກ້ໃຂສຳເລັດ' : 'ເພີ່ມສຳເລັດ', color: 'success' }
  dialog.value.show = false
  loadBuses()
}

onMounted(() => {
  loadDropdowns()
  loadBuses()
})
watch(() => pagination.value.limit, () => loadBuses())
</script>

<style>
.page-title { text-align:center; color:#0a0a0b; margin-bottom:24px; font-family:'Noto Sans Lao'; }
</style>

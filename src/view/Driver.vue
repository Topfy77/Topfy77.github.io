<template>
  <v-container class="page-titlee mt-5">
    <h1 class="text-center page-title">ຂໍ້ມູນຄົນຂັບລົດເມ</h1>

    <!-- 🔍 Search Bar -->
    <div class="search-bar" style="display:flex; gap:10px; margin-bottom:20px;">
      <v-text-field
        v-model="searchName"
        label="ຊື່ ແລະ ນາມສະກຸນ"
        dense
        outlined
      ></v-text-field>

      <v-select
        v-model="searchBusNumber"
        :items="busOptions.map(b => b.bus_number)"
        label="ປ້າຍລົດ"
        dense
        outlined
        clearable
      ></v-select>

      <v-btn @click="searchBusQueue" color="primary">ຄົ້ນຫາ</v-btn>
    </div>

    <!-- ➕ Add Button -->
    <div class="text-end mb-3">
      <v-btn color="primary" @click="openAddDialog">
        <v-icon left>mdi-plus</v-icon> ເພີ່ມຂໍ້ມູນ
      </v-btn>
    </div>

    <!-- 📋 Data Table -->
    <v-data-table 
      :headers="headers"
      :items="drivers"
      :loading="loading"
      item-key="dv_id"
      :items-per-page="pagination.limit"
      hide-default-footer
      class="elevation-1"
    >
      <template #item.buses="{ item }">
        {{ item.buses.map(b => b.bus_number).join(', ') }}
      </template>
      <template #item.actions="{ item }">
        <v-btn color="info" small @click="editDriver(item)">ແກ້ໄຂ</v-btn>
        <v-btn color="error" small @click="confirmDeleteDriver(item)">ລົບ</v-btn>
      </template>
    </v-data-table>

    <!-- 📄 Pagination -->
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
          <v-btn icon @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1">&lt;</v-btn>
          <v-btn icon @click="changePage(pagination.page + 1)" :disabled="pagination.page >= totalPages">&gt;</v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- 🧾 Add/Edit Dialog -->
    <v-dialog v-model="dialog.show" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h6">{{ dialog.mode === 'add' ? 'ເພີ່ມຄົນຂັບ' : 'ແກ້ໄຂຂໍ້ມູນ' }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="form.dv_name" label="ຊື່ຄົນຂັບລົດ" outlined dense></v-text-field>
          <v-text-field v-model="form.dv_tel" label="ເບີໂທ" outlined dense></v-text-field>

          <v-select
            v-model="form.bus_id"
            :items="busOptions"
            item-title="bus_number"
            item-value="bus_id"
            label="ປ້າຍລົດ"
            outlined
            dense
            clearable
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="dialog.show = false">ຍົກເລີກ</v-btn>
          <v-btn color="primary" @click="saveDriver">ບັນທຶກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ❗ Confirm Delete -->
    <v-dialog v-model="dialogDelete.show" max-width="400px">
      <v-card class="page-title">
        <v-card-title>ຢືນຢັນການລົບ</v-card-title>
        <v-card-text>ທ່ານແນ່ໃຈບໍ່ວ່າຈະລົບ ?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="dialogDelete.show = false">ຍົກເລີກ</v-btn>
          <v-btn color="error" @click="deleteDriver">ຕົກລົງ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

// STATE
const drivers = ref([])
const busOptions = ref([])
const loading = ref(false)
const total = ref(0)
const limits = [5,10,15,20]
const pagination = ref({ page: 1, limit: 10 })
const searchName = ref('')
const searchBusNumber = ref('')

// Dialog + Form
const dialog = ref({ show: false, mode: 'add' })
const dialogDelete = ref({ show: false, id: null, name: '' })
const form = ref({ dv_id: null, dv_name: '', dv_tel: '', bus_id: null })

// TABLE HEADERS
const headers = [
  { title: 'ຊື່ຄົນຂັບລົດ', value: 'dv_name' },
  { title: 'ເບີໂທຕິດຕໍ່', value: 'dv_tel' },
  { title: 'ປ້າຍລົດ', value: 'buses' },
  { title: 'ຈັດການ', value: 'actions', sortable: false }
]

// GRAPHQL
const GET_DRIVERS = gql`
query GetDrivers($limit:Int,$offset:Int,$name:String,$bus:String) {
  Bus_driver(
    where: {
      _and: [
        { _or: [{is_delete: {_neq: 3}}, {is_delete: {_is_null: true}}] },
        {
          _or: [
            { dv_name: { _ilike: $name } },
            { buses: { bus_number: { _ilike: $bus } } }
          ]
        }
      ]
    },
    limit: $limit,
    offset: $offset
  ) {
    dv_id
    dv_name
    dv_tel
    buses { bus_id bus_number }
  }
  Bus_driver_aggregate(where: {
    _and: [
      { _or: [{is_delete: {_neq: 3}}, {is_delete: {_is_null: true}}] },
      {
        _or: [
          { dv_name: { _ilike: $name } },
          { buses: { bus_number: { _ilike: $bus } } }
        ]
      }
    ]
  }) { aggregate { count } }
}
`

const GET_BUSES = gql`
query {
  bus(where: {_or: [{is_delete: {_neq: 3}}, {is_delete: {_is_null: true}}]}) {
    bus_id
    bus_number
  }
}
`

const INSERT_DRIVER = gql`
mutation($dv_name:String!,$dv_tel:String!,$bus_id:Int!) {
  insert_Bus_driver_one(object: {dv_name:$dv_name, dv_tel:$dv_tel, bus_id:$bus_id}) {
    dv_id
  }
}
`

const UPDATE_DRIVER = gql`
mutation($dv_id:Int!,$dv_name:String!,$dv_tel:String!,$bus_id:Int!) {
  update_Bus_driver_by_pk(pk_columns:{dv_id:$dv_id}, _set:{dv_name:$dv_name, dv_tel:$dv_tel, bus_id:$bus_id}) {
    dv_id
  }
}
`

const DELETE_DRIVER = gql`
mutation($dv_id:Int!) {
  update_Bus_driver_by_pk(pk_columns:{dv_id:$dv_id}, _set:{is_delete:3}) {
    dv_id
  }
}
`

// LOAD DATA
async function loadDrivers() {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const { data } = await apolloClient.query({
      query: GET_DRIVERS,
      variables: {
        limit: pagination.value.limit,
        offset,
        name: `%${searchName.value}%`,
        bus: `%${searchBusNumber.value}%`
      },
      fetchPolicy: 'network-only'
    })
    drivers.value = data.Bus_driver
    total.value = data.Bus_driver_aggregate.aggregate.count
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadBuses() {
  const { data } = await apolloClient.query({
    query: GET_BUSES,
    fetchPolicy: 'network-only'
  })
  busOptions.value = data.bus
}


// CRUD
function openAddDialog() {
  dialog.value = { show: true, mode: 'add' }
  form.value = { dv_id: null, dv_name: '', dv_tel: '', bus_id: null }
}

function editDriver(item) {
  dialog.value = { show: true, mode: 'edit' }
  form.value = {
    dv_id: item.dv_id,
    dv_name: item.dv_name,
    dv_tel: item.dv_tel,
    bus_id: item.buses[0]?.bus_id || null
  }
}

async function saveDriver() {
  try {
    if (dialog.value.mode === 'add') {
      await apolloClient.mutate({ mutation: INSERT_DRIVER, variables: form.value })
    } else {
      await apolloClient.mutate({ mutation: UPDATE_DRIVER, variables: form.value })
    }
    dialog.value.show = false
    loadDrivers()
  } catch (err) {
    console.error(err)
  }
}

function confirmDeleteDriver(item) {
  dialogDelete.value = { show: true, id: item.dv_id, name: item.dv_name }
}

async function deleteDriver() {
  try {
    await apolloClient.mutate({
      mutation: DELETE_DRIVER,
      variables: { dv_id: dialogDelete.value.id }
    })
    dialogDelete.value.show = false
    loadDrivers()
  } catch (err) {
    console.error(err)
  }
}

function searchBusQueue() {
  pagination.value.page = 1
  loadDrivers()
}

// PAGINATION
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  pagination.value.page = page
  loadDrivers()
}

const totalPages = computed(() => Math.ceil(total.value / pagination.value.limit))
const startItem = computed(() => (pagination.value.page - 1) * pagination.value.limit + 1)
const endItem = computed(() => Math.min(pagination.value.page * pagination.value.limit, total.value))

// INIT
onMounted(() => {
  loadBuses()
  loadDrivers()
})
watch(() => pagination.value.limit, () => loadDrivers())
</script>

<style>
.page-titlee {
  color:#0c0c0d;
  margin-bottom:24px;
  font-family:'Noto Sans Lao';
}
</style>

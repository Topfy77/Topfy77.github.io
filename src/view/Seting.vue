<template>
  <v-container class="page-title">
    <h1 class="text-center">ການຕັ້ງຄ່າ</h1>

    <v-row>
      <!-- ตาราง Bus Queue -->
      <v-col cols="4">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            ໃລຍະທາງ
            <v-btn color="primary" @click="openDialog('bus_queue')" small>+ ເພີ່ມ</v-btn>
          </v-card-title>
          <v-data-table :items="busQueues" class="elevation-1" hide-default-header>
            <template #item="{ item }">
              <tr>
                <td>{{ item.bq_distance }}</td>
                <td>
                  <v-btn color="info" size="small" @click="openDialog('bus_queue', item)">ແກ້ໃຂ</v-btn>
                  <v-btn color="error" size="small" @click="confirmDeleteItem('bus_queue', item.bq_id)">ລົບ</v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- ตาราง Zone -->
      <v-col cols="4">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            ໂຊນບ່ອນຈອດລົດ
            <v-btn color="primary" @click="openDialog('zone')" small>+ ເພີ່ມ</v-btn>
          </v-card-title>
          <v-data-table :items="zones" class="elevation-1" hide-default-header>
            <template #item="{ item }">
              <tr>
                <td>{{ item.zone }}</td>
                <td>
                  <v-btn color="info" size="small" @click="openDialog('zone', item)">ແກ້ໃຂ</v-btn>
                  <v-btn color="error" size="small" @click="confirmDeleteItem('zone', item.zone_id)">ລົບ</v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- ตาราง Time -->
      <v-col cols="4">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            ເວລາອອກເດີນທາງ
            <v-btn color="primary" @click="openDialog('time')" small>+ ເພີ່ມ</v-btn>
          </v-card-title>
          <v-data-table :items="times" class="elevation-1" hide-default-header>
            <template #item="{ item }">
              <tr>
                <td>{{ item.time }}</td>
                <td>
                  <v-btn color="info" size="small" @click="openDialog('time', item)">ແກ້ໃຂ</v-btn>
                  <v-btn color="error" size="small" @click="confirmDeleteItem('time', item.time_id)">ລົບ</v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- ตาราง Price -->
      <v-col cols="4">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            ລາຄາປີ້ລົດ
            <v-btn color="primary" @click="openDialog('price')" small>+ ເພີ່ມ</v-btn>
          </v-card-title>
          <v-data-table :items="prices" class="elevation-1" hide-default-header>
            <template #item="{ item }">
              <tr>
                <td>{{ item.price }}</td>
                <td>
                  <v-btn color="info" size="small" @click="openDialog('price', item)">ແກ້ໃຂ</v-btn>
                  <v-btn color="error" size="small" @click="confirmDeleteItem('price', item.price_id)">ລົບ</v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- ตาราง Category -->
      <v-col cols="4">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            ປະເພດລົດເມ
            <v-btn color="primary" @click="openDialog('category')" small>+ ເພີ່ມ</v-btn>
          </v-card-title>
          <v-data-table :items="categories" class="elevation-1" hide-default-header>
            <template #item="{ item }">
              <tr>
                <td>{{ item.cat_type }}</td>
                <td>
                  <v-btn color="info" size="small" @click="openDialog('category', item)">ແກ້ໃຂ</v-btn>
                  <v-btn color="error" size="small" @click="confirmDeleteItem('category', item.cat_id)">ລົບ</v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Add/Edit -->
    <v-dialog v-model="dialog.show" max-width="400" class="page-title">
      <v-card>
        <v-card-title>{{ dialog.id ? 'ແກ້ໃຂ' : 'ເພີ່ມ' }} {{ dialog.type }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.value" :label="dialog.type" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialog.show=false">ຍົກເລີກ</v-btn>
          <v-btn color="primary" @click="saveItem">ບັນທຶກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirm Delete -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card class="page-title">
        <v-card-title>ຢືນຢັນການລົບ</v-card-title>
        <v-card-text>ທ່ານຕ້ອງການລົບແທ້ບໍ່?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="confirmDialog.show=false">ຍົກເລີກ</v-btn>
          <v-btn color="error" @click="deleteItem">ລົບ</v-btn>
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
import { ref, onMounted } from 'vue'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

const zones = ref([])
const times = ref([])
const prices = ref([])
const categories = ref([])
const busQueues = ref([])

const dialog = ref({ show: false, type: '', id: null })
const form = ref({ value: '' })

// Confirmation & snackbar
const confirmDialog = ref({ show: false, type: '', id: null })
const snackbar = ref({ show: false, text: '', color: '' })

const GET_DATA = gql`
  query MyQuery {
    Bus_zone(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}){ zone_id zone }
    Bus_time(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}){ time_id time }
    Bus_price(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}){ price_id price }
    Bus_category(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}){ cat_id cat_type }
    Bus_bus_queue(where: { _or: [
            { is_delete: { _neq: 3 } },
            { is_delete: { _is_null: true } }
          ]}){ bq_id bq_distance }
  }
`

const INSERT = {
  zone: gql`mutation($zone:String!){ insert_Bus_zone_one(object:{zone:$zone}){zone_id}}`,
  time: gql`mutation($time:String!){ insert_Bus_time_one(object:{time:$time}){time_id}}`,
  price: gql`mutation($price_id:Int!,$price:String!){ insert_Bus_price_one(object:{price:$price}){price_id}}`,
  category: gql`mutation($cat_type:String!){ insert_Bus_category_one(object:{cat_type:$cat_type}){cat_id}}`,
  bus_queue: gql`mutation($bq_distance:String!){ insert_Bus_bus_queue_one(object:{bq_distance:$bq_distance}){bq_id}}`
}

const UPDATE = {
  zone: gql`mutation($zone_id:Int!,$zone:String!){ update_Bus_zone_by_pk(pk_columns:{zone_id:$zone_id}, _set:{zone:$zone}){zone_id}}`,
  time: gql`mutation($time_id:Int!,$time:String!){ update_Bus_time_by_pk(pk_columns:{time_id:$time_id}, _set:{time:$time}){time_id}}`,
  price: gql`mutation($price_id:Int!,$price:String!){ update_Bus_price_by_pk(pk_columns:{price_id:$price_id}, _set:{price:$price}){price_id}}`,
  category: gql`mutation($cat_id:Int!,$cat_type:String!){ update_Bus_category_by_pk(pk_columns:{cat_id:$cat_id}, _set:{cat_type:$cat_type}){cat_id}}`,
  bus_queue: gql`mutation($bq_id:Int!,$bq_distance:String!){ update_Bus_bus_queue_by_pk(pk_columns:{bq_id:$bq_id}, _set:{bq_distance:$bq_distance}){bq_id}}`
}

// Soft delete mutations
const SOFT_DELETE = {
  zone: gql`mutation($zone_id:Int!){ update_Bus_zone_by_pk(pk_columns:{zone_id:$zone_id}, _set:{is_delete:3}){zone_id} }`,
  time: gql`mutation($time_id:Int!){ update_Bus_time_by_pk(pk_columns:{time_id:$time_id}, _set:{is_delete:3}){time_id} }`,
  price: gql`mutation($price_id:Int!){ update_Bus_price_by_pk(pk_columns:{price_id:$price_id}, _set:{is_delete:3}){price_id} }`,
  category: gql`mutation($cat_id:Int!){ update_Bus_category_by_pk(pk_columns:{cat_id:$cat_id}, _set:{is_delete:3}){cat_id} }`,
  bus_queue: gql`mutation($bq_id:Int!){ update_Bus_bus_queue_by_pk(pk_columns:{bq_id:$bq_id}, _set:{is_delete:3}){bq_id} }`
}

async function loadData() {
  const { data } = await apolloClient.query({ query: GET_DATA, fetchPolicy: 'network-only' })
  zones.value = data.Bus_zone
  times.value = data.Bus_time
  prices.value = data.Bus_price
  categories.value = data.Bus_category
  busQueues.value = data.Bus_bus_queue
}

function openDialog(type, item = null) {
  dialog.value.type = type
  dialog.value.show = true
  dialog.value.id = item ? item[`${type==='category'?'cat_id':type==='bus_queue'?'bq_id':type+'_id'}`] : null
  form.value.value = item ? (type==='category'? item.cat_type : type==='bus_queue'? item.bq_distance : item[type]) : ''
}

async function saveItem() {
  const type = dialog.value.type
  if (!form.value.value) return
  const varObj = {}
  if (dialog.value.id) {
    varObj[`${type==='category'?'cat_id':type==='bus_queue'?'bq_id':type+'_id'}`] = dialog.value.id
    varObj[type==='category'?'cat_type':type==='bus_queue'?'bq_distance':type] = form.value.value
    await apolloClient.mutate({ mutation: UPDATE[type], variables: varObj })
  } else {
    await apolloClient.mutate({ mutation: INSERT[type], variables: { [type==='category'?'cat_type':type==='bus_queue'?'bq_distance':type]: form.value.value } })
  }
  dialog.value.show = false
  form.value.value = ''
  loadData()
}

// เปิด confirm dialog
function confirmDeleteItem(type, id) {
  confirmDialog.value = { show: true, type, id }
}

// ทำ soft delete
async function deleteItem() {
  const { type, id } = confirmDialog.value
  if (!id) return
  try {
    await apolloClient.mutate({ mutation: SOFT_DELETE[type], variables: { [`${type==='category'?'cat_id':type==='bus_queue'?'bq_id':type+'_id'}`]: id } })
    snackbar.value = { show: true, text: 'ລົບສຳເລັດ', color: 'success' }
    confirmDialog.value.show = false
    loadData()
  } catch (err) {
    console.error(err)
    snackbar.value = { show: true, text: 'ລົບບໍ່ສຳເລັດ', color: 'error' }
  }
}

onMounted(() => loadData())
</script>

<style>
.page-title { text-align:center; color:#2f54c0; margin-bottom:24px; font-family:'Noto Sans Lao'; }
</style>

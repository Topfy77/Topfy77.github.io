<template>
  <v-container>
    <h1>ລາຍຊື່ເຈົ້າຂອງລົດ</h1>

    <v-data-table
      :headers="headers"
      :items="driversFormatted"
      :items-per-page="10"
      :loading="loading"
      class="elevation-1"
    >
      <template v-slot:item.buses="{ item }">
        <div v-if="item.buses.length">
          <v-chip
            v-for="bus in item.buses"
            :key="bus.bus_id"
            class="ma-1"
            color="primary"
            text-color="white"
            size="small"
          >
            {{ bus.bus_number }}
          </v-chip>
        </div>
        <div v-else>-</div>
      </template>
    </v-data-table>

    <div v-if="error" class="error">
      Error: {{ error.message }}
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { gql } from '@apollo/client/core'
import apolloClient from '../apollo.js'

const drivers = ref([])
const loading = ref(true)
const error = ref(null)

const headers = [
  { title: 'ຊື່ຄົນຂັບລົດ', key: 'dv_name' },
  { title: 'ເບີໂທລະສັບ', key: 'dv_tel' },
  { title: 'ປ້າຍລົດ', key: 'buses', sortable: false }
]

const GET_DRIVERS = gql`
  query GetDriversWithBus {
    Bus_driver {
      dv_id
      dv_name
      dv_tel
      buses {
        bus_id
        bus_number
      }
    }
  }
`

onMounted(async () => {
  try {
    const result = await apolloClient.query({ query: GET_DRIVERS })
    drivers.value = result.data.Bus_driver
  } catch (err) {
    error.value = err
    console.error(err)
  } finally {
    loading.value = false
  }
})

const driversFormatted = computed(() =>
  drivers.value.map(d => ({
    dv_name: d.dv_name,
    dv_tel: d.dv_tel,
    buses: d.buses || []
  }))
)
</script>

<style scoped>
.error {
  margin-top: 20px;
  color: red;
}
</style>

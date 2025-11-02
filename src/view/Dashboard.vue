<script setup>
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import LineChart from '../components/LineChart.vue'
import { gql } from '@apollo/client'

// แปลงวันที่
function formatDateToISO(date) {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${year}-${month}-${day}`
}

const todayISO = formatDateToISO(new Date())
const monthStartISO = formatDateToISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const yearStartISO = formatDateToISO(new Date(new Date().getFullYear(), 0, 1))
const last7daysISO = formatDateToISO(new Date(new Date().setDate(new Date().getDate() - 7)))

// GraphQL
const BILL_STATS = gql`
query {
  bill_today: Bus_bill(where: { datetime: { _eq: "${todayISO}" } }) {
    bill_amout
  }
  bill_month: Bus_bill(where: { datetime: { _gte: "${monthStartISO}" } }) {
    bill_amout
  }
  bill_year: Bus_bill(where: { datetime: { _gte: "${yearStartISO}" } }) {
    bill_amout
  }
}`
const BILL_LAST7DAYS = gql`
query {
  bill_last7days: Bus_bill(where: { datetime: { _gte: "${last7daysISO}" } }, order_by: { datetime: asc }) {
    datetime bill_amout
  }
}`

// ดึงข้อมูล
const { result: statsResult, loading: statsLoading, error: statsError } = useQuery(BILL_STATS)
const { result: last7Result, loading: last7Loading, error: last7Error } = useQuery(BILL_LAST7DAYS)

// computed
const statsToday = computed(() => {
  const arr = statsResult.value?.bill_today ?? []
  const sum = arr.reduce((acc, cur) => acc + (parseFloat(cur.bill_amout) || 0), 0)
  return { count: arr.length, sum }
})
const statsMonth = computed(() => {
  const arr = statsResult.value?.bill_month ?? []
  const sum = arr.reduce((acc, cur) => acc + (parseFloat(cur.bill_amout) || 0), 0)
  return { count: arr.length, sum }
})
const statsYear = computed(() => {
  const arr = statsResult.value?.bill_year ?? []
  const sum = arr.reduce((acc, cur) => acc + (parseFloat(cur.bill_amout) || 0), 0)
  return { count: arr.length, sum }
})

const chartData = computed(() => {
  const arr = last7Result.value?.bill_last7days ?? []
  return {
    labels: arr.map(r => r.datetime),
    datasets: [{
      label: 'graph',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgb(54, 162, 235)',
      data: arr.map(r => parseFloat(r.bill_amout) || 0),
      fill: false
    }]
  }
})

const chartOptions = { responsive: true, plugins: { legend: { display: true } } }

function formatPrice(val) {
  return val != null ? Number(val).toLocaleString('en-US') : '0'
}
</script>


<template>
  <v-container class="pa-4">
    <h1 align="center">Dashboard</h1>
    <div v-if="statsError || last7Error" class="text-red">Error: {{ statsError?.message || last7Error?.message }}</div>
    <div v-else-if="statsLoading || last7Loading">ກຳລັງໂຫຼດ...</div>
    <div v-else>
      <v-row>
        <v-col cols="12" md="4">
          <v-card outlined class="pa-4">
            <h3>ຍອດຂາຍມື້ນີ້</h3>
            <div>ໃບບິນ: {{ statsToday.count }}</div>
            <div>ລາຄາລວມທັງໝົດ: {{ formatPrice(statsToday.sum) }} ກີບ</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card outlined class="pa-4">
            <h3>ຍອດຂາຍເດືອນນີ້</h3>
            <div>ໃບບິນ: {{ statsMonth.count }}</div>
            <div>ລາຄາລວມທັງໝົດ: {{ formatPrice(statsMonth.sum) }} ກີບ</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card outlined class="pa-4">
            <h3>ຍອດຂາຍປີນີ້</h3>
            <div>ໃບບິນ: {{ statsYear.count }}</div>
            <div>ລາຄາລວມທັງໝົດ: {{ formatPrice(statsYear.sum) }} ກີບ</div>
          </v-card>
        </v-col>
      </v-row>
      <v-row class="mt-8">
        <v-col cols="12">
          <v-card class="pa-4">
            <h3>ຍອດຂາຍ 7 ມື້ຜ່ານມາ</h3>
            <LineChart :chart-data="chartData" :chart-options="chartOptions"/>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

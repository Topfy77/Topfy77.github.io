<script setup>
import { defineComponent, computed } from 'vue'
import { Line } from 'vue-chartjs'

const LineChart = defineComponent({
  name: 'LineChart',
  extends: Line,
  props: ['chartData', 'chartOptions'],
  mounted() {
    this.renderChart(this.chartData, this.chartOptions)
  }
})

const chartData = computed(() => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  datasets: [
    {
      label: 'Sales',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgb(54, 162, 235)',
      data: [10, 20, 30, 40, 50],
      fill: false,
    }
  ]
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: true }
  }
}
</script>

<template>
  <v-container>
    <LineChart :chart-data="chartData" :chart-options="chartOptions" />
  </v-container>
</template>

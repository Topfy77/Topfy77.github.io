<!-- LineChart.vue -->
<script setup>
import { ref, watch, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const props = defineProps({
  chartData: { type: Object, required: true },
  chartOptions: { type: Object, required: false }
})

const canvasRef = ref(null)
let chartInstance = null

onMounted(() => {
  if (canvasRef.value) {
    chartInstance = new Chart(canvasRef.value, {
      type: 'line',
      data: props.chartData,
      options: props.chartOptions || {}
    })
  }
})

watch(
  () => props.chartData,
  (newData) => {
    if (chartInstance && newData) {
      chartInstance.data = newData
      chartInstance.update()
    }
  },
  { deep: true }
)
</script>

<template>
  <canvas ref="canvasRef" style="width:100%; height:300px;"></canvas>
</template>

<template>
  <v-breadcrumbs :items="breadcrumbs">
    <template v-slot:divider>
      <v-icon>mdi-chevron-right</v-icon>
    </template>
  </v-breadcrumbs>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const items = []

  // Ticket
  if (['bus-queue', 'home', 'detail', 'seat', 'bill'].includes(route.name)) {
    items.push({ title: 'Ticket', disabled: route.name === 'bus-queue', to: '/ticket' })
  }

  // Ticket Detail
  if (['home', 'detail', 'seat', 'bill'].includes(route.name)) {
    items.push({
      title: 'Ticket Detail',
      disabled: route.name === 'home',
      to: '/ticket-detail'
    })
  }

  // Detail
  if (['detail', 'seat', 'bill'].includes(route.name)) {
    items.push({
      title: 'Detail',
      disabled: route.name === 'detail',
      to: route.name === 'detail' ? undefined : `/detail/${route.params.id}`
    })
  }

  // Bill
  if (['bill'].includes(route.name)) {
    items.push({ title: 'Bill', disabled: true })
  }

  return items
})
</script>

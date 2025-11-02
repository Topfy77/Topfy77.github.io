<script setup>
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

// Mapping route เป็น parent-child
const breadcrumbMap = {
  '/dashboard': null,
  '/ticket': '/dashboard',
  '/detail/:id': '/ticket',
  '/seat/:id': '/ticket',
  '/bill/:id': '/ticket',
  '/drivers': '/dashboard',
  '/add-ticket': '/ticket',
  '/add-driver': '/drivers',
  '/list-bus-queue': '/dashboard',
  '/add-queue': '/ticket',
  '/ticket-detail': '/dashboard',
  '/list-bus': 'list-bus',
}


const breadcrumbName = {
  '/dashboard': 'Dashborad',
  '/ticket': 'ticket',
  '/detail/:id': 'Detail-ticket',
  '/seat/:id': 'Detail-seat',
  '/bill/:id': 'Detail-bill',
  '/drivers': 'All-drivers',
  '/add-ticket': 'Add-ticket',
  '/add-driver': 'Add-drivers',
  '/list-bus-queue': 'List-bus-queue',
  '/add-queue': 'Add-queue',
  '/ticket-detail': 'List-ticket',
  '/': 'login',
  '/list-bus': 'list-bus',}


function findRoutePattern(path) {
  return Object.keys(breadcrumbMap).find(pattern => {
    const regex = new RegExp("^" + pattern.replace(/:\w+/g, "\\w+") + "$")
    return regex.test(path)
  })
}

const breadcrumbs = computed(() => {
  const list = []
  let currentPath = route.path
  while (currentPath) {
    const pattern = findRoutePattern(currentPath)
    if (!pattern) break
    list.unshift({
      label: breadcrumbName[pattern],
      href: currentPath.includes(":") ? currentPath : currentPath
    })
    currentPath = breadcrumbMap[pattern]
  }
  return list
})
</script>

<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="inline-flex items-center space-x-1 md:space-x-2 text-sm">
      <li v-for="(item, index) in breadcrumbs" :key="index" class="flex items-center">
        <span v-if="index > 0" class="mx-1">></span>
        <router-link :to="item.href" class="text-gray-500 hover:text-gray-700">
          {{ item.label }}
        </router-link>
      </li>
    </ol>
  </nav>
</template>

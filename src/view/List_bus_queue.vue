<template> 

  <v-container>
    <v-row justify="space-between" class="mb-4">
      <h2>ຄິວລົດທັງໝົດ</h2>
    </v-row>

    <v-data-table
      :headers="headers"
      :items="queueList"
      :loading="loading"
      class="elevation-1"
    >
      <template v-slot:item.bq_date="{ item }">
        {{ formatDate(item.bus_queue?.bq_date) }}
      </template>

      <template v-slot:item.bq_time="{ item }">
        {{ item.bus_queue?.bq_time }}
      </template>

      <template v-slot:item.bq_distance="{ item }">
        {{ item.bus_queue?.bq_distance }}
      </template>

      <template v-slot:item.bq_zone="{ item }">
        {{ item.bus_queue?.bq_zone }}
      </template>

      <template v-slot:item.bus_number="{ item }">
        {{ item.bus?.bus_number }}
      </template>

      <template v-slot:item.dv_name="{ item }">
        {{ item.bus?.driver?.dv_name }}
      </template>

      <template v-slot:item.cat_type="{ item }">
        {{ item.bus?.category?.cat_type }}
      </template>

      <template v-slot:item.bus_capacity="{ item }">
        {{ item.bus?.bus_capacity }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn color="green" @click="goToAddTicket(item.queue_id)">ເພີ່ມປີ້</v-btn>
        <v-btn color="blue" @click="editData(item)">ແກ້ໄຂຂໍ້ມູນ</v-btn>
        <v-btn color="red" @click="deleteData(item)">ລົບຂໍ້ມູນ</v-btn>
        
      </template>
    </v-data-table>
<v-btn color="primary" @click="addData">ເພີ່ມຂໍ້ມູນ</v-btn>
    
    <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { gql } from "@apollo/client/core"
import { useQuery } from "@vue/apollo-composable"
import apolloClient from "../apollo"

// Router
const router = useRouter()

// Navigation Functions
function addData() {
  router.push({ name: "add-queue" })
}

function editData(item) {
  router.push({
    name: "add-queue",
    query: { id: item.queue_id }
  })
}

function goToAddTicket(queueId) {
  router.push({ name: "add-ticket", query: { queue_id: queueId } })
}

// DELETE MUTATION แบบ Cascade
const DELETE_FULL_QUEUE = gql`
mutation DeleteAll($queueId: Int!, $bqId: Int!) {
 
  delete_Bus_bill(
    where: {
      ticket: {
        queue_id: { _eq: $queueId }
      }
    }
  ) {
    affected_rows
  }


  delete_Bus_ticket(
    where: {
      queue_id: { _eq: $queueId }
    }
  ) {
    affected_rows
  }

  #
  delete_Bus_queue_op_by_pk(queue_id: $queueId) {
    queue_id
  }

  delete_Bus_bus_queue_by_pk(bq_id: $bqId) {
    bq_id
  }
}
`


async function deleteData(item) {
  const confirmed = confirm("ເຈົ້າແນ່ໃຈບໍ່ທີ່ຈະລົບຄິວນີ້?")
  if (!confirmed) return

  try {
    await apolloClient.mutate({
      mutation: DELETE_FULL_QUEUE,
      variables: {
        queueId: item.queue_id,
        bqId: item.bus_queue?.bq_id,
      },
    })

    alert("ລົບສໍາເລັດ")
    refetch()
  } catch (err) {
    console.error(err)
    alert("ລົບບໍ່ສໍາເລັດ: " + err.message)
  }
}



const headers = [
  { title: "ວັນທີ່", value: "bq_date" },
  { title: "ເວລາ", value: "bq_time" },
  { title: "ຕົ້ນທາງ - ປາຍທາງ", value: "bq_distance" },
  { title: "ໂຊນບ່ອນຈອດ", value: "bq_zone" },
  { title: "ປ້າຍລົດ", value: "bus_number" },
  { title: "ຈຳນວນບ່ອນນັ່ງທັງຫມົດ", value: "bus_capacity" },
  { title: "ຄົນຂັບລົດ", value: "dv_name" },
  { title: "ປະເພດລົດ", value: "cat_type" },
  { title: "ການຈັດການ", value: "actions", sortable: false }
]

// Query data
const GET_QUEUE_WITH_BUS = gql`
  query GetQueueWithBus {
    Bus_queue_op(order_by: { queue_id: desc }) {
      queue_id
      bus {
        bus_id
        bus_number
        bus_capacity
        seats_reserved
        seats_available
        driver {
          dv_name
        }
        category {
          cat_type
        }
      }
      bus_queue {
        bq_id
        bq_date
        bq_time
        bq_zone
        bq_distance
      }
    }
  }
`

const { result, loading, error, refetch } = useQuery(GET_QUEUE_WITH_BUS)
const queueList = computed(() => result.value?.Bus_queue_op ?? [])

function formatDate(dateStr) {
  if (!dateStr) return "-"
  const options = { day: "numeric", month: "numeric", year: "numeric" }
  return new Date(dateStr).toLocaleDateString("en-GB", options)
}
</script>


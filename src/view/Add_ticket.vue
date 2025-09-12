<template>
  <v-container>
    <h2>ເພີ່ມປີ້ລົດ</h2>
    
    <v-form @submit.prevent="submitTicket">
      <v-text-field v-model="ticket.tk_price" label="ລາຄາປີ້ລົດ" required />
      <v-text-field v-model="ticket.queue_id" label="Queue ID" readonly />

      
      <div class="d-flex justify-space-between mt-1">
        <v-btn   color="grey" @click="goBack">
          ຍ້ອນກັບ
        </v-btn>

        <v-btn type="submit" color="primary">
          ບັນທຶກ
        </v-btn>
      </div>
    </v-form>
  </v-container>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gql } from '@apollo/client'
import { useMutation } from '@vue/apollo-composable'
import apolloClient from '../apollo'

const route = useRoute()
const router = useRouter()

const ticket = ref({
  tk_price: '',
  
  
  queue_id: null
})

onMounted(() => {
  // รับ queue_id จาก query param
  ticket.value.queue_id = parseInt(route.query.queue_id || '0')
})

const ADD_TICKET = gql`
  mutation AddTicket($input: Bus_ticket_insert_input!) {
    insert_Bus_ticket_one(object: $input) {
      tk_id
    }
  }
`
function goBack(){
    router.push({name:"list-bus"})
}
async function submitTicket() {
  try {
    await apolloClient.mutate({
      mutation: ADD_TICKET,
      variables: {
        input: ticket.value
      }
    })
    alert('ເພີ່ມປີ້ສຳເລັດ!')
    router.push('/list-bus-queue') // กลับไปหน้ารายการคิว
  } catch (error) {
    console.error(error)
    alert('ຜິດພາດໃນການເພີ່ມປີ້')
  }
}
</script>

<template> 
  <v-container>
    <v-card class="mt-4 pa-4" max-width="700">
      <v-card-title >ເພີ່ມລົດແລະຄິວລົດ</v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="valid" lazy-validation>
          
          <v-text-field v-model="form.bus_number" label="ປ້າຍລົດ" :rules="[rules.required]" />
          <v-text-field v-model="form.bus_capacity" label="ຈຳນວນທີ່ນັ່ງທັງໝົດ" type="number" :rules="[rules.required]" />
          <v-text-field v-model="form.seats_reserved" label="ທີ່ນັ່ງທີ່ຖືກຈອງ" type="number" :rules="[rules.required]" />
          <v-text-field v-model="form.seats_available" label="ທີ່ນັ່ງວ່າງ" type="number" :rules="[rules.required]" />

          <v-select
            v-model="form.dv_id"
            :items="drivers"
            item-title="dv_name"
            item-value="dv_id"
            label="ຊື່ຄົນຂັບລົດ"
            :rules="[rules.required]"
            :loading="driversLoading"
          />

          <v-select
            v-model="form.cat_id"
            :items="categories"
            item-title="cat_name"
            item-value="cat_id"
            label="ປະເພດລົດ"
            :rules="[rules.required]"
            :loading="categoriesLoading"
          />

          <!-- ข้อมูลคิวรถ -->
          <v-text-field v-model="form.bq_date" label="ວັນທີ ອອກເດີນທາງ" type="date" :rules="[rules.required]" />
          <v-text-field v-model="form.bq_time" label="ເວລາ ອອກເດີນທາງ" type="time" :rules="[rules.required]" />
          <v-text-field v-model="form.bq_zone" label="ໂຊນບ່ອນຈອດລົດ" :rules="[rules.required]" />
          <v-text-field v-model="form.bq_distance" label="ຕົ້ນທາງ - ປາຍທາງ" :rules="[rules.required]" />
        </v-form>

        <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
        <v-alert v-if="success" type="success" class="mt-2">{{ success }}</v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="mutationLoading" @click="submitForm">ບັນທືກ</v-btn>
      </v-card-actions>
    </v-card>

    <v-btn text color="secondary" @click="back">Back</v-btn>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed } from "vue"
import { useQuery, useMutation } from "@vue/apollo-composable"
import { gql } from "@apollo/client/core"
import { useRouter } from "vue-router"
import { useRoute } from "vue-router"
const route = useRoute()
const editingId = ref(route.query.id ? parseInt(route.query.id) : null)


const router = useRouter()
const formRef = ref(null)
const valid = ref(false)
const error = ref("")
const success = ref("")
const form = reactive({
  bus_number: "",
  bus_capacity: "",
  seats_reserved: "",
  seats_available: "",
  dv_id: "",
  cat_id: "",
  bq_date: "",
  bq_time: "",
  bq_zone: "",
  bq_distance: ""
})

function back() {
  router.push({ name: "list-bus" })
}

const rules = {
  required: v => !!v || "ກາລຸນາກອກຂໍ້ມູນ"
}

// === Queries ===
const GET_DRIVERS = gql`
  query {
    Bus_driver {
      dv_id
      dv_name
      dv_tel
    }
  }
`
const { result: driverResult, loading: driversLoading } = useQuery(GET_DRIVERS)
const drivers = computed(() => driverResult.value?.Bus_driver ?? [])

const GET_CATEGORIES = gql`
  query {
    Bus_category {
      cat_id
      cat_type
    }
  }
`
const { result: catResult, loading: categoriesLoading } = useQuery(GET_CATEGORIES)
const categories = computed(() => catResult.value?.Bus_category ?? [])

// === Mutations ===
const INSERT_BUS = gql`
  mutation InsertBus(
    $bus_number: String!
    $bus_capacity: Int!
    $seats_reserved: Int!
    $seats_available: Int!
    $dv_id: Int!
    $cat_id: Int!
  ) {
    insert_Bus_bus_one(object: {
      bus_number: $bus_number
      bus_capacity: $bus_capacity
      seats_reserved: $seats_reserved
      seats_available: $seats_available
      dv_id: $dv_id
      cat_id: $cat_id
    }) {
      bus_id
    }
  }
`

const INSERT_QUEUE = gql`
  mutation InsertQueue(
    $bq_date: date!
    $bq_time: String!
    $bq_zone: String!
    $bq_distance: String!
  ) {
    insert_Bus_bus_queue_one(object: {
      bq_date: $bq_date
      bq_time: $bq_time
      bq_zone: $bq_zone
      bq_distance: $bq_distance
    }) {
      bq_id
    }
  }
`

const INSERT_QUEUE_OP = gql`
  mutation InsertQueueOp(
    $bus_id: Int!
    $bq_id: Int!
  ) {
    insert_Bus_queue_op_one(object: {
      bus_id: $bus_id
      bq_id: $bq_id
    }) {
      queue_id
    }
  }
`
const GET_QUEUE_BY_ID = gql`
  query GetQueueById($id: Int!) {
    Bus_queue_op_by_pk(queue_id: $id) {
      bus {
        bus_number
        bus_capacity
        seats_reserved
        seats_available
        dv_id
        cat_id
      }
      bus_queue {
        bq_date
        bq_time
        bq_zone
        bq_distance
      }
    }
  }
`
if (editingId.value) {
  const { onResult, onError } = useQuery(GET_QUEUE_BY_ID, { id: editingId.value })

  onResult(({ data }) => {
    if (!data?.Bus_queue_op_by_pk) return

    const { bus, bus_queue } = data.Bus_queue_op_by_pk

    form.bus_number = bus.bus_number
    form.bus_capacity = bus.bus_capacity
    form.seats_reserved = bus.seats_reserved
    form.seats_available = bus.seats_available
    form.dv_id = bus.dv_id
    form.cat_id = bus.cat_id

    form.bq_date = bus_queue.bq_date
    form.bq_time = bus_queue.bq_time
    form.bq_zone = bus_queue.bq_zone
    form.bq_distance = bus_queue.bq_distance
  })

  onError((err) => {
    error.value = "ດຶງຂໍ້ມູນບໍ່ສຳເລັດ"
    console.error(err)
  })
}

const { mutate: insertBus, loading: mutationLoading } = useMutation(INSERT_BUS)
const { mutate: insertQueue } = useMutation(INSERT_QUEUE)
const { mutate: insertQueueOp } = useMutation(INSERT_QUEUE_OP)

// === Main submit function ===
async function submitForm() {
  const ok = await formRef.value.validate()
  if (!ok) {
    error.value = "ກາລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ"
    return
  }

  error.value = ""
  success.value = ""

  try {
    // แปลงเวลาเป็น HH:MM
    let timeValue = form.bq_time
    if (timeValue.length >= 5) timeValue = timeValue.slice(0, 5)
    else throw new Error("ຮູບແບບເວລາແບບບໍ່ຖືກ")

    
    const busRes = await insertBus({
      bus_number: form.bus_number,
      bus_capacity: parseInt(form.bus_capacity),
      seats_reserved: parseInt(form.seats_reserved),
      seats_available: parseInt(form.seats_available),
      dv_id: parseInt(form.dv_id),
      cat_id: parseInt(form.cat_id)
    })
    const bus_id = busRes?.data?.insert_Bus_bus_one?.bus_id
    if (!bus_id) throw new Error("ບັນທືກລົດບໍ່ສຳເລັດ")

    // 2) Insert คิวรถ
    const queueRes = await insertQueue({
      bq_date: form.bq_date,
      bq_time: timeValue,
      bq_zone: form.bq_zone,
      bq_distance: form.bq_distance
    })
    const bq_id = queueRes?.data?.insert_Bus_bus_queue_one?.bq_id
    if (!bq_id) throw new Error("ບັນທືກຄິວລົດບໍ່ສຳເລັດ")

    // 3) Insert ความสัมพันธ์ queue_op
    await insertQueueOp({
      bus_id,
      bq_id
    })

    success.value = "ເພີ່ມລົດ ແລະ ຄິວລົດສຳເລັດ "

    // ล้างฟอร์ม
    Object.keys(form).forEach(k => form[k] = "")
  } catch (err) {
    console.error(err)
    error.value = err.message || "ເກີດຂໍ້ຜິດພາດ"
  }
}
</script>


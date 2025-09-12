<template>
  <v-card>
    <v-layout>
      <template v-if="route.name !== 'login'">
        <!-- Sidebar -->
        <v-navigation-drawer
          v-model="drawer"
          :rail="rail"
          permanent
          @click="rail = false"
          class="d-flex flex-column"
        >
          <div>
            <v-list>
              <v-list-item>
                <v-row justify="center" class="w-10">
                  <v-avatar size="100">
                    <v-img
                      src="https://previews.123rf.com/images/mukhlasin/mukhlasin1805/mukhlasin180500008/102801101-a-view-of-the-bus-terminal-in-indonesian-territory.jpg"
                    />
                  </v-avatar>
                </v-row>
                <template v-slot:append>
                  <v-btn color="primary" icon @click.stop="rail = !rail">
                    <
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-divider></v-divider>

            <v-list density="compact" nav>
              <v-list-item prepend-icon="mdi-home-city" title="dashboard" to="/dashboard" router />
              <v-list-item prepend-icon="mdi-account" title="ຈັດການປີ້ລົດ" to="/ticket" />
              <v-list-item prepend-icon="mdi-account-group-outline" title="ລາຍລະອຽດປີ້ລົດທີ່ຖືກຂາຍ" to="/ticket-detail" />
              <v-list-item prepend-icon="mdi-account-group-outline" title="ຂໍ້ມູນຄົນຂັບລົດເມ" to="/drivers" />
              <v-list-item prepend-icon="mdi-account-group-outline" title="ຈັດການຄິວລົດ" to="/list-bus-queue" />
            </v-list>
          </div>

          <div class="mt-auto">
            <v-divider></v-divider>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-logout" title="Logout" @click="logout" />
            </v-list>
          </div>
        </v-navigation-drawer>

        <!-- Top App Bar -->
        <v-app-bar flat color="transparent">
          <v-spacer></v-spacer>

         <v-menu offset-y>
  <template #activator="{ props }">
    <v-btn icon v-bind="props">
      <v-avatar size="36">
        <v-img src="https://img.freepik.com/premium-vector/round-man-character-mockup-icon-flat-color-character-template-jacket-round-icon-man-jacket-dark-hair-vector-icon_774778-2396.jpg" />
      </v-avatar>
    </v-btn>
  </template>

  <v-card min-width="220">
    <v-list>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-subtitle-1">{{ employee.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ employee.email }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list-item prepend-icon="mdi-logout" title="Logout" @click="logout" />
    </v-list>
  </v-card>
</v-menu>

          
        </v-app-bar>
      </template>

      <!-- Main -->
      <v-main class="pt-0">
        <router-view />
      </v-main>
    </v-layout>
  </v-card>
</template>


<script setup>
import { ref, watch, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useQuery } from "@vue/apollo-composable"
import { gql } from "@apollo/client/core"

// UI control
const drawer = ref(true)
const rail = ref(true)
const route = useRoute()
const router = useRouter()

// Logout function
function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("epy_id")
  router.push({ name: "login" })
}


const epyId = ref(parseInt(localStorage.getItem("epy_id") || "0"))


const GET_EMPLOYEE = gql`
  query GetEmployeeById($id: Int!) {
    Bus_employee_by_pk(epy_id: $id) {
      epy_name
        
      epy_email
    }
  }
`


const { result, loading, refetch, error } = useQuery(GET_EMPLOYEE, () => ({
  id: epyId.value
}))

const employee = ref({ name: "", email: "" })


watch(() => result.value, (newVal) => {
  const data = newVal?.Bus_employee_by_pk
  if (data) {
    employee.value.name = data.epy_name
    employee.value.email = data.epy_email
  } else {
   
    employee.value.name = ""
    employee.value.email = ""
  }
})


window.addEventListener('storage', () => {
  const newId = parseInt(localStorage.getItem("epy_id") || "0")
  if (newId !== epyId.value) {
    epyId.value = newId
  }
})
</script>



<style scoped>
.v-main {
  padding-top: 60px;
}
* {
  font-family: 'Noto Sans Lao', 'Roboto', sans-serif;
}
</style>

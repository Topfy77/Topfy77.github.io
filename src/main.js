// main.js
import { createApp, h, provide } from 'vue'
import App from './App.vue'
import router from './router'             // ถ้าไม่ได้ใช้ Router ลบได้
import vuetify from './plugins/vuetify'   // path ให้ตรงกับโปรเจกต์
import apolloClient from './apollo.js'    // ไฟล์ที่คุณสร้างไว้
import { DefaultApolloClient } from '@vue/apollo-composable'

const app = createApp({
  setup() {
    // provide ApolloClient ให้ทุก component ใช้ useQuery / useMutation ได้
    provide(DefaultApolloClient, apolloClient)
  },
  render: () => h(App)
})

app.use(router)   
app.use(vuetify)
app.mount('#app')

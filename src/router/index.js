
import { createRouter,createWebHistory} from "vue-router";
import Login from "../view/Login.vue";


import Driver from "../view/Driver.vue";
import Bus_queue from "../view/Bus_queue.vue";
import Detail_bus from "../view/Detail_bus.vue";
import Seat_detail from "../view/Seat_detail.vue";
import Bill_detail from "../view/Bill_detail.vue";
import Add_queue from "../view/Add_queue.vue";
import Dashboard from "../view/Dashboard.vue";
import List_bus_queue from "../view/List_bus_queue.vue";
import Add_ticket from "../view/Add_ticket.vue";
import List_ticket from "../view/List_ticket.vue";





const  routes=[
{path:"/", name:"login", component:Login},
{path:"/ticket-detail" , name:"home", component: List_ticket},
{path:"/drivers",name:"drivers", component: Driver},
{path:"/ticket",name:"bus-queue" , component: Bus_queue},
{path:"/detail/:id",name:"detail", component: Detail_bus}, 
{path:"/seat/:id" ,name:"seat", component: Seat_detail},
{path:"/bill/:id",name:"bill",component: Bill_detail},
{path:"/add-queue" , name:"add-queue" , component: Add_queue},
{path:"/dashboard",name:"dashboard",component: Dashboard},
{path:"/list-bus-queue",name:"list-bus", component:List_bus_queue},
{path:"/add-ticket",name:"add-ticket", component:Add_ticket},

]
const router= createRouter({
    history:createWebHistory(),
    routes
})
export default router;
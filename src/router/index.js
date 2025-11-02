import { createRouter, createWebHistory } from "vue-router";
import Login from "../view/Login.vue";
import Driver from "../view/Driver.vue";
import Bus_queue from "../view/Bus_queue.vue";
import Detail_bus from "../view/Detail_bus.vue";
import Seat_detail from "../view/Seat_detail.vue";
import Bill_detail from "../view/Bill_detail.vue";

import Dashboard from "../view/Dashboard.vue";

import List_ticket from "../view/List_ticket.vue";

import Bus_detail from "../view/Bus_detail.vue";
import Seting from "../view/Seting.vue";
import List_Bus from "../view/List_Bus.vue";
import List_queue from "../view/List_queue.vue";

const routes = [
  { path: "/", name: "login", component: Login, meta: { breadcrumb: "Login" } },
  { path: "/ticket-detail", name: "home", component: List_ticket, meta: { breadcrumb: "List-ticket" } },
  { path: "/drivers", name: "drivers", component: Driver, meta: { breadcrumb: "Drivers" } },
  { path: "/ticket", name: "bus-queue", component: Bus_queue, meta: { breadcrumb: "Ticket" } },
  { path: "/detail/:id", name: "detail", component: Detail_bus, meta: { breadcrumb: "Detail-ticket" } },
  { path: "/seat/:id", name: "seat", component: Seat_detail, meta: { breadcrumb: "Detail-seat" } },
  { path: "/bill/:id", name: "bill", component: Bill_detail, meta: { breadcrumb: "Detail-bill" } },
{path:'/list-queue',name:'list-queue',component:List_queue},
  { path: "/dashboard", name: "dashboard", component: Dashboard, meta: { breadcrumb: "Dashboard" } },


  {path:"/bus-detail/:bq_id/:date",name:"bus-detail",component: Bus_detail,  props: true,  meta:{breadcrumb:"bus-detail"}},,
  {path:"/setting",name:"setting",component: Seting, meta:{breadcrumb:"setting"}},
  {path:"/list-bus" , name:"list-bus", component: List_Bus, meta:{breadcrumb:"lis-bus"}},
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

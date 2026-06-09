import { createRouter, createWebHistory } from "vue-router";
import Lobby from "../views/Lobby.vue";
import Result from "../views/Result.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Lobby,
  },
  {
    path: "/lobby",
    name: "Lobby",
    component: Lobby,
  },
  {
    path: "/result",
    name: "Result",
    component: Result,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;

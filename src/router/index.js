import { createRouter, createWebHistory } from 'vue-router'
import Lobby from '../views/Lobby.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Lobby
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: Lobby
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
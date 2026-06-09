import { createRouter, createWebHistory } from 'vue-router'
import Lobby from '../views/Lobby.vue'
import GameView from '../views/GameView.vue'
import FriendView from '@/views/FriendView.vue'

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
  {
    path: '/game',
    name: 'Game',
    component: GameView
  },
  {
    path: '/friend',
    name: 'Friend',
    component: FriendView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

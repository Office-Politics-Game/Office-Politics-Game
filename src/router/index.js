import { createRouter, createWebHistory } from "vue-router";
import EntryPage from "../views/EntryPage.vue";
import LoginPage from "../components/LoginPage.vue";
import Lobby from "../views/Lobby.vue";
import GameView from "../views/GameView.vue";
import FriendView from "@/views/FriendView.vue";

const routes = [
  {
    path: "/",
    name: "Entry",
    component: EntryPage,
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
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

  {
    path: "/game",
    name: "Game",
    component: GameView,
  },
  {
    path: "/friend",
    name: "Friend",
    component: FriendView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;

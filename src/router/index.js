import { createRouter, createWebHistory } from "vue-router";
import EntryPage from "../views/EntryPage.vue";
import LoginPage from "../components/login/LoginPage.vue";
import Lobby from "../views/Lobby.vue";
import GameView from "../views/GameView.vue";
import FriendView from "@/views/FriendView.vue";
import Result from "@/views/Result.vue";
import GameRoomView from "@/views/GameRoomView.vue";
import MatchingModal from "@/components/gameRoom/MatchingModal.vue";
import JoinRoomModal from "@/components/gameRoom/JoinRoomModal.vue";
import CustomRoomView from "@/views/CustomRoomView.vue";
import InviteFriendModal from "@/components/gameRoom/InviteFriendModal.vue";

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
  {
    path: "/game-menu",
    name: "GameMenu",
    component: GameRoomView,
  },
  {
    path: "/matching",
    name: "Matching",
    component: MatchingModal,
  },
  {
    path: "/join-room",
    name: "JoinRoom",
    component: JoinRoomModal,
  },    
  {
    path: "/custom-room",
    name: "CustomRoom",
    component: CustomRoomView,
  },
  {
    path: "/invite-friend",
    name: "InviteFriend",
    component: InviteFriendModal,
  },  
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;

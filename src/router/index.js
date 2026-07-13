import { createRouter, createWebHistory } from "vue-router";
import EntryPage from "../views/EntryPage.vue";
import LoginPage from "../components/login/LoginPage.vue";
import Lobby from "../views/Lobby.vue";
import LobbyMenu from "@/components/menu/LobbyMenu.vue";
import GameView from "../views/GameView.vue";
import FriendView from "@/views/FriendView.vue";
import MallView from "@/views/MallView.vue";
import ProfileView from "@/views/ProfileView.vue";
import GachaView from "@/views/GachaView.vue";
import Result from "@/views/Result.vue";
import LoadingView from "@/views/LoadingView.vue";
import GameMenuPanel from "@/components/gameRoom/GameMenuPanel.vue";
import MatchingModal from "@/components/gameRoom/MatchingModal.vue";
import JoinRoomModal from "@/components/gameRoom/JoinRoomModal.vue";
import CustomRoomView from "@/views/CustomRoomView.vue";
import InviteFriendModal from "@/components/gameRoom/InviteFriendModal.vue";
import CardDealDemoView from "@/views/CardDealDemoView.vue";
import AnimationDemoView from "@/views/AnimationDemoView.vue";
import CardPlayTestView from "@/views/CardPlayTestView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import { useAuthStore } from "../stores/authStore.js";

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
    path: "/register",
    name: "Register",
    component: LoginPage,
  },
  {
    path: "/lobby",
    name: "Lobby",
    component: Lobby,
    children: [
      {
        path: "",
        name: "LobbyHome",
        component: LobbyMenu,
      },
      {
        path: "game-menu",
        name: "LobbyGameMenu",
        component: GameMenuPanel,
      },
    ],
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
    path: "/loading",
    name: "Loading",
    component: LoadingView,
  },
  {
    path: "/friend",
    name: "Friend",
    component: FriendView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/mall",
    name: "Mall",
    component: MallView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfileView,
  },
  {
    path: "/gacha",
    name: "Gacha",
    component: GachaView,
  },
  {
    path: "/game-menu",
    name: "GameMenu",
    redirect: "/lobby/game-menu",
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
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/card-deal-demo",
    name: "CardDealDemo",
    component: CardDealDemoView,
  },
  {
    path: "/enemycardplay_demo",
    name: "enemycardplay_demo",
    component: AnimationDemoView,
  },
  {
    path: "/cardplay_test",
    name: "cardplay_test",
    component: CardPlayTestView,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)

  if (!requiresAuth) {
    return true
  }

  const authStore = useAuthStore()
  const isVerified = await authStore.verifyToken()

  if (isVerified) {
    return true
  }

  return {
    name: "Login"
  }
})

export default router;

<script setup>
import roomMenu from "@/assets/images/room-menu.webp";
import WaitingRoomMenu from "@/components/gameRoom/WaitingRoomMenu.vue";
import { useRouter } from "vue-router";
import { usePreGameAudio } from "@/composables/UsePreGameAudio";

const router = useRouter();
const { playPreGameSound } = usePreGameAudio();

function returnLobby() {
  playPreGameSound("lobby-navigation-whoosh");
  router.push({ name: "LobbyHome" });
}
</script>

<template>
  <section
    class="relative h-81 w-144 bg-[length:100%_100%] bg-center shadow-2xl lg:h-135 lg:w-240"
    :style="{ backgroundImage: `url(${roomMenu})` }"
  >
    <WaitingRoomMenu />
    <button
      class="btn-glass tap-pop absolute w-30 bottom-3 left-1/2 z-10 -translate-x-1/2 lg:bottom-4"
      type="button"
      @click="returnLobby"
    >
      返回
    </button>
  </section>
</template>

<script setup>
import PlayerAvatar from "./PlayerAvatar.vue";

defineProps({
  players: {
    type: Array,
    required: true,
    validator: (players) => {
      const positions = ["top", "left", "right", "bottom"];

      return (
        players.length === 4 &&
        players.every(
          (player) =>
            typeof player?.id === "string" &&
            typeof player?.name === "string" &&
            typeof player?.avatarUrl === "string" &&
            Number.isInteger(player?.roundWins) &&
            player?.roundWins >= 0 &&
            player?.roundWins <= 3 &&
            (player?.level === undefined ||
              typeof player?.level === "number" ||
              typeof player?.level === "string") &&
            positions.includes(player?.position) &&
            typeof player?.isCurrentPlayer === "boolean",
        )
      );
    },
  },
});

const positionClasses = {
  top: "top-[48px] left-1/2 -translate-x-1/2 lg:top-28",
  left: "top-[42%] left-3 -translate-y-1/2 lg:left-7",
  right: "top-[42%] right-3 -translate-y-1/2 lg:right-7",
  bottom: "bottom-3 left-[calc(50%-220px)] lg:bottom-10 lg:left-[calc(50%-400px)]",
};
</script>

<template>
  <div
    class="player-seats pointer-events-none absolute inset-0 z-10"
    aria-label="玩家座位"
  >
    <div
      v-for="player in players"
      :key="player.id"
      class="player-seats__seat absolute"
      :class="positionClasses[player.position]"
    >
      <PlayerAvatar
        :name="player.name"
        :avatar-url="player.avatarUrl"
        :round-wins="player.roundWins"
        :level="player.level"
        :is-current-player="player.isCurrentPlayer"
        :is-mirrored="player.position === 'right'"
      />
    </div>
  </div>
</template>

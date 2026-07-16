<template>
  <section
    class="profile-info p-[12px_12px_12px_16px] lg:p-[16px_28px_0]"
    aria-labelledby="profile-info-title"
  >
    <h2
      id="profile-info-title"
      class="mb-2.5 text-md font-black text-[var(--brand-navy)] lg:mb-3.5 lg:text-lg"
    >
      個人資料
    </h2>

    <dl
      class="profile-info__list m-0 overflow-hidden border border-[rgba(160,166,179,0.24)] bg-[rgba(255,255,255,0.35)]"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="profile-info__row grid min-h-10 grid-cols-[128px_minmax(0,1fr)_32px] items-center border-b border-[rgba(160,166,179,0.24)] lg:min-h-[66px] lg:grid-cols-[260px_minmax(0,1fr)_48px]"
      >
        <dt
          class="flex min-w-0 items-center gap-[9px] pl-2.5 text-xs font-bold text-[var(--gray-500)] lg:gap-6 lg:pl-6 lg:text-[16px]"
        >
          <component
            :is="item.icon"
            class="profile-info__icon shrink-0 text-[var(--brand-active)]"
            :size="21"
            stroke-width="2"
          />
          <span>{{ item.label }}</span>
        </dt>
        <dd
          class="m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs font-semibold text-[var(--brand-navy)] lg:text-[16px]"
        >
          {{ item.value }}
        </dd>
        <button
          v-if="item.editable"
          type="button"
          class="profile-info__edit grid h-7 w-7 place-items-center justify-self-center border-0 bg-transparent text-[var(--brand-navy)] lg:h-9 lg:w-9"
          :aria-label="canEdit ? `編輯${item.label}` : `登入後才能編輯${item.label}`"
          :disabled="!canEdit"
          @click="emit('edit', item)"
        >
          <Pencil :size="19" stroke-width="2.4" />
        </button>
        <span v-else class="profile-info__spacer justify-self-center"></span>
      </div>
    </dl>
  </section>
</template>

<script setup>
import { computed } from "vue";
import {
  CalendarClock,
  Crown,
  Pencil,
  UserRound,
  BadgeInfo,
  KeyRound,
} from "lucide-vue-next";

const props = defineProps({
  player: {
    type: Object,
    required: true,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit"]);

const items = computed(() => [
  {
    id: "username",
    label: "暱稱",
    value: props.player.username,
    icon: UserRound,
    editable: true,
  },
  {
    id: "playerCode",
    label: "玩家 ID",
    value: props.player.playerCode,
    icon: UserRound,
    editable: false,
  },
  {
    id: "title",
    label: "稱號",
    value: props.player.title,
    icon: Crown,
    editable: false,
  },
  {
    id: "bio",
    label: "自我介紹",
    value: props.player.bio || "尚未設定",
    icon: BadgeInfo,
    editable: true,
  },
  {
    id: "createdAt",
    label: "加入時間",
    value: props.player.createdAtDisplay,
    icon: CalendarClock,
    editable: false,
  },
  {
    id: "password",
    label: "帳號安全",
    value: "修改密碼",
    icon: KeyRound,
    editable: true,
  },
]);
</script>

<style scoped>
.profile-info__row:last-child {
  border-bottom: 0;
}

.profile-info__edit {
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.profile-info__edit:hover {
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.profile-info__edit:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 4px var(--brand-focus);
}

.profile-info__edit:disabled {
  cursor: not-allowed;
  background: rgba(160, 166, 179, 0.24);
  color: var(--brand-disabled);
  transform: none;
}

.profile-info__edit:disabled:hover {
  background: rgba(160, 166, 179, 0.24);
  color: var(--brand-disabled);
  transform: none;
}
</style>

<template>
  <ul class="password-rules" aria-label="密碼格式條件">
    <li
      v-for="rule in passwordRuleChecks"
      :key="rule.key"
      class="password-rule"
      :class="{ 'is-valid': rule.isValid }"
    >
      <Check v-if="rule.isValid" class="password-rule__icon" />
      <X v-else class="password-rule__icon" />
      <span>{{ rule.label }}</span>
    </li>
  </ul>
</template>

<script setup>
import { computed } from "vue"
import { Check, X } from "lucide-vue-next"
import { getPasswordRuleChecks } from "@/utils/passwordRules.js"

const props = defineProps({
  password: {
    type: String,
    default: ""
  }
})

const passwordRuleChecks = computed(() =>
  getPasswordRuleChecks(props.password)
)
</script>

<style scoped>
.password-rules {
  margin-top: 8px;
  display: grid;
  gap: 4px;
  color: #b3261e;
  font-size: 13px;
  font-weight: 700;
}

.password-rule {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #b3261e;
  transition: color 0.18s ease;
}

.password-rule.is-valid {
  color: #2f8f46;
}

.password-rule__icon {
  width: 14px;
  height: 14px;
  stroke-width: 3;
}
</style>
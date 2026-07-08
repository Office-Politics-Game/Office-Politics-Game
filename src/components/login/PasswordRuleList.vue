<template>
  <ul
    class="password-rules"
    :class="{ 'has-input': hasInput }"
    aria-label="密碼格式條件"
  >
    <li
      v-for="rule in passwordRuleChecks"
      :key="rule.key"
      class="password-rule"
      :class="{ 'is-valid': rule.isValid }"
    >
      <Check v-if="rule.isValid" class="password-rule__icon" />
      <X v-else-if="hasInput" class="password-rule__icon" />
      <span v-else class="password-rule__placeholder-icon" />
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

const hasInput = computed(() => props.password.trim().length > 0)

const passwordRuleChecks = computed(() =>
  getPasswordRuleChecks(props.password)
)
</script>

<style scoped>
.password-rules {
  margin-top: 8px;
  display: grid;
  gap: 4px;
  color: var(--gray-300);
  font-size: 15px;
  font-weight: 700;
}

.password-rule {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--gray-300);
  transition: color 0.18s ease;
}

.password-rules.has-input .password-rule {
  color: #b3261e;
}

.password-rules.has-input .password-rule.is-valid {
  color: #2f8f46;
}

.password-rule__icon {
  width: 15px;
  height: 15px;
  stroke-width: 3;
}

.password-rule__placeholder-icon {
  width: 15px;
  height: 15px;
  display: inline-block;
}
</style>

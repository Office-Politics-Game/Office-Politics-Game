<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <span class="hover-block-hint">
    {{ message }}
  </span>
</template>

<style scoped>
:global(.hover-block-hint) {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 5;
  display: none;
  min-width: max-content;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  font-size: 13px;
  line-height: 1.2;
  pointer-events: none;
}

:global(.hover-block-hint-target:hover .hover-block-hint) {
  display: block;
}
</style>

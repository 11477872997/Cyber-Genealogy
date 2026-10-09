<script setup>
import UniIcons from './ArchiveUniIcons.vue'

defineProps({
  type: { type: String, required: true },
  size: { type: [Number, String], default: 16 },
  color: { type: String, default: 'currentColor' },
})
</script>

<template>
  <view class="app-icon"><UniIcons :type="type" :size="size" :color="color" /></view>
</template>

<script setup>
defineProps({ name: { type: String, default: '族谱' } })
</script>

<template>
  <view class="archive-book" aria-hidden="true">
    <view class="archive-book-spine"></view>
    <view class="archive-book-label">{{ name }}</view>
  </view>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'home' },
})
</script>

<template>
  <view class="global-skeleton" :class="`skeleton-${variant}`" aria-busy="true">
    <template v-if="variant === 'me'">
      <view class="skeleton-profile">
        <view class="skeleton-block skeleton-avatar"></view>
        <view class="skeleton-profile-copy"><view class="skeleton-block skeleton-name"></view><view class="skeleton-block skeleton-note"></view></view>
        <view class="skeleton-block skeleton-small-button"></view>
      </view>
      <view class="skeleton-menu">
        <view v-for="item in 3" :key="item" class="skeleton-menu-row"><view class="skeleton-block skeleton-menu-icon"></view><view class="skeleton-block skeleton-menu-label"></view><view class="skeleton-block skeleton-menu-count"></view></view>
      </view>
      <view class="skeleton-block skeleton-ad"></view>
    </template>

    <template v-else-if="variant === 'detail'">
      <view class="skeleton-detail-head">
        <view class="skeleton-detail-copy"><view class="skeleton-block skeleton-detail-title"></view><view class="skeleton-block skeleton-detail-line"></view><view class="skeleton-block skeleton-detail-line short"></view></view>
        <view class="skeleton-block skeleton-book"></view>
      </view>
      <view class="skeleton-actions"><view v-for="item in 3" :key="item" class="skeleton-block"></view></view>
      <view v-for="item in 3" :key="item" class="skeleton-detail-section"><view class="skeleton-block skeleton-section-title"></view><view class="skeleton-block skeleton-section-line"></view><view class="skeleton-block skeleton-section-line medium"></view><view class="skeleton-block skeleton-section-line short"></view></view>
    </template>

    <template v-else>
      <view class="skeleton-search-row"><view class="skeleton-block skeleton-search"></view><view class="skeleton-block skeleton-add"></view></view>
      <view class="skeleton-filters"><view v-for="item in 3" :key="item" class="skeleton-block"></view></view>
      <view class="skeleton-list">
        <view v-for="item in 3" :key="item" class="skeleton-family">
          <view class="skeleton-block skeleton-cover"></view>
          <view class="skeleton-family-copy"><view class="skeleton-block skeleton-family-title"></view><view class="skeleton-block skeleton-family-line"></view><view class="skeleton-block skeleton-family-line medium"></view><view class="skeleton-block skeleton-family-line short"></view></view>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped>
.global-skeleton { box-sizing: border-box; width: 100%; min-height: 100%; padding: 18px 16px 24px; background: #f7fbf5; }
.skeleton-block { border-radius: 5px; background: #e2e8e2; animation: skeleton-pulse 1.15s ease-in-out infinite alternate; }
.skeleton-search-row { display: flex; gap: 10px; }
.skeleton-search { height: 42px; flex: 1; }
.skeleton-add { width: 42px; height: 42px; flex: 0 0 42px; }
.skeleton-filters { height: 54px; display: grid; grid-template-columns: repeat(3, 1fr); align-items: center; gap: 26px; }
.skeleton-filters .skeleton-block { height: 13px; }
.skeleton-list { display: grid; gap: 12px; padding-top: 8px; }
.skeleton-family { min-height: 132px; padding: 16px; border: 1px solid #e5eae5; border-radius: 7px; display: flex; gap: 17px; background: #fff; }
.skeleton-cover { width: 76px; height: 98px; flex: 0 0 76px; }
.skeleton-family-copy { flex: 1; min-width: 0; padding-top: 5px; }
.skeleton-family-title { width: 45%; height: 18px; margin-bottom: 18px; }
.skeleton-family-line { width: 78%; height: 11px; margin-top: 11px; }
.skeleton-family-line.medium { width: 63%; }
.skeleton-family-line.short { width: 48%; }
.skeleton-profile { min-height: 150px; margin: -18px -16px 14px; padding: 28px 20px; display: flex; align-items: center; gap: 14px; background: #eef5ed; }
.skeleton-avatar { width: 68px; height: 68px; flex: 0 0 68px; border-radius: 50%; }
.skeleton-profile-copy { min-width: 0; flex: 1; }
.skeleton-name { width: 55%; height: 18px; }
.skeleton-note { width: 82%; height: 10px; margin-top: 12px; }
.skeleton-small-button { width: 66px; height: 34px; flex: 0 0 66px; }
.skeleton-menu { margin: 0 -16px; background: #fff; }
.skeleton-menu-row { height: 64px; padding: 0 22px; border-bottom: 1px solid #edf0ed; display: flex; align-items: center; gap: 15px; }
.skeleton-menu-icon { width: 22px; height: 22px; }
.skeleton-menu-label { width: 31%; height: 14px; }
.skeleton-menu-count { width: 38px; height: 11px; margin-left: auto; }
.skeleton-ad { height: 92px; margin-top: 18px; }
.skeleton-detail-head { min-height: 178px; padding: 22px; border: 1px solid #e5eae5; border-radius: 7px; display: flex; gap: 24px; background: #fff; }
.skeleton-detail-copy { min-width: 0; flex: 1; }
.skeleton-detail-title { width: 58%; height: 24px; margin: 8px 0 26px; }
.skeleton-detail-line { width: 72%; height: 12px; margin-top: 13px; }
.skeleton-detail-line.short { width: 52%; }
.skeleton-book { width: 92px; height: 122px; flex: 0 0 92px; }
.skeleton-actions { height: 64px; display: grid; grid-template-columns: repeat(3, 1fr); align-items: center; gap: 10px; }
.skeleton-actions .skeleton-block { height: 34px; }
.skeleton-detail-section { margin-top: 13px; padding: 20px; border: 1px solid #e5eae5; border-radius: 7px; background: #fff; }
.skeleton-section-title { width: 32%; height: 17px; margin-bottom: 20px; }
.skeleton-section-line { width: 100%; height: 11px; margin-top: 12px; }
.skeleton-section-line.medium { width: 82%; }
.skeleton-section-line.short { width: 61%; }
@keyframes skeleton-pulse { from { opacity: .58; } to { opacity: 1; } }
@media (min-width: 760px) {
  .global-skeleton { padding: 28px 32px; }
  .skeleton-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .skeleton-profile { margin: -28px -32px 18px; }
}
</style>

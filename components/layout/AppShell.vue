<script setup>
import { computed, onMounted, onUnmounted, ref, useSlots } from 'vue'
import AppIcon from '../icons/AppIcon.vue'
import GlobalSkeleton from './GlobalSkeleton.vue'
import { useCloudAccount } from '../../services/cloudService.js'

const props = defineProps({
  activeTab: { type: String, default: 'home' },
  title: { type: String, default: '赛博宗族' },
  viewportHeight: { type: Number, default: 0 },
  showBack: { type: Boolean, default: false },
  internalBack: { type: Boolean, default: false },
  scrollable: { type: Boolean, default: true },
})
const emit = defineEmits(['admin', 'back'])
const { globalLoading } = useCloudAccount()
const slots = useSlots()
const versionClicks = ref(0)
const statusBarHeight = ref(0)
const topbarHeight = computed(() => statusBarHeight.value + 54)
const topbarStyle = computed(() => ({
  height: `${topbarHeight.value}px`,
  paddingTop: `${statusBarHeight.value}px`,
}))
const shellStyle = computed(() => ({ height: props.viewportHeight ? `${props.viewportHeight}px` : '100vh' }))
const hasBottom = computed(() => !!slots.bottom)
const skeletonVariant = computed(() => props.showBack ? 'detail' : props.activeTab)

function measureWindow() {
  const info = uni.getWindowInfo()
  statusBarHeight.value = info.statusBarHeight || 0
}

measureWindow()
onMounted(() => uni.onWindowResize?.(measureWindow))
onUnmounted(() => uni.offWindowResize?.(measureWindow))

function clickVersion() {
  versionClicks.value += 1
  clearTimeout(clickVersion.timer)
  clickVersion.timer = setTimeout(() => { versionClicks.value = 0 }, 3000)
  if (versionClicks.value === 3) {
    versionClicks.value = 0
    emit('admin')
  }
}

function goBack() {
  if (props.internalBack) {
    emit('back')
    return
  }
  uni.navigateBack()
}
</script>

<template>
  <view class="ui-div app-shell" :class="{ 'home-shell': activeTab === 'home' && !scrollable }" :style="shellStyle">
    <view class="ui-aside sidebar shell-sidebar">
      <view class="ui-div brand-lockup"><view class="ui-div brand-mark"><image class="ui-img brand-image" src="/static/logo.png" mode="aspectFill" /></view><view class="ui-div"><view class="ui-div brand-name">赛博宗族</view><view class="ui-div brand-caption">FAMILY ARCHIVE</view></view></view>
      <view class="ui-nav main-nav">
        <button class="nav-item" :class="{ active: activeTab === 'home' }" type="button" @click="uni.switchTab({ url: '/pages/index/index' })"><AppIcon type="home" :size="18" /><view class="ui-span">族谱</view></button>
        <button class="nav-item" :class="{ active: activeTab === 'me' }" type="button" @click="uni.switchTab({ url: '/pages/me/index' })"><AppIcon type="person" :size="18" /><view class="ui-span">我的</view></button>
      </view>
    </view>
    <view class="ui-main main-content">
      <view class="ui-header topbar shell-topbar" :style="topbarStyle"><button v-if="showBack" class="archive-back" type="button" aria-label="返回" @click="goBack"><AppIcon type="left" :size="23" /></button><view class="ui-div breadcrumb"><view class="ui-strong">{{ title }}</view></view></view>
      <scroll-view v-if="scrollable" class="shell-body" scroll-y :show-scrollbar="false" :enable-flex="true"><view class="shell-body-inner"><GlobalSkeleton v-if="globalLoading" :variant="skeletonVariant" /><slot v-else /></view></scroll-view>
      <view v-else class="shell-body shell-body-static"><GlobalSkeleton v-if="globalLoading" :variant="skeletonVariant" /><slot v-else /></view>
      <view v-if="!globalLoading && hasBottom" class="shell-bottom"><slot name="bottom" /></view>
      <view v-if="activeTab === 'me'" class="ui-footer app-footer shell-footer"><view class="ui-span">赛博宗族</view><button type="button" @click="clickVersion">v0.1.0</button></view>
    </view>
  </view>
</template>

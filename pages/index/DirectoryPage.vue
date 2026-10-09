<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppShell from '../../components/layout/AppShell.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import FamilyBook from '../../components/family/FamilyBook.vue'
import ShareModal from '../../components/modals/ShareModal.vue'
import { useGenealogyStore } from '../../services/genealogyStore'
import { cloudErrorMessage, createShareCloud, flushFamilySave, hasCloudSession } from '../../services/cloudService.js'
import { restoreCloudSession } from '../../services/cloudSession.js'

const emit = defineEmits(['share-change'])
const { families, favorites, selectFamily, toggleFavorite, removeFamily } = useGenealogyStore()
const query = ref('')
const menu = ref('')
const type = ref('all')
const timeOrder = ref('default')
const surnameOrder = ref('default')
const shareFamily = ref(null)
const sharePath = ref('')
const shareTitle = ref('我的掌上族谱')
const shareLoading = ref(false)

const visibleFamilies = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  const list = families.value.filter((family) =>
    (type.value === 'all' || (family.type || 'local') === type.value) &&
    (!keyword || [family.name, family.surname, family.region, family.ownerName].some((text) => (text || '').toLowerCase().includes(keyword))),
  )
  if (surnameOrder.value !== 'default') list.sort((a, b) => (a.surname || a.name).localeCompare(b.surname || b.name, 'zh-CN') * (surnameOrder.value === 'asc' ? 1 : -1))
  else if (timeOrder.value !== 'default') list.sort((a, b) => ((a.updatedAt || a.createdAt || 0) - (b.updatedAt || b.createdAt || 0)) * (timeOrder.value === 'asc' ? 1 : -1))
  return list
})

onShow(() => {
  if (hasCloudSession()) restoreCloudSession().catch((error) => console.error('Family list refresh failed', error))
})

function openFamily(family) {
  if (!selectFamily(family.id)) return
  uni.navigateTo({ url: `/pages/families/detail?id=${encodeURIComponent(family.id)}` })
}

function confirmDelete(family) {
  uni.showModal({
    title: `删除${family.name}`,
    content: '该族谱的成员、留言和本机收藏将一起删除，且无法恢复。',
    confirmColor: '#b35f48',
    success: ({ confirm }) => { if (confirm) removeFamily(family.id) },
  })
}

function openShare(family) {
  if (!hasCloudSession()) {
    uni.showModal({ title: '请先登录', content: '微信登录后，族谱会同步到云端并支持跨设备分享。', confirmText: '去登录', success: ({ confirm }) => {
      if (confirm) uni.switchTab({ url: '/pages/me/index' })
    } })
    return
  }
  if (family.canShare === false) return uni.showToast({ title: '只有族谱创建者可以分享', icon: 'none' })
  sharePath.value = ''
  emit('share-change', null)
  shareFamily.value = family
}

async function prepareShare(role) {
  if (!shareFamily.value || shareLoading.value) return
  shareLoading.value = true
  try {
    await flushFamilySave(shareFamily.value)
    const result = await createShareCloud(shareFamily.value.id, role)
    shareTitle.value = `${result.familyName}邀请你${role === 'editor' ? '共同编辑' : '查看'}族谱`
    sharePath.value = `/pages/index/index?shareToken=${encodeURIComponent(result.token)}`
    emit('share-change', { title: shareTitle.value, path: sharePath.value })
  } catch (error) {
    uni.showToast({ title: cloudErrorMessage(error, '分享入口生成失败'), icon: 'none' })
  } finally {
    shareLoading.value = false
  }
}

function closeShare() {
  shareFamily.value = null
  sharePath.value = ''
  emit('share-change', null)
}

function choose(group, value) {
  if (group === 'type') type.value = value
  if (group === 'time') { timeOrder.value = value; surnameOrder.value = 'default' }
  if (group === 'surname') { surnameOrder.value = value; timeOrder.value = 'default' }
  menu.value = ''
}

function dateLabel(family) {
  const stamp = family.updatedAt || family.createdAt
  if (!stamp) return '暂无修订记录'
  const time = new Date(stamp)
  const pad = (value) => String(value).padStart(2, '0')
  return `修订于 ${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`
}
</script>

<template>
  <AppShell active-tab="home" title="我的掌上族谱">
    <view class="archive-directory">
      <view class="archive-search-row">
        <view class="archive-search"><AppIcon type="search" :size="20" /><input :value="query" placeholder="查找我的族谱" confirm-type="search" @input="query = $event.detail.value" /><button v-if="query" type="button" aria-label="清空搜索" @click="query = ''"><AppIcon type="closeempty" :size="17" /></button></view>
        <button class="archive-icon-command" type="button" aria-label="创建族谱" @click="uni.navigateTo({ url: '/pages/families/create' })"><AppIcon type="folder-add" :size="25" /></button>
      </view>
      <view class="archive-filter-row">
        <button type="button" :class="{ chosen: type !== 'all' || menu === 'type' }" @click="menu = menu === 'type' ? '' : 'type'">按类型 <AppIcon type="down" :size="18" /></button>
        <button type="button" :class="{ chosen: timeOrder !== 'default' || menu === 'time' }" @click="menu = menu === 'time' ? '' : 'time'">按时间 <AppIcon type="down" :size="18" /></button>
        <button type="button" :class="{ chosen: surnameOrder !== 'default' || menu === 'surname' }" @click="menu = menu === 'surname' ? '' : 'surname'">按姓氏 <AppIcon type="down" :size="18" /></button>
      </view>
      <view v-if="menu" class="archive-filter-scrim" @click="menu = ''"></view>
      <view v-if="menu" class="archive-filter-menu">
        <template v-if="menu === 'type'">
          <button type="button" @click="choose('type', 'all')">全部 <AppIcon v-if="type === 'all'" type="checkmarkempty" /></button>
          <button type="button" @click="choose('type', 'local')">本地族谱 <AppIcon v-if="type === 'local'" type="checkmarkempty" /></button>
          <button type="button" @click="choose('type', 'cloud')">云端族谱 <AppIcon v-if="type === 'cloud'" type="checkmarkempty" /></button>
        </template>
        <template v-else-if="menu === 'time'">
          <button v-for="option in [['default', '默认'], ['desc', '最近修订'], ['asc', '最早修订']]" :key="option[0]" type="button" @click="choose('time', option[0])">{{ option[1] }} <AppIcon v-if="timeOrder === option[0]" type="checkmarkempty" /></button>
        </template>
        <template v-else>
          <button v-for="option in [['default', '默认'], ['asc', '姓氏升序'], ['desc', '姓氏降序']]" :key="option[0]" type="button" @click="choose('surname', option[0])">{{ option[1] }} <AppIcon v-if="surnameOrder === option[0]" type="checkmarkempty" /></button>
        </template>
      </view>

      <view class="archive-results">
        <view v-if="visibleFamilies.length" class="archive-family-list">
          <view v-for="family in visibleFamilies" :key="family.id" class="archive-family-card">
            <button class="archive-family-open" type="button" @click="openFamily(family)">
              <FamilyBook :name="family.name" />
              <view class="archive-family-copy">
                <view class="archive-family-title">{{ family.name }} <view v-if="family.isExample" class="archive-example-tag">示例</view></view>
                <view class="archive-family-fact">家族成员：{{ family.members.length }} 人</view>
                <view class="archive-family-fact">根地区：{{ family.region || '未填写' }}</view>
                <view class="archive-family-time">{{ dateLabel(family) }}</view>
              </view>
              <AppIcon type="right" :size="19" />
            </button>
            <view v-if="!family.isExample" class="archive-card-actions"><button type="button" @click="toggleFavorite(family)"><AppIcon :type="favorites.some((item) => item.id === family.id) ? 'star-filled' : 'star'" :size="16" />{{ favorites.some((item) => item.id === family.id) ? '已收藏' : '收藏' }}</button><button v-if="family.canShare !== false" type="button" @click="openShare(family)"><AppIcon type="forward" :size="16" />分享</button><button v-if="family.canDelete !== false" class="archive-card-delete" type="button" @click="confirmDelete(family)"><AppIcon type="trash" :size="16" />删除</button></view>
          </view>
        </view>
        <view v-else class="archive-directory-empty"><AppIcon :type="query || type !== 'all' ? 'search' : 'folder-add'" :size="48" /><view>{{ query || type !== 'all' ? '没有找到符合条件的族谱' : '还没有族谱，创建一份吧' }}</view><button v-if="!query && type === 'all'" type="button" @click="uni.navigateTo({ url: '/pages/families/create' })"><AppIcon type="plus" :size="18" /> 创建族谱</button><button v-else type="button" @click="query = ''; type = 'all'">清除筛选</button></view>
      </view>
    </view>
  </AppShell>
  <ShareModal v-if="shareFamily" :family="shareFamily" :loading="shareLoading" :share-path="sharePath" @prepare="prepareShare" @close="closeShare" />
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import AppShell from '../../components/layout/AppShell.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import MemberRelationPanel from '../../components/member/MemberRelationPanel.vue'
import FgTree from '../../uni_modules/fg-tree/components/fg-tree/fg-tree.vue'
import { useGenealogyStore } from '../../services/genealogyStore'
import { toFgTree } from '../../services/fgTreeAdapter'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'

onShow(showPageShareMenu)
onShareAppMessage(pageSharePayload)
onShareTimeline(pageTimelinePayload)

const { activeFamily, members, selectedMemberId, selectFamily, removeMember } = useGenealogyStore()
const tree = ref(null)
const search = ref('')
const showRelations = ref(false)
const showSettings = ref(false)
const showNote = ref(true)
const showGeneration = ref(true)
const initialized = ref(false)
const treeData = computed(() => toFgTree(members.value))
const selectedMember = computed(() => members.value.find((item) => item.id === selectedMemberId.value) || null)
const editable = computed(() => !!activeFamily.value && !activeFamily.value.isExample && activeFamily.value.canEdit !== false)
const maleCount = computed(() => members.value.filter((item) => item.gender === '男').length)
const femaleCount = computed(() => members.value.filter((item) => item.gender === '女').length)

onLoad((options) => {
  selectFamily(options.id ? decodeURIComponent(options.id) : '')
  if (!selectedMemberId.value) selectedMemberId.value = members.value[0]?.id || ''
  if (options.action === 'add' && members.value.length) showRelations.value = true
  initialized.value = true
})

onShow(() => {
  if (!initialized.value) return
  nextTick(() => tree.value?.refreshView())
})

function selectMember(item) {
  selectedMemberId.value = item.id
  showSettings.value = false
  showRelations.value = true
}

function findMember() {
  const keyword = search.value.trim()
  if (!keyword) return tree.value?.refreshView()
  const found = members.value.find((item) => item.name.includes(keyword) || item.alias?.includes(keyword) || item.note?.includes(keyword))
  if (!found) return uni.showToast({ title: '没有找到这个成员', icon: 'none' })
  selectedMemberId.value = found.id
  tree.value?.focusSelected()
  showRelations.value = true
}

function openForm(relationKey) {
  if (!editable.value || !selectedMember.value) return
  showRelations.value = false
  uni.navigateTo({
    url: `/pages/members/form?familyId=${encodeURIComponent(activeFamily.value.id)}&targetId=${encodeURIComponent(selectedMember.value.id)}&relation=${relationKey}`,
  })
}

function addFirst() {
  if (!editable.value) return
  uni.navigateTo({ url: `/pages/members/form?familyId=${encodeURIComponent(activeFamily.value.id)}&relation=root` })
}

function openDetail() {
  if (!selectedMember.value) return
  showRelations.value = false
  uni.navigateTo({ url: `/pages/members/detail?familyId=${encodeURIComponent(activeFamily.value.id)}&id=${encodeURIComponent(selectedMember.value.id)}` })
}

function editSelected() {
  if (!selectedMember.value || !editable.value) return
  showRelations.value = false
  uni.navigateTo({ url: `/pages/members/form?familyId=${encodeURIComponent(activeFamily.value.id)}&id=${encodeURIComponent(selectedMember.value.id)}` })
}

function deleteSelected() {
  const item = selectedMember.value
  if (!item || !editable.value) return
  showRelations.value = false
  uni.showModal({
    title: `删除${item.name}`,
    content: item.relationType === 'spouse' || item.role === '配偶'
      ? '将删除这位成员，子女会保留在原分支。此操作不能恢复。'
      : '将同时删除这位成员及其后代分支，此操作不能恢复。',
    confirmColor: '#c86449',
    success: ({ confirm }) => {
      if (!confirm) return
      const count = removeMember(item.id)
      if (count) uni.showToast({ title: count > 1 ? `已删除 ${count} 位成员` : '成员已删除', icon: 'none' })
    },
  })
}
</script>

<template>
  <page-meta page-style="overflow: hidden;" />
  <AppShell active-tab="home" :title="activeFamily?.name || '家族树谱'" :scrollable="false" show-back>
    <view class="family-tree-screen">
      <view class="tree-search"><AppIcon type="search" :size="18" /><input :value="search" confirm-type="search" placeholder="查找家族成员" @input="search = $event.detail.value" @confirm="findMember" /></view>
      <view v-if="members.length" class="tree-statistics"><text>总人数：{{ members.length }}人</text><text>男性：{{ maleCount }}人</text><text>女性：{{ femaleCount }}人</text></view>
      <MemberRelationPanel v-if="showRelations && selectedMember" :member="selectedMember" :editable="editable" @close="showRelations = false" @add="openForm" @detail="openDetail" @edit="editSelected" @remove="deleteSelected" />
      <view v-if="members.length" class="tree-stage">
        <FgTree ref="tree" :list="treeData" :selected-id="selectedMemberId" :show-note="showNote" :show-generation="showGeneration" @check="selectMember" />
        <view class="tree-floating-tools">
          <button type="button" aria-label="定位当前成员" @tap="tree?.focusSelected()"><AppIcon type="location" :size="22" /></button>
          <button type="button" aria-label="复位树谱" @tap="tree?.refreshView()"><AppIcon type="refresh" :size="22" /></button>
          <button type="button" aria-label="显示设置" :class="{ active: showSettings }" @tap="showSettings = !showSettings"><AppIcon type="gear" :size="22" /></button>
        </view>
        <view v-if="showSettings" class="tree-settings">
          <view><text>显示备注</text><switch :checked="showNote" color="#a88d58" @change="showNote = $event.detail.value" /></view>
          <view><text>显示世代</text><switch :checked="showGeneration" color="#a88d58" @change="showGeneration = $event.detail.value" /></view>
        </view>
      </view>
      <view v-else class="tree-empty-state"><AppIcon type="staff" :size="44" /><text>这份族谱还没有成员</text><button v-if="editable" type="button" @tap="addFirst"><AppIcon type="plusempty" :size="18" /> 添加第一位成员</button></view>
    </view>
  </AppShell>
</template>

<style scoped>
.family-tree-screen { position: relative; width: 100%; max-width: 100%; height: 100%; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; color: #29332e; background: #f8fbf6; }
.tree-search { flex: 0 0 48px; height: 48px; margin: 12px 14px 8px; padding: 0 15px; border-radius: 24px; display: flex; align-items: center; gap: 10px; color: #98a39d; background: #edf1fb; }
.tree-search input { min-width: 0; height: 100%; flex: 1; color: #39433e; font-size: 13px; }
.tree-statistics { flex: 0 0 42px; box-sizing: border-box; width: calc(100% - 28px); max-width: 340px; height: 42px; margin: 2px auto 8px; padding: 0 18px; border-radius: 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #333b37; background: rgba(255,255,255,.96); box-shadow: 0 5px 13px rgba(45, 57, 50, .1); font-size: 12px; font-weight: 700; white-space: nowrap; }
.tree-stage { position: relative; width: 100%; min-width: 0; min-height: 0; flex: 1; overflow: hidden; border-top: 1px solid #e5ebe5; }
.tree-floating-tools { position: absolute; z-index: 10; top: 18px; right: 14px; display: flex; flex-direction: column; gap: 10px; }
.tree-floating-tools button { width: 43px; height: 43px; padding: 0; border: 1px solid #e1e7e1; border-radius: 50%; color: #4f5c55; background: rgba(255,255,255,.96); box-shadow: 0 3px 10px rgba(42, 52, 46, .07); }
.tree-floating-tools button.active { color: #8d7448; border-color: #c6b58f; }
.tree-settings { position: absolute; z-index: 11; top: 120px; right: 64px; width: 164px; padding: 10px 15px; border-radius: 7px; background: #fff; box-shadow: 0 6px 18px rgba(39, 48, 43, .14); }
.tree-settings view { min-height: 46px; display: flex; align-items: center; justify-content: space-between; color: #39423d; font-size: 13px; font-weight: 700; }
.tree-settings switch { transform: scale(.72); transform-origin: right center; }
.tree-empty-state { min-height: 0; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #8c9790; }
.tree-empty-state button { height: 41px; padding: 0 17px; border: 1px solid #b8a477; border-radius: 7px; gap: 6px; color: #816b43; background: #fff; font-size: 13px; }
</style>

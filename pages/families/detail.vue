<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import AppShell from '../../components/layout/AppShell.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import FamilyBook from '../../components/family/FamilyBook.vue'
import ShareModal from '../../components/modals/ShareModal.vue'
import { useGenealogyStore } from '../../services/genealogyStore'
import { cloudErrorMessage, createShareCloud, flushFamilySave, hasCloudSession, useCloudAccount } from '../../services/cloudService.js'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'

const { activeFamily, members, favorites, selectFamily, toggleFavorite, removeFamily } = useGenealogyStore()
const { profile } = useCloudAccount()
const requestedId = ref('')
const sharePath = ref('')
const shareTitle = ref('我的掌上族谱')
const shareLoading = ref(false)
const showShare = ref(false)
const search = ref('')
const family = computed(() => activeFamily.value?.id === requestedId.value ? activeFamily.value : null)
const creatorName = computed(() => {
  if (!family.value) return '微信用户'
  if (family.value.isExample) return '示例用户'
  if (family.value.permission === 'owner') return profile.value?.nickName || family.value.ownerName || '微信用户'
  return family.value.ownerName || '微信用户'
})
const matchedMembers = computed(() => members.value.filter((member) => member.name.includes(search.value.trim())))
const favorited = computed(() => favorites.value.some((item) => item.id === requestedId.value))

onLoad((options) => {
  requestedId.value = options.id ? decodeURIComponent(options.id) : ''
  selectFamily(requestedId.value)
})
onShow(showPageShareMenu)
onShareAppMessage(() => pageSharePayload({ title: shareTitle.value, path: sharePath.value }))
onShareTimeline(pageTimelinePayload)

function openMember(member) {
  uni.navigateTo({ url: `/pages/members/detail?familyId=${encodeURIComponent(requestedId.value)}&id=${encodeURIComponent(member.id)}` })
}

function addMember() {
  if (!family.value || family.value.isExample || family.value.canEdit === false) return
  const url = members.value.length
    ? `/pages/families/tree?id=${encodeURIComponent(family.value.id)}&action=add`
    : `/pages/members/form?familyId=${encodeURIComponent(family.value.id)}&relation=root`
  uni.navigateTo({ url })
}

function confirmDelete() {
  if (!family.value || family.value.isExample || family.value.canDelete === false) return
  uni.showModal({
    title: `删除${family.value.name}`,
    content: '该族谱的所有成员、留言和本机收藏将一起删除，且无法恢复。',
    confirmColor: '#b35f48',
    success: ({ confirm }) => { if (confirm && removeFamily(requestedId.value)) uni.navigateBack() },
  })
}

function openShare() {
  if (!hasCloudSession()) return uni.showToast({ title: '请先微信登录', icon: 'none' })
  if (family.value?.canShare === false) return uni.showToast({ title: '只有族谱创建者可以分享', icon: 'none' })
  sharePath.value = ''
  showShare.value = true
}

async function prepareShare(role) {
  if (!family.value || shareLoading.value) return
  shareLoading.value = true
  try {
    await flushFamilySave(family.value)
    const result = await createShareCloud(family.value.id, role)
    shareTitle.value = `${result.familyName}邀请你${role === 'editor' ? '共同编辑' : '查看'}族谱`
    sharePath.value = `/pages/index/index?shareToken=${encodeURIComponent(result.token)}`
  } catch (error) {
    uni.showToast({ title: cloudErrorMessage(error, '分享入口生成失败'), icon: 'none' })
  } finally {
    shareLoading.value = false
  }
}
</script>

<template>
  <AppShell active-tab="home" :title="family?.name || '族谱详情'" show-back>
    <view v-if="family" class="archive-detail">
      <view class="archive-detail-overview">
        <view class="archive-detail-top"><view><view class="archive-detail-title">{{ family.name }} <view v-if="family.isExample" class="archive-example-tag">示例族谱</view></view><view class="archive-detail-fact">创建人：{{ creatorName }}</view><view class="archive-detail-fact">根地区：{{ family.region || '未填写' }}</view></view><FamilyBook name="查看树谱" /></view>
        <view class="archive-detail-summary"><view>家族成员 <view class="archive-detail-count">{{ members.length }} 人</view></view><view class="archive-detail-buttons"><button type="button" @click="uni.navigateTo({ url: `/pages/families/tree?id=${encodeURIComponent(family.id)}` })"><AppIcon type="staff" :size="18" /> 查看树谱</button><button v-if="!family.isExample && family.canShare !== false" type="button" @click="openShare"><AppIcon type="forward" :size="18" /> 分享族谱</button></view></view>
        <view v-if="!family.isExample" class="archive-detail-actions"><button type="button" @click="toggleFavorite(family)"><AppIcon :type="favorited ? 'star-filled' : 'star'" :size="18" /> {{ favorited ? '已收藏' : '收藏' }}</button><button v-if="family.canEdit !== false" type="button" @click="uni.navigateTo({ url: `/pages/families/create?id=${encodeURIComponent(family.id)}` })"><AppIcon type="compose" :size="18" /> 编辑族谱</button><button v-if="family.canEdit !== false" type="button" @click="addMember"><AppIcon type="plus" :size="18" /> 新增成员</button></view>
      </view>
      <view v-if="family.description" class="archive-detail-block"><view class="archive-detail-block-title">家族介绍</view><view>{{ family.description }}</view></view>
      <view v-if="family.motto || family.rules" class="archive-detail-block"><view v-if="family.motto"><view class="archive-detail-block-title">家训</view><view>{{ family.motto }}</view></view><view v-if="family.rules"><view class="archive-detail-block-title">家规</view><view>{{ family.rules }}</view></view></view>
      <view class="archive-member-section"><view class="archive-member-heading"><view>家族成员 <view class="archive-member-count">{{ members.length }} 人</view></view><button v-if="!family.isExample && family.canEdit !== false" type="button" @click="addMember"><AppIcon type="plus" :size="18" /> 添加</button></view>
        <view v-if="members.length" class="archive-search archive-member-search"><AppIcon type="search" :size="18" /><input :value="search" placeholder="查找家族成员" @input="search = $event.detail.value" /></view>
        <view v-if="!members.length" class="archive-members-empty">还没有成员，添加第一位家人吧。</view>
        <view v-else-if="!matchedMembers.length" class="archive-members-empty">没有找到这个成员</view>
        <button v-for="member in matchedMembers" :key="member.id" class="archive-member-row" type="button" @click="openMember(member)"><view class="archive-member-avatar" :style="{ background: member.color || '#d5e3d6' }"><image v-if="member.avatarUrl" :src="member.avatarUrl" mode="aspectFill" /><text v-else>{{ member.avatar || member.name.slice(0, 1) }}</text></view><view class="archive-member-info"><view>{{ member.name }}</view><view>{{ member.generation }} · {{ member.role }}</view></view><AppIcon type="right" :size="19" /></button>
      </view>
      <button v-if="!family.isExample && family.canDelete !== false" class="archive-detail-delete" type="button" @click="confirmDelete"><AppIcon type="trash" :size="17" /> 删除族谱</button>
    </view>
    <view v-else class="archive-missing">没有找到这份族谱，或当前账号没有访问权限。<button type="button" @click="uni.switchTab({ url: '/pages/index/index' })">返回族谱列表</button></view>
  </AppShell>
  <ShareModal v-if="showShare && family" :family="family" :loading="shareLoading" :share-path="sharePath" @prepare="prepareShare" @close="showShare = false; sharePath = ''" />
</template>

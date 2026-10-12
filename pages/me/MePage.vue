<script setup>
import { ref, watch } from 'vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import AppShell from '../../components/layout/AppShell.vue'
import FavoritesPanel from '../../components/family/FavoritesPanel.vue'
import FeedbackPanel from '../../components/feedback/FeedbackPanel.vue'
import FeedbackAdminModal from '../../components/feedback/FeedbackAdminModal.vue'
import { useGenealogyStore } from '../../services/genealogyStore'
import {
  cloudErrorMessage,
  compressAvatarToBase64,
  listFeedbacksCloud,
  saveProfileCloud,
  updateFeedbackCloud,
  useCloudAccount,
} from '../../services/cloudService.js'
import { loginAndLoadAccount, logoutAccount } from '../../services/cloudSession.js'

const { families, favorites, feedbacks, addFeedback, toggleFavorite, selectFamily } = useGenealogyStore()
const { loggedIn, profile, sessionLoading } = useCloudAccount()
const section = ref('me')
const showAdmin = ref(false)
const adminFeedbacks = ref([])
const editingProfile = ref(false)
const savingProfile = ref(false)
const nickname = ref(profile.value?.nickName || '')
const avatar = ref(profile.value?.avatarUrl || '')
let versionClicks = 0
let versionTimer

watch(profile, (value) => {
  nickname.value = value?.nickName || ''
  avatar.value = value?.avatarUrl || ''
}, { deep: true })

async function tapVersion() {
  versionClicks += 1
  clearTimeout(versionTimer)
  versionTimer = setTimeout(() => { versionClicks = 0 }, 3000)
  if (versionClicks !== 3) return
  versionClicks = 0
  if (!loggedIn.value) return uni.showToast({ title: '请先登录管理员账号', icon: 'none' })
  try {
    const result = await listFeedbacksCloud()
    adminFeedbacks.value = result.feedbacks || []
    showAdmin.value = true
  } catch (error) {
    uni.showToast({ title: cloudErrorMessage(error, '当前账号不是管理员'), icon: 'none' })
  }
}

async function login() {
  try {
    const result = await loginAndLoadAccount()
    uni.showToast({ title: '登录成功', icon: 'success' })
    if (result.acceptedFamilyId) {
      uni.navigateTo({ url: `/pages/families/detail?id=${encodeURIComponent(result.acceptedFamilyId)}` })
      return
    }
    if (!profile.value?.nickName) editingProfile.value = true
  } catch (error) {
    uni.showModal({ title: '登录失败', content: cloudErrorMessage(error, '请检查云服务和微信登录配置'), showCancel: false })
  }
}

function openProfile() {
  if (!loggedIn.value) return login()
  editingProfile.value = true
}

function closeProfile() {
  uni.hideKeyboard?.()
  editingProfile.value = false
}

async function chooseAvatar(event) {
  const sourcePath = event.detail?.avatarUrl
  if (!sourcePath) return
  try {
    avatar.value = await compressAvatarToBase64(sourcePath)
  } catch (error) {
    uni.showToast({ title: cloudErrorMessage(error, '头像压缩失败，请重试'), icon: 'none' })
  }
}

function chooseAvatarOnWeb() {
  // #ifndef MP-WEIXIN
  uni.chooseImage({ count: 1, sizeType: ['compressed'], success: async ({ tempFilePaths }) => {
    if (tempFilePaths[0]) avatar.value = await compressAvatarToBase64(tempFilePaths[0])
  } })
  // #endif
}

async function saveProfile() {
  if (!loggedIn.value || savingProfile.value) return
  savingProfile.value = true
  try {
    await saveProfileCloud({ nickName: nickname.value.trim() || '微信用户', avatarUrl: avatar.value })
    closeProfile()
    uni.showToast({ title: '资料已保存', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: cloudErrorMessage(error, '资料保存失败'), icon: 'none' })
  } finally {
    savingProfile.value = false
  }
}

function logout() {
  uni.showModal({
    title: '退出登录',
    content: '退出后会清除本机登录态，云端族谱不会被删除。',
    confirmText: '退出',
    success: async ({ confirm }) => {
      if (!confirm) return
      await logoutAccount()
      nickname.value = ''
      avatar.value = ''
      section.value = 'me'
      uni.showToast({ title: '已退出登录', icon: 'none' })
    },
  })
}

function submitFeedback(payload) {
  if (!loggedIn.value) return uni.showToast({ title: '请先微信登录再提交反馈', icon: 'none' })
  addFeedback(payload)
}

async function setAdminFeedbackStatus(feedback, status) {
  try {
    await updateFeedbackCloud(feedback.id, status)
    feedback.status = status
  } catch (error) {
    uni.showToast({ title: cloudErrorMessage(error, '更新失败'), icon: 'none' })
  }
}

function openFavorite(family) {
  if (selectFamily(family.id)) uni.navigateTo({ url: `/pages/families/detail?id=${encodeURIComponent(family.id)}` })
  else uni.showToast({ title: '暂无这份族谱的访问权限', icon: 'none' })
}
</script>

<template>
  <AppShell
    active-tab="me"
    :title="section === 'me' ? '我的' : section === 'favorites' ? '收藏族谱' : '意见反馈'"
    :show-back="section !== 'me'"
    :internal-back="section !== 'me'"
    @back="section = 'me'"
  >
    <FavoritesPanel v-if="section === 'favorites'" :favorites="favorites" @remove="toggleFavorite" @open="openFavorite" @share="uni.switchTab({ url: '/pages/index/index' })" />
    <FeedbackPanel v-else-if="section === 'feedback'" :feedbacks="feedbacks" @submit="submitFeedback" />
    <view v-else class="archive-me-page">
      <view class="archive-profile">
        <button class="archive-profile-avatar" type="button" @click="openProfile"><image v-if="profile?.avatarUrl" :src="profile.avatarUrl" mode="aspectFill" /><AppIcon v-else type="person" :size="34" /></button>
        <view><view class="archive-profile-name">{{ loggedIn ? (profile?.nickName || '微信用户') : '尚未登录' }}</view><view class="archive-profile-note">{{ loggedIn ? '族谱已按微信账号保存到云端' : '登录后同步族谱并接收分享' }}</view></view>
        <button class="archive-profile-login" type="button" :disabled="sessionLoading" @click="openProfile">{{ loggedIn ? '设置资料' : (sessionLoading ? '登录中' : '微信登录') }}</button>
      </view>
      <view class="archive-me-menu">
        <button type="button" @click="uni.switchTab({ url: '/pages/index/index' })"><AppIcon type="home" :size="21" /><view>我的族谱</view><view class="archive-me-count">{{ families.length }} 份</view><AppIcon type="right" :size="18" /></button>
        <button type="button" @click="section = 'favorites'"><AppIcon type="star" :size="21" /><view>收藏族谱</view><view class="archive-me-count">{{ favorites.length }} 份</view><AppIcon type="right" :size="18" /></button>
        <button type="button" @click="section = 'feedback'"><AppIcon type="chat" :size="21" /><view>意见反馈</view><view class="archive-me-count">{{ feedbacks.length }} 条</view><AppIcon type="right" :size="18" /></button>
      </view>
      <view class="archive-ad-slot"><view>广告位预留</view><view class="archive-ad-note">接入微信流量主后展示 Banner 广告</view></view>
      <button v-if="loggedIn" class="archive-logout" type="button" @click="logout">退出登录</button>
      <button class="archive-version-note" type="button" @click="tapVersion">v0.1.0</button>
    </view>
  </AppShell>
  <view v-if="editingProfile && loggedIn" class="ui-div modal-backdrop" @tap.stop><view class="ui-div modal-card archive-profile-editor"><view class="ui-div modal-heading"><view class="ui-h2">设置个人资料</view><button class="close-button" type="button" aria-label="关闭" @click="closeProfile"><AppIcon type="closeempty" :size="18" /></button></view><button class="archive-avatar-picker" open-type="chooseAvatar" type="button" @chooseavatar="chooseAvatar" @click="chooseAvatarOnWeb"><image v-if="avatar" :src="avatar" mode="aspectFill" /><AppIcon v-else type="camera" :size="26" /></button><input type="text" :value="nickname" maxlength="24" confirm-type="done" placeholder="填写昵称" @input="nickname = $event.detail.value" @confirm="saveProfile" /><button class="archive-profile-save" type="button" :disabled="savingProfile" @click="saveProfile">{{ savingProfile ? '保存中' : '保存资料' }}</button></view></view>
  <FeedbackAdminModal v-if="showAdmin" :feedbacks="adminFeedbacks" @close="showAdmin = false" @status="setAdminFeedbackStatus" />
</template>

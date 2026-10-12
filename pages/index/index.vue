<script setup>
import { ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import DirectoryPage from './DirectoryPage.vue'
import { cloudErrorMessage, hasCloudSession, withGlobalLoading } from '../../services/cloudService.js'
import {
  acceptOrRememberShare,
  getPendingShareToken,
  loginAndLoadAccount,
  rememberShareToken,
} from '../../services/cloudSession.js'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'
import { hasAcceptedLegalDocuments } from '../../services/privacyConsent.js'

const sharePayload = ref(null)
const shareEntryBusy = ref(false)
let promptedToken = ''

function openSharedFamily(familyId) {
  if (!familyId) return
  uni.navigateTo({ url: `/pages/families/detail?id=${encodeURIComponent(familyId)}` })
}

async function acceptPendingShare(token) {
  if (shareEntryBusy.value) return
  shareEntryBusy.value = true
  try {
    const result = await withGlobalLoading(() => acceptOrRememberShare(token), 320)
    openSharedFamily(result.family?.id)
  } catch (error) {
    promptedToken = ''
    uni.showModal({
      title: '无法打开分享族谱',
      content: cloudErrorMessage(error, '分享入口可能已失效，请让创建人重新分享'),
      showCancel: false,
    })
  } finally {
    shareEntryBusy.value = false
  }
}

function requestShareLogin(token) {
  if (!token || promptedToken === token || shareEntryBusy.value) return
  promptedToken = token
  if (!hasAcceptedLegalDocuments()) {
    uni.showModal({
      title: '登录并查看分享族谱',
      content: '请先阅读并同意《用户服务协议》和《隐私政策》，再使用微信登录接收分享。',
      confirmText: '前往登录',
      success: ({ confirm }) => {
        if (confirm) uni.switchTab({ url: '/pages/me/index' })
        else promptedToken = ''
      },
    })
    return
  }
  uni.showModal({
    title: '查看分享族谱',
    content: '微信登录后即可查看这份族谱，获得编辑权限时也会自动加入同一份族谱。',
    confirmText: '微信登录',
    success: async ({ confirm }) => {
      if (!confirm) return
      shareEntryBusy.value = true
      try {
        const result = await loginAndLoadAccount()
        openSharedFamily(result.acceptedFamilyId)
      } catch (error) {
        promptedToken = ''
        uni.showModal({
          title: '登录失败',
          content: cloudErrorMessage(error, '请检查网络后重试'),
          showCancel: false,
        })
      } finally {
        shareEntryBusy.value = false
      }
    },
  })
}

function processShareEntry(token = '') {
  if (token) rememberShareToken(token)
  const pendingToken = token || getPendingShareToken()
  if (!pendingToken || shareEntryBusy.value) return
  if (hasCloudSession()) acceptPendingShare(pendingToken)
  else requestShareLogin(pendingToken)
}

onLoad((options = {}) => {
  processShareEntry(options.shareToken ? decodeURIComponent(options.shareToken) : '')
})
onShow(() => {
  showPageShareMenu()
  // App.onShow stores a token before the page hook runs when a share opens an
  // already-running mini program.
  setTimeout(() => processShareEntry(), 0)
})
onShareAppMessage(() => pageSharePayload(sharePayload.value))
onShareTimeline(pageTimelinePayload)
</script>

<template>
  <DirectoryPage @share-change="sharePayload = $event" />
</template>

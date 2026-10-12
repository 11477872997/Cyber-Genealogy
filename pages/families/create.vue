<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import AppShell from '../../components/layout/AppShell.vue'
import LegalConsent from '../../components/legal/LegalConsent.vue'
import { useGenealogyStore } from '../../services/genealogyStore'
import { cloudErrorMessage, flushFamilySave, hasCloudSession } from '../../services/cloudService.js'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'
import { acceptLegalDocuments, hasAcceptedLegalDocuments } from '../../services/privacyConsent.js'

onShow(showPageShareMenu)
onShareAppMessage(pageSharePayload)
onShareTimeline(pageTimelinePayload)

const { families, createFamily, updateFamily } = useGenealogyStore()
const editingId = ref('')
const blocked = ref(false)
const error = ref('')
const saving = ref(false)
const pendingCreatedFamily = ref(null)
const legalAgreed = ref(hasAcceptedLegalDocuments())
const form = reactive({ name: '', surname: '', region: '', description: '', motto: '', rules: '' })
const editing = computed(() => !!editingId.value)

onLoad((options) => {
  const id = options.id ? decodeURIComponent(options.id) : ''
  const family = families.value.find((item) => item.id === id)
  if (id && (!family || family.isExample || family.canEdit === false)) {
    blocked.value = true
    uni.showToast({ title: '该族谱不可编辑', icon: 'none' })
    uni.navigateBack()
    return
  }
  if (family) {
    editingId.value = id
    Object.keys(form).forEach((key) => { form[key] = family[key] || '' })
  }
})

async function save() {
  if (blocked.value || saving.value) return
  if (!legalAgreed.value) {
    error.value = '请先阅读并同意用户服务协议和隐私政策'
    return
  }
  acceptLegalDocuments()
  if (!form.name.trim() || !form.surname.trim() || !form.region.trim()) {
    error.value = '请填写族谱名称、姓氏和根地区'
    return
  }
  const wasEditing = editing.value
  const id = editingId.value
  let family
  if (wasEditing) {
    family = updateFamily(id, form) && families.value.find((item) => item.id === id)
  } else if (pendingCreatedFamily.value) {
    updateFamily(pendingCreatedFamily.value.id, form)
    family = families.value.find((item) => item.id === pendingCreatedFamily.value.id)
  } else {
    family = createFamily(form)
    pendingCreatedFamily.value = family
  }
  if (!family) { error.value = '已有同名族谱，请更换名称'; return }
  if (hasCloudSession()) {
    saving.value = true
    try {
      await flushFamilySave(family)
    } catch (saveError) {
      error.value = `云端保存失败：${cloudErrorMessage(saveError, '请检查网络后重试')}`
      uni.showModal({ title: '族谱尚未同步', content: error.value, showCancel: false })
      return
    } finally {
      saving.value = false
    }
  }
  pendingCreatedFamily.value = null
  if (wasEditing) uni.navigateBack()
  else uni.redirectTo({ url: `/pages/families/detail?id=${encodeURIComponent(family.id)}` })
}

function setField(key, event) {
  form[key] = event.detail.value
  error.value = ''
}
</script>

<template>
  <AppShell active-tab="home" :title="editing ? '编辑族谱' : '创建族谱'" show-back>
    <view v-if="!blocked" class="archive-form-page">
      <view class="archive-form-section">
        <view class="archive-form-line"><view><view class="archive-required">族谱名称</view></view><input :value="form.name" maxlength="30" placeholder="例如：杨氏族谱" @input="setField('name', $event)" /></view>
        <view class="archive-form-line"><view class="archive-required">家族姓氏</view><input :value="form.surname" maxlength="12" placeholder="填写家族姓氏" @input="setField('surname', $event)" /></view>
        <view class="archive-form-line"><view class="archive-required">根地区</view><input :value="form.region" maxlength="50" placeholder="例如：北京市东城区" @input="setField('region', $event)" /></view>
        <view class="archive-form-textarea"><view>家族介绍 <view class="archive-optional">最多 500 字</view></view><textarea :value="form.description" maxlength="500" placeholder="记录家族起源、迁徙和重要故事" @input="setField('description', $event)"></textarea></view>
      </view>
      <view class="archive-form-section">
        <view class="archive-form-textarea"><view>家训 <view class="archive-optional">最多 300 字</view></view><textarea :value="form.motto" maxlength="300" placeholder="记录家族精神" @input="setField('motto', $event)"></textarea></view>
        <view class="archive-form-textarea"><view>家规 <view class="archive-optional">最多 300 字</view></view><textarea :value="form.rules" maxlength="300" placeholder="记录家族约定" @input="setField('rules', $event)"></textarea></view>
      </view>
      <view class="archive-form-consent"><LegalConsent v-model="legalAgreed" description="族谱和成员资料将按你的登录账号保存，并按分享权限提供给受邀者" /></view>
      <view v-if="error" class="archive-form-error">{{ error }}</view>
    </view>
    <template #bottom><view v-if="!blocked" class="archive-form-bottom"><button type="button" :disabled="saving" @click="save">{{ saving ? '保存中...' : '保存' }}</button></view></template>
  </AppShell>
</template>

<style scoped>
.archive-form-consent { margin: 0 12px 12px; padding: 11px 8px; border: 1px solid #dfe6de; border-radius: 7px; background: #fff; }
</style>

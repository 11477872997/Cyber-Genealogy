<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import AppShell from '../../components/layout/AppShell.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import { useGenealogyStore } from '../../services/genealogyStore'
import { compressAvatarToBase64 } from '../../services/cloudService.js'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'

onShow(showPageShareMenu)
onShareAppMessage(pageSharePayload)
onShareTimeline(pageTimelinePayload)

const { activeFamily, members, selectFamily, addMember, updateMember } = useGenealogyStore()
const memberId = ref('')
const targetId = ref('')
const relationKey = ref('root')
const blocked = ref(false)
const saving = ref(false)
const error = ref('')
const genders = ['男', '女']
const statusOptions = ['正常', '失联', '迁出', '其他']
const bloodTypes = ['未知', 'A型', 'B型', 'AB型', 'O型']
const educationOptions = ['未填写', '小学', '初中', '高中/中专', '大专', '本科', '硕士', '博士']
const relationNames = { root: '添加成员', father: '添加父亲', mother: '添加母亲', spouse: '添加配偶', brother: '添加兄弟', son: '添加儿子', daughter: '添加女儿' }
const form = reactive({
  surname: '', givenName: '', gender: '男', rank: '', birth: '', place: '', courtesyName: '', alias: '',
  memberStatus: '', note: '', isLife: true, linked: false, bio: '', ethnicity: '', bloodType: '', residence: '',
  school: '', education: '', company: '', position: '', avatarUrl: '',
})
const editing = computed(() => !!memberId.value)
const title = computed(() => editing.value ? '编辑成员' : relationNames[relationKey.value] || '添加成员')
const target = computed(() => members.value.find((item) => item.id === targetId.value) || null)

onLoad((options) => {
  const familyId = options.familyId ? decodeURIComponent(options.familyId) : ''
  if (!selectFamily(familyId) || !activeFamily.value || activeFamily.value.isExample || activeFamily.value.canEdit === false) {
    blocked.value = true
    uni.showToast({ title: '这份族谱不可编辑', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
    return
  }
  memberId.value = options.id ? decodeURIComponent(options.id) : ''
  targetId.value = options.targetId ? decodeURIComponent(options.targetId) : ''
  relationKey.value = options.relation || 'root'
  const member = members.value.find((item) => item.id === memberId.value)
  if (memberId.value && !member) {
    blocked.value = true
    uni.showToast({ title: '没有找到这位成员', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
    return
  }
  if (member) {
    Object.keys(form).forEach((key) => { form[key] = member[key] ?? form[key] })
    if (!member.surname && member.name) {
      const surname = activeFamily.value.surname || member.name.slice(0, 1)
      form.surname = surname
      form.givenName = member.name.startsWith(surname) ? member.name.slice(surname.length) : member.name
    }
  } else {
    const fixedGender = { father: '男', mother: '女', brother: '男', son: '男', daughter: '女' }[relationKey.value]
    form.gender = fixedGender || (relationKey.value === 'spouse' && target.value?.gender === '男' ? '女' : '男')
    if (!['mother', 'spouse'].includes(relationKey.value)) form.surname = activeFamily.value.surname || ''
  }
})

function setField(key, event) {
  form[key] = event.detail.value
  error.value = ''
}

function chooseFrom(key, options, event) {
  form[key] = options[Number(event.detail.value)]
  error.value = ''
}

async function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async ({ tempFilePaths }) => {
      if (!tempFilePaths?.[0]) return
      uni.showLoading({ title: '压缩头像' })
      try {
        form.avatarUrl = await compressAvatarToBase64(tempFilePaths[0])
      } catch (avatarError) {
        uni.showToast({ title: avatarError?.message || '头像处理失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
  })
}

function save() {
  if (blocked.value || saving.value) return
  if (!form.surname.trim() || !form.givenName.trim()) {
    error.value = '请填写姓氏和名字'
    return
  }
  saving.value = true
  const payload = { ...form, name: `${form.surname.trim()}${form.givenName.trim()}` }
  const success = editing.value
    ? updateMember(memberId.value, payload)
    : addMember({ ...payload, relationKey: relationKey.value, targetId: targetId.value })
  saving.value = false
  if (!success) {
    error.value = relationKey.value === 'spouse' ? '该成员已有配偶，不能重复添加' : '关系冲突或资料不完整，请检查后重试'
    return
  }
  uni.showToast({ title: editing.value ? '资料已更新' : '成员已添加', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 350)
}
</script>

<template>
  <AppShell active-tab="home" :title="title" show-back>
    <view v-if="!blocked" class="member-form-page">
      <view v-if="target && !editing" class="member-relation-tip">将作为“{{ title.replace('添加', '') }}”添加到 {{ target.name }} 的关系中</view>
      <view class="member-form-section member-form-identity">
        <button class="member-avatar-field" type="button" aria-label="选择成员头像" @tap="chooseAvatar">
          <image v-if="form.avatarUrl" :src="form.avatarUrl" mode="aspectFill" />
          <AppIcon v-else type="camera" :size="28" />
          <text>头像</text>
        </button>
        <view class="member-name-fields">
          <view class="member-form-row required"><text>姓氏</text><input :value="form.surname" maxlength="12" placeholder="填写姓氏" @input="setField('surname', $event)" /></view>
          <view class="member-form-row required"><text>名字</text><input :value="form.givenName" maxlength="20" placeholder="填写名字" @input="setField('givenName', $event)" /></view>
        </view>
      </view>

      <view class="member-form-section">
        <picker :range="genders" :value="Math.max(0, genders.indexOf(form.gender))" @change="chooseFrom('gender', genders, $event)"><view class="member-form-row required"><text>性别</text><view>{{ form.gender }} <AppIcon type="right" :size="17" /></view></view></picker>
        <view class="member-form-row"><text>排行</text><input :value="form.rank" maxlength="12" placeholder="同辈排行，如 1" @input="setField('rank', $event)" /></view>
        <picker mode="date" :value="form.birth" start="1800-01-01" @change="setField('birth', $event)"><view class="member-form-row"><text>生日</text><view :class="{ placeholder: !form.birth }">{{ form.birth || '选择出生日期' }} <AppIcon type="right" :size="17" /></view></view></picker>
        <view class="member-form-row"><text>出生地</text><input :value="form.place" maxlength="80" placeholder="填写出生地" @input="setField('place', $event)" /></view>
        <view class="member-form-row"><text>字辈</text><input :value="form.courtesyName" maxlength="30" placeholder="填写字辈" @input="setField('courtesyName', $event)" /></view>
        <view class="member-form-row"><text>别名/小名</text><input :value="form.alias" maxlength="30" placeholder="填写别名或小名" @input="setField('alias', $event)" /></view>
        <picker :range="statusOptions" :value="Math.max(0, statusOptions.indexOf(form.memberStatus))" @change="chooseFrom('memberStatus', statusOptions, $event)"><view class="member-form-row"><text>成员状态</text><view :class="{ placeholder: !form.memberStatus }">{{ form.memberStatus || '选择成员状态' }} <AppIcon type="right" :size="17" /></view></view></picker>
        <view class="member-form-row"><text>备注</text><input :value="form.note" maxlength="50" placeholder="例如：姑姑、大伯" @input="setField('note', $event)" /></view>
        <view class="member-form-row"><text>是否健在</text><switch :checked="form.isLife" color="#a88d58" @change="form.isLife = $event.detail.value" /></view>
        <view class="member-form-row"><text>关联此人</text><switch :checked="form.linked" color="#a88d58" @change="form.linked = $event.detail.value" /></view>
        <view class="member-form-help"><AppIcon type="help" :size="15" /> 当前账号与此成员进行关联</view>
      </view>

      <view class="member-form-section">
        <view class="member-form-label">介绍 <text>最多 300 字</text></view>
        <textarea :value="form.bio" maxlength="300" placeholder="填写介绍信息、生平事迹、荣誉奖项等" @input="setField('bio', $event)"></textarea>
      </view>

      <view class="member-form-section">
        <view class="member-form-title">补充信息</view>
        <view class="member-form-row"><text>民族</text><input :value="form.ethnicity" maxlength="20" placeholder="填写所属民族" @input="setField('ethnicity', $event)" /></view>
        <picker :range="bloodTypes" :value="Math.max(0, bloodTypes.indexOf(form.bloodType))" @change="chooseFrom('bloodType', bloodTypes, $event)"><view class="member-form-row"><text>血型</text><view :class="{ placeholder: !form.bloodType }">{{ form.bloodType || '选择血型' }} <AppIcon type="right" :size="17" /></view></view></picker>
        <view class="member-form-row"><text>现居地</text><input :value="form.residence" maxlength="80" placeholder="填写现居地" @input="setField('residence', $event)" /></view>
        <view class="member-form-row"><text>学校</text><input :value="form.school" maxlength="80" placeholder="填写学校信息" @input="setField('school', $event)" /></view>
        <picker :range="educationOptions" :value="Math.max(0, educationOptions.indexOf(form.education))" @change="chooseFrom('education', educationOptions, $event)"><view class="member-form-row"><text>学历</text><view :class="{ placeholder: !form.education }">{{ form.education || '选择学历信息' }} <AppIcon type="right" :size="17" /></view></view></picker>
        <view class="member-form-row"><text>单位</text><input :value="form.company" maxlength="80" placeholder="填写所属单位" @input="setField('company', $event)" /></view>
        <view class="member-form-row"><text>职位</text><input :value="form.position" maxlength="50" placeholder="填写职位信息" @input="setField('position', $event)" /></view>
      </view>
      <view v-if="error" class="member-form-error">{{ error }}</view>
    </view>
    <template #bottom><view v-if="!blocked" class="member-form-bottom"><button type="button" :disabled="saving" @tap="save">{{ saving ? '保存中' : '保存' }}</button></view></template>
  </AppShell>
</template>

<style scoped>
.member-form-page { min-height: 100%; padding: 12px 12px 20px; color: #303733; background: #f7faf5; }
.member-relation-tip { margin: 0 3px 10px; padding: 9px 12px; border-radius: 6px; color: #796640; background: #f3ede1; font-size: 11px; }
.member-form-section { margin-bottom: 12px; padding: 8px 18px 18px; border: 1px solid #e2e8e2; border-radius: 8px; background: #fff; box-shadow: 0 5px 13px rgba(42, 54, 47, .06); }
.member-form-identity { padding-top: 14px; display: flex; align-items: center; gap: 14px; }
.member-avatar-field { width: 76px; height: 91px; flex: 0 0 76px; padding: 0; border: 0; border-radius: 6px; flex-direction: column; gap: 5px; overflow: hidden; color: #9a8355; background: #edf5ed; font-size: 10px; }
.member-avatar-field image { width: 76px; height: 91px; }
.member-name-fields { min-width: 0; flex: 1; }
.member-form-row { min-height: 54px; border-bottom: 1px solid #edf0ed; display: flex; align-items: center; justify-content: space-between; gap: 14px; color: #333b37; font-size: 14px; font-weight: 700; }
.member-form-row.required > text::before { content: '*'; margin-right: 3px; color: #d55d4a; }
.member-form-row input { min-width: 0; height: 52px; flex: 1; color: #555e59; font-size: 13px; font-weight: 400; text-align: right; }
.member-form-row > view { display: flex; align-items: center; gap: 6px; color: #59625d; font-size: 13px; font-weight: 400; }
.member-form-row .placeholder { color: #b4bbb7; }
.member-form-row switch { transform: scale(.76); transform-origin: right center; }
.member-form-help { padding-top: 9px; display: flex; align-items: center; gap: 5px; color: #7d8681; font-size: 10px; }
.member-form-label, .member-form-title { padding: 10px 0 9px; color: #303733; font-size: 15px; font-weight: 800; }
.member-form-label text { margin-left: 5px; color: #a3aaa6; font-size: 9px; font-weight: 400; }
.member-form-section textarea { width: 100%; height: 112px; padding: 12px; border: 1px solid #dfe5df; border-radius: 6px; color: #46504b; font-size: 12px; line-height: 1.65; }
.member-form-error { padding: 0 5px 12px; color: #bc5c49; font-size: 12px; }
.member-form-bottom { padding: 9px 16px max(9px, env(safe-area-inset-bottom)); border-top: 1px solid #e1e6e1; background: #fff; }
.member-form-bottom button { width: 100%; height: 46px; border: 0; border-radius: 8px; color: #fff; background: #aa8e58; font-size: 16px; font-weight: 700; box-shadow: 0 5px 12px rgba(130, 105, 63, .2); }
.member-form-bottom button[disabled] { color: #fff; background: #b9a786; opacity: 1; }
</style>

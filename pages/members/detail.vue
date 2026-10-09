<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import AppShell from '../../components/layout/AppShell.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import { useGenealogyStore } from '../../services/genealogyStore'
import { isMemberAlive } from '../../services/memberStatus.js'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'

onShow(showPageShareMenu)
onShareAppMessage(pageSharePayload)
onShareTimeline(pageTimelinePayload)

const { activeFamily, members, selectedMemberId, selectedComments, selectFamily, removeMember, addComment } = useGenealogyStore()
const draft = ref('')
const member = computed(() => members.value.find((item) => item.id === selectedMemberId.value) || null)
const editable = computed(() => !!activeFamily.value && !activeFamily.value.isExample && activeFamily.value.canEdit !== false)
const basicFields = computed(() => member.value ? [
  ['性别', member.value.gender],
  ['在世状态', isMemberAlive(member.value) ? '在世' : '已故'],
  ['生日', member.value.birth],
  ['出生地', member.value.place],
  ['字辈', member.value.courtesyName],
  ['别名/小名', member.value.alias],
  ['成员状态', member.value.memberStatus],
  ['排行', member.value.rank],
  ['备注', member.value.note],
  ['世代', member.value.generation],
].filter((item) => item[1]) : [])
const extraFields = computed(() => member.value ? [
  ['民族', member.value.ethnicity],
  ['血型', member.value.bloodType],
  ['现居地', member.value.residence],
  ['学校', member.value.school],
  ['学历', member.value.education],
  ['单位', member.value.company],
  ['职位', member.value.position],
].filter((item) => item[1]) : [])

onLoad((options) => {
  selectFamily(options.familyId ? decodeURIComponent(options.familyId) : '')
  selectedMemberId.value = options.id ? decodeURIComponent(options.id) : members.value[0]?.id || ''
})

function submit() {
  if (editable.value && addComment(draft.value)) draft.value = ''
}

function edit() {
  if (!member.value || !editable.value) return
  uni.navigateTo({ url: `/pages/members/form?familyId=${encodeURIComponent(activeFamily.value.id)}&id=${encodeURIComponent(member.value.id)}` })
}

function remove() {
  if (!member.value || !editable.value) return
  uni.showModal({
    title: `删除${member.value.name}`,
    content: member.value.relationType === 'spouse' || member.value.role === '配偶' ? '仅删除这位成员，子女仍保留在原分支。' : '该成员及其后代分支将一起删除，且不能恢复。',
    confirmColor: '#b35f48',
    success: ({ confirm }) => { if (confirm) { removeMember(member.value.id); uni.navigateBack() } },
  })
}
</script>

<template>
  <AppShell active-tab="home" :title="member?.name || '成员资料'" show-back>
    <view v-if="member" class="member-profile-page">
      <view class="member-profile-hero">
        <view class="member-profile-avatar" :style="{ backgroundColor: member.color || '#d8e7df' }">
          <image v-if="member.avatarUrl" :src="member.avatarUrl" mode="aspectFill" />
          <text v-else>{{ member.avatar || member.name.slice(0, 1) }}</text>
        </view>
        <view class="member-profile-heading"><view>{{ member.name }} <text v-if="member.note">（{{ member.note }}）</text></view><text>{{ member.generation }} · {{ member.role }}</text></view>
      </view>
      <view v-if="member.bio" class="member-profile-bio"><text>介绍：</text>{{ member.bio }}</view>

      <view class="member-profile-section">
        <view class="member-profile-title">基本信息</view>
        <view v-for="item in basicFields" :key="item[0]" class="member-profile-row"><text>{{ item[0] }}</text><text>{{ item[1] }}</text></view>
        <view v-if="!basicFields.length" class="member-profile-empty">暂无基本信息</view>
      </view>
      <view v-if="extraFields.length" class="member-profile-section">
        <view class="member-profile-title">补充信息</view>
        <view v-for="item in extraFields" :key="item[0]" class="member-profile-row"><text>{{ item[0] }}</text><text>{{ item[1] }}</text></view>
      </view>

      <view class="member-profile-section">
        <view class="member-profile-title">成员留言</view>
        <view v-if="!selectedComments.length" class="member-profile-empty">暂无留言</view>
        <view v-for="comment in selectedComments" :key="comment.id" class="archive-comment"><view>{{ comment.content }}</view><view class="archive-comment-meta">{{ comment.user }} · {{ comment.time }}</view></view>
        <view v-if="editable" class="archive-comment-compose"><input :value="draft" maxlength="200" placeholder="写下关于这位家人的记忆" @input="draft = $event.detail.value" @confirm="submit" /><button type="button" @click="submit"><AppIcon type="compose" :size="18" /></button></view>
      </view>

      <view v-if="editable" class="member-profile-actions"><button type="button" @tap="edit"><AppIcon type="compose" :size="18" /> 编辑资料</button><button class="danger" type="button" @tap="remove"><AppIcon type="trash" :size="18" /> 删除成员</button></view>
    </view>
    <view v-else class="archive-missing">没有找到这位成员。<button type="button" @tap="uni.navigateBack()">返回族谱</button></view>
  </AppShell>
</template>

<style scoped>
.member-profile-page { min-height: 100%; padding: 0 18px 26px; color: #313934; background: #fff; }
.member-profile-hero { position: relative; min-height: 174px; margin: 0 -18px; padding: 92px 18px 24px; background: #eef5ed; }
.member-profile-avatar { position: absolute; right: 24px; top: 40px; width: 86px; height: 86px; border: 6px solid rgba(255,255,255,.9); border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #2c4038; font-size: 28px; font-weight: 800; box-shadow: 0 7px 17px rgba(48, 61, 53, .12); }
.member-profile-avatar image { width: 100%; height: 100%; }
.member-profile-heading { max-width: calc(100% - 112px); }
.member-profile-heading view { font-size: 22px; font-weight: 800; }
.member-profile-heading view text { font-size: 15px; }
.member-profile-heading > text { margin-top: 9px; display: block; color: #5f6963; font-size: 14px; }
.member-profile-bio { margin-top: 14px; padding: 16px; border-radius: 7px; color: #3e4a43; background: #eff6ed; font-size: 13px; line-height: 1.75; }
.member-profile-bio text { font-weight: 800; }
.member-profile-section { padding-top: 24px; }
.member-profile-title { padding-bottom: 9px; color: #2e3732; font-size: 17px; font-weight: 800; }
.member-profile-row { min-height: 52px; border-bottom: 1px solid #edf0ed; display: flex; align-items: center; justify-content: space-between; gap: 18px; color: #68716c; font-size: 13px; }
.member-profile-row text:last-child { color: #4e5752; text-align: right; font-weight: 600; }
.member-profile-empty { padding: 20px 0; color: #a1a8a4; font-size: 12px; }
.member-profile-actions { padding-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.member-profile-actions button { min-height: 43px; border: 1px solid #af976a; border-radius: 7px; gap: 6px; color: #806a42; background: #fff; }
.member-profile-actions .danger { color: #a55e4e; border-color: #e2c1b9; }
</style>

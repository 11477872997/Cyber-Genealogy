<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '../icons/AppIcon.vue'

const props = defineProps({
  member: { type: Object, required: true },
  members: { type: Array, default: () => [] },
  comments: { type: Array, default: () => [] },
})
const emit = defineEmits(['select', 'edit', 'comment'])
const draft = ref('')
const relatives = computed(() => props.members.filter((item) => item.id === props.member.parentId || item.parentId === props.member.id))

function submitComment() {
  if (!draft.value.trim()) return
  emit('comment', draft.value)
  draft.value = ''
}
watch(() => props.member.id, () => { draft.value = '' })
</script>

<template>
  <view class="ui-aside member-panel panel">
    <view class="ui-div member-panel-head"><view class="ui-span panel-kicker">成员信息</view></view>
    <view class="ui-div member-hero"><view class="ui-div member-avatar" :style="{ background: member.color }">{{ member.avatar }}</view><view class="ui-div"><view class="ui-h2">{{ member.name }}</view><view class="ui-span">{{ member.role }} · {{ member.generation }}</view></view></view>
    <view class="ui-div member-details"><view class="ui-div"><view class="ui-span">性别</view><view class="ui-strong">{{ member.gender }}</view></view><view class="ui-div"><view class="ui-span">出生</view><view class="ui-strong">{{ member.birth }}</view></view><view class="ui-div"><view class="ui-span">籍贯</view><view class="ui-strong">{{ member.place }}</view></view></view>
    <view v-if="member.bio" class="ui-p member-bio">{{ member.bio }}</view>
    <view v-if="relatives.length" class="ui-div relatives-section"><view class="ui-div section-title">关联成员</view><view class="ui-div relative-list"><button v-for="relative in relatives" :key="relative.id" type="button" @click="emit('select', relative.id)"><view class="ui-span mini-avatar blue">{{ relative.avatar }}</view><view class="ui-span"><view class="ui-strong">{{ relative.name }}</view><view class="ui-small">{{ relative.id === member.parentId ? '上级成员' : '下级成员' }}</view></view><AppIcon type="right" :size="15" /></button></view></view>
    <view class="ui-div member-comment"><view class="ui-div section-title"><view class="ui-span">成员留言 <view class="ui-small">{{ comments.length }} 条</view></view><AppIcon type="chat" :size="15" /></view><view v-for="comment in comments" :key="comment.id" class="ui-div comment-preview"><view class="ui-p">{{ comment.content }}</view><view class="ui-span">{{ comment.user }} · {{ comment.time }}</view></view><view v-if="!comments.length" class="ui-p empty-comment">暂无留言</view><view class="ui-div comment-composer"><input :value="draft" maxlength="200" placeholder="写下留言" @input="draft = $event.detail.value" @confirm="submitComment" /><button type="button" aria-label="提交留言" @click="submitComment"><AppIcon type="compose" :size="14" /></button></view></view>
    <button class="edit-member-button" type="button" @click="emit('edit')"><AppIcon type="compose" :size="16" /> 编辑成员</button>
  </view>
</template>

<script setup>
import AppIcon from '../icons/AppIcon.vue'
import { ref } from 'vue'

const props = defineProps({
  feedbacks: { type: Array, required: true },
})
const emit = defineEmits(['submit'])
const draft = ref({ type: '功能建议', content: '', contact: '' })

function submit() {
  if (!draft.value.content.trim()) return
  emit('submit', { ...draft.value })
  draft.value = { type: '功能建议', content: '', contact: '' }
}
</script>

<template>
  <view class="ui-section content-wrap feedback-view"><view class="ui-div page-heading"><view class="ui-div eyebrow"><view class="ui-span eyebrow-line"></view> LISTENING POST</view><view class="ui-h1">我的反馈</view><view class="ui-p">有新的想法，直接告诉我们。</view></view><view class="ui-div feedback-layout"><view class="ui-section feedback-form panel"><view class="ui-div panel-head compact"><view class="ui-div"><view class="ui-div panel-kicker">SEND A NOTE</view><view class="ui-h2">提交反馈</view></view><AppIcon type="chat" :size="21" /></view><view class="ui-label">反馈类型<view class="ui-div segmented-control"><button v-for="type in ['功能建议', '问题反馈', '其他']" :key="type" :class="{ selected: draft.type === type }" type="button" @click="draft.type = type">{{ type }}</button></view></view><view class="ui-label">反馈内容<textarea :value="draft.content" maxlength="500" placeholder="告诉我们你希望族谱增加什么，或遇到了什么问题..." @input="draft.content = $event.detail?.value ?? $event.target?.value ?? ''"></textarea><view class="ui-span field-count">{{ draft.content.length }} / 500</view></view><view class="ui-label">联系方式 <view class="ui-span optional">选填</view><input :value="draft.contact" placeholder="方便我们回复你的微信号或手机号" @input="draft.contact = $event.detail?.value ?? $event.target?.value ?? ''" /></view><button class="primary-button full-button" type="button" @click="submit"><AppIcon type="forward" :size="17" /> 提交反馈</button></view><view class="ui-section feedback-list"><view class="ui-div section-title page-section-title"><view class="ui-span">历史反馈</view><view class="ui-span feedback-count">{{ props.feedbacks.length }} 条</view></view><view v-for="feedback in props.feedbacks" :key="feedback.id" class="ui-article feedback-item panel"><view class="ui-div feedback-item-top"><view class="ui-span feedback-type">{{ feedback.type }}</view><view class="ui-span status-pill" :class="feedback.status === '处理中' ? 'working' : feedback.status === '已解决' ? 'resolved' : ''">{{ feedback.status }}</view></view><view class="ui-p">{{ feedback.content }}</view><view class="ui-div feedback-item-bottom"><view class="ui-span">{{ feedback.id }} · {{ feedback.time }}</view><view v-if="feedback.reply" class="ui-span reply-mark"><AppIcon type="checkmarkempty" :size="13" /> 已回复</view></view></view></view></view><view class="ui-div ad-slot"><view class="ui-span">AD SPACE</view><view class="ui-small">广告位 · 底部 Banner</view></view></view>
</template>

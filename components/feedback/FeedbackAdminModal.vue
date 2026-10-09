<script setup>
import AppIcon from '../icons/AppIcon.vue'
import { computed, ref } from 'vue'

const props = defineProps({ feedbacks: { type: Array, required: true } })
const emit = defineEmits(['close', 'status'])
const filter = ref('all')
const filtered = computed(() => filter.value === 'all' ? props.feedbacks : props.feedbacks.filter((item) => item.status === filter.value))
</script>

<template>
  <view class="ui-div modal-backdrop" @tap.stop><view class="ui-div admin-modal modal-card"><view class="ui-div modal-heading"><view class="ui-div"><view class="ui-div eyebrow"><view class="ui-span eyebrow-line"></view> ADMIN CONSOLE</view><view class="ui-h2">反馈管理</view></view><button class="close-button" type="button" aria-label="关闭" title="关闭" @click="emit('close')"><AppIcon type="closeempty" :size="18" /></button></view><view class="ui-div admin-toolbar"><view class="ui-div admin-tabs"><button v-for="item in ['all', '待处理', '处理中', '已解决']" :key="item" type="button" :class="{ active: filter === item }" @click="filter = item">{{ item === 'all' ? '全部' : item }}</button></view><view class="ui-span admin-hint"><AppIcon type="auth" :size="14" /> 已通过管理员校验</view></view><view class="ui-div admin-feedback-list"><view v-for="feedback in filtered" :key="feedback.id" class="ui-article admin-feedback"><view class="ui-div"><view class="ui-div feedback-item-top"><view class="ui-span feedback-type">{{ feedback.type }}</view><view class="ui-span status-pill" :class="feedback.status === '处理中' ? 'working' : feedback.status === '已解决' ? 'resolved' : ''">{{ feedback.status }}</view></view><view class="ui-p">{{ feedback.content }}</view><view class="ui-small">{{ feedback.id }} · {{ feedback.time }}</view></view><view class="ui-div admin-actions"><button v-if="feedback.status === '待处理'" type="button" @click="emit('status', feedback, '处理中')">开始处理</button><button v-if="feedback.status !== '已解决'" type="button" @click="emit('status', feedback, '已解决')">标记解决</button><button v-else type="button" @click="emit('status', feedback, '待处理')">重新打开</button></view></view><view v-if="filtered.length === 0" class="ui-div empty-state">暂无符合条件的反馈</view></view></view></view>
</template>

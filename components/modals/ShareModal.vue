<script setup>
import { ref } from 'vue'
import AppIcon from '../icons/AppIcon.vue'

defineProps({
  family: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  sharePath: { type: String, default: '' },
})
const emit = defineEmits(['close', 'prepare'])
const role = ref('viewer')
</script>

<template>
  <view class="ui-div modal-backdrop" @tap.stop>
    <view class="ui-div modal-card share-modal">
      <view class="ui-div modal-heading"><view class="ui-h2">分享 {{ family.name }}</view><button class="close-button" type="button" aria-label="关闭" @click="emit('close')"><AppIcon type="closeempty" :size="18" /></button></view>
      <view class="ui-p modal-description">选择权限后生成 30 天有效的分享入口。对方微信登录并接受后，可以持续查看同一份云端族谱。</view>
      <view class="ui-div access-options">
        <button type="button" :class="{ chosen: role === 'viewer' }" @click="role = 'viewer'"><view class="ui-span access-icon view"><AppIcon type="folder-add" :size="17" /></view><view class="ui-span"><view class="ui-strong">仅可查看</view><view class="ui-small">可以浏览族谱和成员资料</view></view><AppIcon v-if="role === 'viewer'" type="checkmarkempty" :size="17" /></button>
        <button type="button" :class="{ chosen: role === 'editor' }" @click="role = 'editor'"><view class="ui-span access-icon edit"><AppIcon type="compose" :size="17" /></view><view class="ui-span"><view class="ui-strong">可以编辑</view><view class="ui-small">双方共同维护同一份族谱</view></view><AppIcon v-if="role === 'editor'" type="checkmarkempty" :size="17" /></button>
      </view>
      <button v-if="!sharePath" class="primary-button share-action-button full-button" :disabled="loading" type="button" @click="emit('prepare', role)"><AppIcon type="forward" :size="17" /><view>{{ loading ? '正在生成' : '生成分享入口' }}</view></button>
      <button v-else class="primary-button share-action-button full-button" open-type="share" type="button"><AppIcon type="forward" :size="17" /><view>分享给微信好友</view></button>
      <button class="ghost-button full-button" type="button" @click="emit('close')">关闭</button>
    </view>
  </view>
</template>

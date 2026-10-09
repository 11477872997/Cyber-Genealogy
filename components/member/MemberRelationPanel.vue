<script setup>
import AppIcon from '../icons/AppIcon.vue'

defineProps({
  member: { type: Object, required: true },
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'add', 'edit', 'remove', 'detail'])

const relations = [
  { key: 'father', label: '添加父亲', short: '父' },
  { key: 'mother', label: '添加母亲', short: '母' },
  { key: 'spouse', label: '添加配偶', short: '配' },
  { key: 'brother', label: '添加兄弟', short: '兄' },
  { key: 'son', label: '添加儿子', short: '子' },
  { key: 'daughter', label: '添加女儿', short: '女' },
]
</script>

<template>
  <view class="relation-panel" @tap="emit('close')">
    <button class="relation-close" type="button" aria-label="关闭关系面板" @tap="emit('close')"><AppIcon type="closeempty" :size="22" /></button>
    <view class="relation-layout" @tap.stop>
      <button v-for="item in relations" :key="item.key" class="relation-option" type="button" :disabled="!editable" @tap="emit('add', item.key)">
        <view class="relation-option-avatar">{{ item.short }}</view>
        <text>{{ item.label }}</text>
      </button>
      <button class="relation-member" type="button" @tap="emit('detail')">
        <text class="relation-member-hint">点击头像查看资料</text>
        <view class="relation-member-avatar" :style="{ backgroundColor: member.color || '#d8e7df' }">
          <image v-if="member.avatarUrl" :src="member.avatarUrl" mode="aspectFill" />
          <text v-else>{{ member.avatar || member.name?.slice(0, 1) }}</text>
        </view>
        <text class="relation-member-name">{{ member.name }}</text>
        <text class="relation-member-meta">{{ member.generation }} · {{ member.role }}</text>
      </button>
    </view>
    <view v-if="editable" class="relation-actions" @tap.stop>
      <button type="button" @tap="emit('edit')"><AppIcon type="compose" :size="18" /> 编辑</button>
      <button class="danger" type="button" @tap="emit('remove')"><AppIcon type="trash" :size="18" /> 删除</button>
    </view>
    <view v-else class="relation-readonly">当前为查看权限</view>
  </view>
</template>

<style scoped>
.relation-panel { position: absolute; z-index: 30; inset: 0; box-sizing: border-box; min-height: 100%; padding: 60px 16px 28px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; overflow-y: auto; color: #fff; background: rgba(24, 29, 26, .68); }
.relation-close { position: absolute; z-index: 2; top: 16px; left: 14px; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 50%; color: #37423c; background: rgba(255, 255, 255, .95); }
.relation-layout { width: 320px; max-width: 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: 118px 144px 118px; gap: 12px; align-items: stretch; }
.relation-option, .relation-member { box-sizing: border-box; margin: 0; padding: 8px 5px; border: 0; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #29322d; background: #fff; box-shadow: 0 5px 15px rgba(0,0,0,.12); }
.relation-option[disabled] { color: #8d9691; background: #f1f3f1; opacity: 1; }
.relation-option:nth-child(1) { grid-column: 2; grid-row: 1; }
.relation-option:nth-child(2) { grid-column: 3; grid-row: 1; }
.relation-option:nth-child(3) { grid-column: 1; grid-row: 2; }
.relation-option:nth-child(4) { grid-column: 4; grid-row: 2; }
.relation-option:nth-child(5) { grid-column: 2; grid-row: 3; }
.relation-option:nth-child(6) { grid-column: 3; grid-row: 3; }
.relation-option-avatar { width: 52px; height: 52px; margin-bottom: 7px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #755f3b; background: #f2e6d2; font-size: 20px; font-weight: 800; }
.relation-option text { font-size: 12px; font-weight: 700; }
.relation-member { grid-column: 2 / 4; grid-row: 2; align-self: stretch; justify-self: stretch; min-height: 0; }
.relation-member-hint { margin-bottom: 5px; color: #707a74; font-size: 9px; }
.relation-member-avatar { width: 61px; height: 61px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #294038; font-size: 22px; font-weight: 800; }
.relation-member-avatar image { width: 100%; height: 100%; }
.relation-member-name { margin-top: 5px; font-size: 14px; font-weight: 800; }
.relation-member-meta { margin-top: 2px; color: #8c948f; font-size: 9px; }
.relation-actions { width: 310px; max-width: 100%; margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.relation-actions button { height: 45px; border: 0; border-radius: 23px; gap: 6px; color: #7d6842; background: #fff; font-size: 14px; }
.relation-actions .danger { color: #fff; background: #dd7652; }
.relation-readonly { margin-top: 24px; color: rgba(255,255,255,.86); font-size: 12px; }

@media (max-width: 350px) {
  .relation-panel { padding-right: 10px; padding-left: 10px; }
  .relation-layout, .relation-actions { width: 100%; }
  .relation-option text { font-size: 11px; }
}
</style>

<script setup>
defineOptions({ name: 'FgTreeBranch' })

defineProps({
  node: { type: Object, required: true },
  collapsedIds: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
  showGeneration: { type: Boolean, default: true },
  showNote: { type: Boolean, default: true },
})
const emit = defineEmits(['check', 'toggle'])
</script>

<template>
  <view class="fg-branch" :style="{ width: `${node.layoutWidth}px` }">
    <view class="fg-people">
      <view v-for="person in [node, ...(node.spouse || [])]" :key="person.id" class="fg-card" :class="{ 'fg-card-selected': selectedId === person.id, 'fg-card-deceased': !person.isLife }" @tap.stop="emit('check', person)">
        <view v-if="!person.isLife" class="fg-deceased">已故</view>
        <view class="fg-avatar" :style="{ backgroundColor: person.color }"><image v-if="person.avatarUrl" class="fg-avatar-image" :src="person.avatarUrl" mode="aspectFill" /><text v-else>{{ person.avatar }}</text></view>
        <view class="fg-relation">{{ person.relation }}</view>
        <view class="fg-name">{{ person.name }}</view>
        <view v-if="showNote && person.note" class="fg-note">{{ person.note }}</view>
        <view v-else-if="showGeneration" class="fg-generation">{{ person.generation || '' }}</view>
      </view>
    </view>
    <view v-if="node.children && node.children.length" class="fg-descendants">
      <view class="fg-stem" />
      <view class="fg-fold" role="button" :aria-label="collapsedIds.includes(node.id) ? '展开后代' : '收起后代'" @tap.stop="emit('toggle', node.id)">{{ collapsedIds.includes(node.id) ? '+' : '−' }}</view>
      <view v-if="!collapsedIds.includes(node.id)" class="fg-children">
        <view v-for="(child, index) in node.children" :key="child.id" class="fg-child-slot" :style="{ width: `${child.layoutWidth}px` }">
          <view class="fg-connector"><view v-if="index > 0" class="fg-left-line" /><view v-if="index < node.children.length - 1" class="fg-right-line" /><view class="fg-down-line" /></view>
          <FgTreeBranch :node="child" :collapsed-ids="collapsedIds" :selected-id="selectedId" :show-generation="showGeneration" :show-note="showNote" @check="emit('check', $event)" @toggle="emit('toggle', $event)" />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.fg-branch { position: relative; flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; }
.fg-people { display: flex; justify-content: center; gap: 8px; }
.fg-card { position: relative; box-sizing: border-box; width: 90px; height: 140px; padding: 13px 5px 6px; border: 1px solid #dde4dd; border-radius: 5px; background: #fff; box-shadow: 0 4px 10px rgba(43, 55, 47, .1); display: flex; flex-direction: column; align-items: center; overflow: hidden; }
.fg-card-selected { border-color: #b69a61; box-shadow: 0 0 0 2px rgba(182, 154, 97, .18), 0 4px 10px rgba(43, 55, 47, .1); }
.fg-card-deceased .fg-avatar { filter: grayscale(1); }
.fg-avatar { flex: 0 0 54px; width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #253a36; font-size: 19px; font-weight: 700; }
.fg-avatar-image { width: 54px; height: 54px; }
.fg-relation { position: relative; z-index: 1; max-width: 78px; min-height: 18px; padding: 0 7px; margin-top: -5px; border-radius: 9px; overflow: hidden; color: #88744c; background: #f3f0e8; font-size: 10px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
.fg-name { width: 100%; margin-top: 7px; overflow: hidden; color: #26332d; font-size: 13px; font-weight: 700; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.fg-generation, .fg-note { width: 100%; margin-top: 3px; overflow: hidden; color: #89938b; font-size: 10px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.fg-deceased { position: absolute; z-index: 2; right: 0; top: 0; padding: 2px 5px; border-radius: 0 0 0 5px; color: #68716b; background: #e4e7e4; font-size: 9px; }
.fg-descendants { width: 100%; display: flex; flex-direction: column; align-items: center; }
.fg-stem { width: 1px; height: 14px; background: #b9c6be; }
.fg-fold { z-index: 2; box-sizing: border-box; width: 24px; height: 24px; border: 1px solid #b7c2ba; border-radius: 50%; color: #647c6b; background: #fff; font-size: 18px; line-height: 20px; text-align: center; }
.fg-children { display: flex; align-items: flex-start; }
.fg-child-slot { position: relative; flex: 0 0 auto; }
.fg-connector { position: relative; height: 27px; }
.fg-left-line, .fg-right-line, .fg-down-line { position: absolute; background: #b9c6be; }
.fg-left-line { left: 0; right: 50%; top: 12px; height: 1px; }
.fg-right-line { left: 50%; right: 0; top: 12px; height: 1px; }
.fg-down-line { left: 50%; top: 12px; width: 1px; height: 15px; }
</style>

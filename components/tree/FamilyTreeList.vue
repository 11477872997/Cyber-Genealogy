<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '../icons/AppIcon.vue'
import { buildFamilyTree } from '../../services/familyTree'

const props = defineProps({
  members: { type: Array, default: () => [] },
})
const emit = defineEmits(['add-root'])
const instance = getCurrentInstance()?.proxy
const areaSize = ref({ width: 320, height: 420 })
const scale = ref(1)
const position = ref({ x: 0, y: 0 })

const treeData = computed(() => buildFamilyTree(props.members))

function requiredWidth(nodes) {
  return nodes.reduce((total, node) => {
    const ownWidth = node.spouse ? 292 : 152
    return total + Math.max(ownWidth, node.child.length ? requiredWidth(node.child) : 0)
  }, 0)
}

function requiredDepth(nodes, depth = 1) {
  return nodes.reduce((max, node) => Math.max(max, node.child.length ? requiredDepth(node.child, depth + 1) : depth), depth)
}

const treeConfig = computed(() => ({
  width: Math.max(areaSize.value.width, requiredWidth(treeData.value) + 32),
  height: Math.max(areaSize.value.height, requiredDepth(treeData.value) * 170 + 24),
}))

function fitTree() {
  const widthScale = (areaSize.value.width - 20) / treeConfig.value.width
  const heightScale = (areaSize.value.height - 20) / treeConfig.value.height
  scale.value = Math.max(.8, Math.min(1, widthScale, heightScale))
  position.value = {
    x: Math.min(0, Math.round((areaSize.value.width - treeConfig.value.width * scale.value) / 2)),
    y: 0,
  }
}

function measureArea() {
  const query = uni.createSelectorQuery()
  const scoped = instance && query.in ? query.in(instance) : query
  scoped.select('.family-tree-list-area').boundingClientRect((rect) => {
    if (rect?.width && rect?.height) areaSize.value = { width: Math.round(rect.width), height: Math.round(rect.height) }
    nextTick(fitTree)
  }).exec()
}

function changeScale(event) {
  scale.value = event.detail.scale
}

watch(() => props.members, async () => {
  await nextTick()
  measureArea()
}, { deep: true })

onMounted(async () => {
  await nextTick()
  measureArea()
  uni.onWindowResize?.(measureArea)
})

onBeforeUnmount(() => uni.offWindowResize?.(measureArea))
</script>

<template>
  <view class="ui-section family-tree-list-panel panel">
    <view class="ui-div tree-list-heading"><view class="ui-div"><view class="ui-h2">家族组织架构</view><view class="ui-small">拖动浏览 · 双指缩放</view></view><view class="ui-div tree-list-tools"><view class="ui-span">{{ Math.round(scale * 100) }}%</view><button class="icon-button" type="button" aria-label="适应屏幕" @click="fitTree"><AppIcon type="refresh" :size="16" /></button></view></view>
    <view class="ui-div family-tree-list-area">
      <movable-area class="tree-movable-area">
        <movable-view class="tree-movable-view" direction="all" :scale="true" :scale-value="scale" :scale-min=".55" :scale-max="1.2" :x="position.x" :y="position.y" :style="{ width: `${treeConfig.width}px`, height: `${treeConfig.height}px` }" @scale="changeScale">
          <view class="ui-div tree-list-content"><slot :tree-data="treeData" /></view>
        </movable-view>
      </movable-area>
      <view v-if="!members.length" class="ui-div tree-list-empty"><view class="ui-strong">这份族谱还没有人员</view><button class="primary-button" type="button" @click="emit('add-root')">新增第一位人员</button></view>
    </view>
    <view class="ui-div tree-list-footer">{{ members.length }} 位成员</view>
  </view>
</template>

<style scoped>
.family-tree-list-panel { min-width: 0; overflow: hidden; display: flex; flex-direction: column; }
.tree-list-heading { min-height: 66px; flex: 0 0 auto; padding: 12px 16px; border-bottom: 1px solid #e1e6df; display: flex; align-items: center; justify-content: space-between; }
.tree-list-heading .ui-h2 { margin: 0; color: #30413d; font-size: 16px; }
.tree-list-heading .ui-small { display: block; margin-top: 5px; color: #8b9992; font-size: 9px; }
.tree-list-tools { display: flex; align-items: center; gap: 9px; color: #899691; font-size: 10px; }
.tree-list-tools .icon-button { width: 29px; height: 29px; }
.family-tree-list-area { position: relative; min-height: 0; flex: 1; overflow: hidden; background-color: #fbfcf7; background-image: radial-gradient(circle, rgba(121, 157, 150, .19) 1px, transparent 1px); background-size: 18px 18px; }
.tree-movable-area { width: 100%; height: 100%; overflow: hidden; }
.tree-movable-view { position: relative; }
.tree-list-content { position: absolute; z-index: 1; top: 4px; left: 0; width: 100%; }
.tree-list-empty { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #657a71; background: #fff; }
.tree-list-empty .primary-button { margin: 0; }
.tree-list-footer { min-height: 38px; flex: 0 0 38px; padding: 0 14px; border-top: 1px solid #e1e6df; display: flex; align-items: center; color: #6f8179; font-size: 11px; }
</style>

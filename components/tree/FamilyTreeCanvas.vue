<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from '../icons/AppIcon.vue'
import { useTreeCanvas } from '../../composables/useTreeCanvas'

const props = defineProps({
  members: { type: Object, required: true },
  selectedMemberId: { type: String, required: true },
  canvasId: { type: String, default: 'familyTreeCanvas' },
})
const emit = defineEmits(['select'])
const selectedId = ref(props.selectedMemberId)
const memberList = computed(() => props.members)
const viewportId = `${props.canvasId}Viewport`
const tree = reactive(useTreeCanvas(memberList, selectedId, props.canvasId, viewportId))

watch(() => props.selectedMemberId, (value) => { selectedId.value = value })

function finishInteraction(event) {
  tree.finishInteraction(event)
  if (selectedId.value !== props.selectedMemberId) emit('select', selectedId.value)
}
</script>

<template>
  <view class="ui-section tree-card panel">
    <view class="ui-div panel-head"><view class="ui-div tree-title"><view class="ui-h2">家族组织架构</view></view><view class="ui-div tree-toolbar"><button class="icon-button" type="button" aria-label="缩小" title="缩小" @click="tree.zoom(-.1)"><AppIcon type="minus" :size="17" /></button><view class="ui-span">{{ Math.round(tree.scale * 100) }}%</view><button class="icon-button" type="button" aria-label="放大" title="放大" @click="tree.zoom(.1)"><AppIcon type="plusempty" :size="17" /></button><view class="ui-span toolbar-divider"></view><button class="icon-button" type="button" aria-label="重置视图" title="重置视图" @click="tree.reset"><AppIcon type="refresh" :size="16" /></button></view></view>
    <view :id="viewportId" class="ui-div tree-viewport" @wheel="tree.onWheel">
      <canvas
        :id="canvasId"
        :canvas-id="canvasId"
        disable-scroll
        :width="tree.canvasSize.width"
        :height="tree.canvasSize.height"
        :style="{ width: `${tree.canvasSize.width}px`, height: `${tree.canvasSize.height}px` }"
        @touchstart="tree.startInteraction"
        @touchmove="tree.moveInteraction"
        @touchend="finishInteraction"
        @touchcancel="tree.cancelInteraction"
        @mousedown="tree.startInteraction"
        @mousemove="tree.moveInteraction"
        @mouseup="finishInteraction"
        @mouseleave="tree.cancelInteraction"
      ></canvas>
      <view class="ui-div tree-hint"><AppIcon type="navigate" :size="13" /> 拖动浏览 <view class="ui-span"></view> 使用按钮缩放</view>
    </view>
    <view class="ui-div tree-footer"><view class="ui-span">{{ members.length }} 位成员</view></view>
  </view>
</template>

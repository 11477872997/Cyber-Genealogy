<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { flattenFgTree } from './layout.js'

const props = defineProps({
  list: { type: Array, default: () => [] },
  direction: { type: String, default: 'all' },
  friction: { type: Number, default: 4 },
  disabled: { type: Boolean, default: false },
  scale: { type: Boolean, default: true },
  selectedId: { type: String, default: '' },
  showGeneration: { type: Boolean, default: true },
  showNote: { type: Boolean, default: true },
})
const emit = defineEmits(['check'])
const instance = getCurrentInstance()?.proxy
const collapsedIds = ref([])
const positionX = ref(0)
const positionY = ref(24)
const scaleValue = ref(0.55)
const interactionActive = ref(false)
const viewport = ref({ width: 320, height: 520 })
const flatTree = computed(() => flattenFgTree(props.list, collapsedIds.value))
const chartWidth = computed(() => flatTree.value.width)
const chartHeight = computed(() => flatTree.value.height)
const canvasWidth = computed(() => Math.max(viewport.value.width, chartWidth.value + 40))
const canvasHeight = computed(() => Math.max(viewport.value.height, chartHeight.value + 50))

function measure() {
  const query = uni.createSelectorQuery()
  const scoped = instance && query.in ? query.in(instance) : query
  refreshView()
  scoped.select('.fg-viewport').boundingClientRect((rect) => {
    if (rect?.width && rect?.height) viewport.value = { width: rect.width, height: rect.height }
    nextTick(refreshView)
  }).exec()
}

function refreshView() {
  const fitScale = Math.min(1, (viewport.value.width - 24) / Math.max(chartWidth.value, 1))
  scaleValue.value = Math.max(0.55, fitScale)
  positionX.value = Math.round((viewport.value.width - canvasWidth.value * scaleValue.value) / 2)
  positionY.value = 24
}

function toggle(id) {
  collapsedIds.value = collapsedIds.value.includes(id)
    ? collapsedIds.value.filter((value) => value !== id)
    : [...collapsedIds.value, id]
  nextTick(refreshView)
}

function onChange(event) {
  // Ignore the initial layout event. It reports the component defaults rather than a user gesture.
  if (!event.detail.source) return
  if (typeof event.detail.x === 'number') positionX.value = event.detail.x
  if (typeof event.detail.y === 'number') positionY.value = event.detail.y
}
function onScale(event) {
  // Scale events do not expose a source. Only persist values produced during a real touch gesture.
  if (!interactionActive.value) return
  if (typeof event.detail.scale === 'number') scaleValue.value = event.detail.scale
}

function beginInteraction() { interactionActive.value = true }
function endInteraction() { interactionActive.value = false }

watch(() => props.list, async () => { await nextTick(); measure() }, { deep: true })
onMounted(async () => { await nextTick(); measure(); uni.onWindowResize?.(measure) })
function focusSelected() {
  const card = flatTree.value.cards.find((item) => item.id === props.selectedId)
  if (!card) return refreshView()
  const chartOffset = (canvasWidth.value - chartWidth.value) / 2
  positionX.value = Math.round(viewport.value.width / 2 - (chartOffset + card.x + 45) * scaleValue.value)
  positionY.value = Math.round(Math.max(20, viewport.value.height * 0.2) - (card.y + 70) * scaleValue.value)
}

onBeforeUnmount(() => uni.offWindowResize?.(measure))
defineExpose({ refreshView, focusSelected })
</script>

<template>
  <view class="fg-viewport">
    <movable-area class="fg-area">
      <movable-view
        class="fg-movable"
        :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
        :x="positionX"
        :y="positionY"
        :scale-value="scaleValue"
        :scale="scale"
        :scale-min="0.4"
        :scale-max="1.6"
        :disabled="disabled"
        :friction="friction"
        :direction="direction"
        :inertia="true"
        :out-of-bounds="true"
        @touchstart="beginInteraction"
        @touchend="endInteraction"
        @touchcancel="endInteraction"
        @change="onChange"
        @scale="onScale"
      >
        <view class="fg-canvas" :style="{ width: `${chartWidth}px`, height: `${chartHeight}px` }">
          <view
            v-for="(line, index) in flatTree.lines"
            :key="`line-${index}`"
            class="fg-line"
            :style="{ left: `${line.x}px`, top: `${line.y}px`, width: `${line.width}px`, height: `${line.height}px` }"
          />
          <view
            v-for="fold in flatTree.folds"
            :key="`fold-${fold.id}`"
            class="fg-fold"
            :style="{ left: `${fold.x}px`, top: `${fold.y}px` }"
            role="button"
            :aria-label="fold.collapsed ? '展开后代' : '收起后代'"
            @tap.stop="toggle(fold.id)"
          >{{ fold.collapsed ? '+' : '−' }}</view>
          <view
            v-for="person in flatTree.cards"
            :key="person.id"
            class="fg-card"
            :class="{ 'fg-card-selected': selectedId === person.id, 'fg-card-deceased': !person.isLife }"
            :style="{ left: `${person.x}px`, top: `${person.y}px` }"
            @tap.stop="emit('check', person)"
          >
            <view v-if="!person.isLife" class="fg-deceased">已故</view>
            <view class="fg-avatar" :style="{ backgroundColor: person.color }"><image v-if="person.avatarUrl" class="fg-avatar-image" :src="person.avatarUrl" mode="aspectFill" /><text v-else>{{ person.avatar }}</text></view>
            <view class="fg-relation">{{ person.relation }}</view>
            <view class="fg-name">{{ person.name }}</view>
            <view v-if="showNote && person.note" class="fg-note">{{ person.note }}</view>
            <view v-else-if="showGeneration" class="fg-generation">{{ person.generation || '' }}</view>
          </view>
        </view>
      </movable-view>
    </movable-area>
  </view>
</template>

<style scoped>
.fg-viewport { position: relative; width: 100%; height: 100%; min-height: 0; overflow: hidden; background: #f8fbf6; }
.fg-area { width: 100%; height: 100%; overflow: hidden; }
.fg-movable { position: relative; display: block; }
.fg-canvas { position: relative; margin: 0 auto; }
.fg-line { position: absolute; z-index: 0; background: #b9c6be; }
.fg-fold { position: absolute; z-index: 3; box-sizing: border-box; width: 24px; height: 24px; border: 1px solid #b7c2ba; border-radius: 50%; color: #647c6b; background: #fff; font-size: 18px; line-height: 20px; text-align: center; }
.fg-card { position: absolute; z-index: 2; box-sizing: border-box; width: 90px; height: 140px; padding: 13px 5px 6px; border: 1px solid #dde4dd; border-radius: 5px; background: #fff; box-shadow: 0 4px 10px rgba(43, 55, 47, .1); display: flex; flex-direction: column; align-items: center; overflow: hidden; }
.fg-card-selected { border-color: #b69a61; box-shadow: 0 0 0 2px rgba(182, 154, 97, .18), 0 4px 10px rgba(43, 55, 47, .1); }
.fg-card-deceased .fg-avatar { filter: grayscale(1); }
.fg-avatar { flex: 0 0 54px; width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #253a36; font-size: 19px; font-weight: 700; }
.fg-avatar-image { width: 54px; height: 54px; }
.fg-relation { position: relative; z-index: 1; max-width: 78px; min-height: 18px; padding: 0 7px; margin-top: -5px; border-radius: 9px; overflow: hidden; color: #88744c; background: #f3f0e8; font-size: 10px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
.fg-name { width: 100%; margin-top: 7px; overflow: hidden; color: #26332d; font-size: 13px; font-weight: 700; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.fg-generation, .fg-note { width: 100%; margin-top: 3px; overflow: hidden; color: #89938b; font-size: 10px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.fg-deceased { position: absolute; z-index: 2; right: 0; top: 0; padding: 2px 5px; border-radius: 0 0 0 5px; color: #68716b; background: #e4e7e4; font-size: 9px; }
</style>

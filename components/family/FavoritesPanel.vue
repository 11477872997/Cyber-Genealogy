<script setup>
import AppIcon from '../icons/AppIcon.vue'
import { computed, ref } from 'vue'

const props = defineProps({ favorites: { type: Array, required: true } })
const emit = defineEmits(['remove', 'open', 'share'])
const search = ref('')
const filtered = computed(() => props.favorites.filter((family) => family.name.includes(search.value.trim())))
</script>

<template>
  <view class="ui-section content-wrap list-view"><view class="ui-div page-heading"><view class="ui-div eyebrow"><view class="ui-span eyebrow-line"></view> SAVED FAMILIES</view><view class="ui-h1">收藏族谱</view><view class="ui-p">把家人的故事放在容易找回的位置。</view></view><view class="ui-div list-toolbar"><view class="ui-div search-box"><AppIcon type="search" :size="17" /><input :value="search" placeholder="搜索族谱名称" @input="search = $event.detail?.value ?? $event.target?.value ?? ''" /></view><button class="filter-button" type="button"><AppIcon type="tune" :size="16" /> 筛选</button></view><view class="ui-div family-grid"><view v-for="family in filtered" :key="family.id" class="ui-article family-card panel"><view class="ui-div family-cover" :class="family.tone"><view class="ui-div cover-lines"></view><view class="ui-span family-symbol">族</view><button class="bookmark-button" type="button" aria-label="取消收藏" title="取消收藏" @click="emit('remove', family)"><AppIcon type="star-filled" :size="17" /></button></view><view class="ui-div family-card-body"><view class="ui-div family-card-title"><view class="ui-div"><view class="ui-h2">{{ family.name }}</view><view class="ui-p">创建人 {{ family.ownerName || '微信用户' }}</view></view><view class="ui-span permission-tag">可查看</view></view><view class="ui-div family-card-meta"><view class="ui-span"><AppIcon type="staff" :size="14" /> {{ Array.isArray(family.members) ? family.members.length : (family.members || 0) }}</view><view class="ui-span">{{ family.updated }}</view></view><button class="open-family" type="button" @click="emit('open', family)">打开族谱 <AppIcon type="forward" :size="15" /></button></view></view><button class="empty-family-card" type="button" @click="emit('share')"><AppIcon type="plus" :size="20" /><view class="ui-strong">从分享链接收藏族谱</view><view class="ui-span">打开家人分享的族谱后即可收藏</view></button></view><view class="ui-div ad-slot"><view class="ui-span">AD SPACE</view><view class="ui-small">广告位 · 底部 Banner</view></view></view>
</template>

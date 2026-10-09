<script setup>
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'

onShow(showPageShareMenu)
onShareAppMessage(pageSharePayload)
onShareTimeline(pageTimelinePayload)

onLoad(() => uni.switchTab({ url: '/pages/index/index' }))
</script>

<template>
  <view></view>
</template>

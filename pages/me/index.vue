<script setup>
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import MePage from './MePage.vue'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'

onShow(showPageShareMenu)
onShareAppMessage(pageSharePayload)
onShareTimeline(pageTimelinePayload)
</script>

<template>
  <MePage />
</template>

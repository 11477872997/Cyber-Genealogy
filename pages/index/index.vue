<script setup>
import { ref } from 'vue'
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import DirectoryPage from './DirectoryPage.vue'
import { pageSharePayload, pageTimelinePayload, showPageShareMenu } from '../../services/pageShare.js'

const sharePayload = ref(null)
onShow(showPageShareMenu)
onShareAppMessage(() => pageSharePayload(sharePayload.value))
onShareTimeline(pageTimelinePayload)
</script>

<template>
  <DirectoryPage @share-change="sharePayload = $event" />
</template>

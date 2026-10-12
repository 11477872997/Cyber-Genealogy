<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  description: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function change(event) {
  emit('update:modelValue', event.detail.value.includes('accepted'))
}

function openDocument(type) {
  uni.navigateTo({ url: `/pages/legal/${type}` })
}
</script>

<template>
  <view class="legal-consent">
    <view class="legal-consent-line">
      <checkbox-group @change="change">
        <label class="legal-consent-check">
          <checkbox value="accepted" :checked="modelValue" color="#a58a5a" />
          <text>我已阅读并同意</text>
        </label>
      </checkbox-group>
      <view class="legal-consent-links">
        <button type="button" @click.stop="openDocument('terms')">《用户服务协议》</button>
        <text>和</text>
        <button type="button" @click.stop="openDocument('privacy')">《隐私政策》</button>
      </view>
    </view>
    <view v-if="description" class="legal-consent-description">{{ description }}</view>
  </view>
</template>

<style scoped>
.legal-consent { color: #68736d; font-size: 11px; line-height: 1.55; }
.legal-consent-line { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
.legal-consent-check { display: flex; align-items: center; gap: 5px; }
.legal-consent-check checkbox { transform: scale(.72); transform-origin: center; }
.legal-consent-links { max-width: 100%; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 1px; }
.legal-consent-links button { width: auto; min-height: 24px; margin: 0; padding: 0; border: 0; color: #8d7446; background: transparent; font-size: 11px; line-height: 24px; }
.legal-consent-links button::after { border: 0; }
.legal-consent-description { max-width: 100%; margin-top: 5px; padding: 0 4px; color: #929b96; text-align: center; font-size: 10px; box-sizing: border-box; }
</style>

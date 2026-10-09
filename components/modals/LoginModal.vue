<script setup>
import AppIcon from '../icons/AppIcon.vue'
const logoUrl = '/static/logo.png'

defineProps({ loggedIn: { type: Boolean, default: true } })
const emit = defineEmits(['close', 'login', 'logout'])
</script>

<template>
<view class="ui-div modal-backdrop" @tap.stop><view class="ui-div login-modal modal-card"><button class="close-button" type="button" aria-label="关闭" title="关闭" @click="emit('close')"><AppIcon type="closeempty" :size="18" /></button><view class="ui-div brand-mark login-brand"><image class="ui-img brand-image" :src="logoUrl" alt="赛博宗族 Logo" /></view><view class="ui-h2">微信账号登录</view><view class="ui-p">用于显示你的头像与昵称。当前族谱仍保存在本机，接入云端身份服务后才会跨设备同步。</view><button class="wechat-button" type="button" @click="emit('login')"><view class="ui-span">W</view> 微信一键登录</button><button v-if="loggedIn" class="logout-button" type="button" @click="emit('logout')"><AppIcon type="redo" :size="14" /> 退出当前账号</button></view></view>
</template>

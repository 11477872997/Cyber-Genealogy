<script setup>
import AppIcon from '../icons/AppIcon.vue'
import { computed, ref } from 'vue'
import { isMemberAlive } from '../../services/memberStatus.js'

const props = defineProps({
  member: { type: Object, default: null },
  members: { type: Array, default: () => [] },
  mode: { type: String, default: 'add' },
  initialParentId: { type: String, default: '' },
  relationType: { type: String, default: 'child' },
  lockParent: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'save'])
const genderOptions = ['男', '女', '其他']
const form = ref({ name: props.member?.name || '', gender: props.member?.gender || '男', role: props.relationType === 'spouse' ? '配偶' : (props.member?.role || '家族成员'), birth: props.member?.birth === '待补充' ? '' : (props.member?.birth || ''), isLife: props.member ? isMemberAlive(props.member) : true, bio: props.member?.bio || '', parentId: props.initialParentId || props.member?.parentId || props.members[0]?.id || '', relationType: props.relationType })
const parents = computed(() => props.members.filter((member) => member.id !== props.member?.id))
const parentNames = computed(() => parents.value.map((member) => member.name))
const parentIndex = computed(() => Math.max(0, parents.value.findIndex((member) => member.id === form.value.parentId)))
const parent = computed(() => props.members.find((member) => member.id === form.value.parentId))
const modalTitle = computed(() => props.mode === 'edit' ? '编辑人员' : props.relationType === 'spouse' ? '新增配偶' : props.initialParentId ? '新增子级' : '新增人员')

function value(event) {
  return event.detail?.value ?? event.target?.value ?? ''
}

function save() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
}

function changeGender(event) {
  form.value.gender = genderOptions[Number(event.detail.value)] || genderOptions[0]
}

function changeParent(event) {
  form.value.parentId = parents.value[Number(event.detail.value)]?.id || ''
}
</script>

<template>
  <view class="ui-div modal-backdrop" @tap.stop><view class="ui-div modal-card form-modal"><view class="ui-div modal-heading"><view class="ui-h2">{{ modalTitle }}</view><button class="close-button" type="button" aria-label="关闭" @click="emit('close')"><AppIcon type="closeempty" :size="18" /></button></view><view class="ui-div form-grid"><view class="ui-label">姓名<input :value="form.name" placeholder="输入成员姓名" @input="form.name = value($event)" /></view><view class="ui-label">性别<picker class="form-select" :range="genderOptions" :value="Math.max(0, genderOptions.indexOf(form.gender))" @change="changeGender"><view>{{ form.gender }}</view></picker></view><view v-if="relationType !== 'spouse'" class="ui-label">成员身份<input :value="form.role" placeholder="例如：长子、长女" @input="form.role = value($event)" /></view><view class="ui-label">出生日期<input :value="form.birth" placeholder="YYYY.MM.DD" @input="form.birth = value($event)" /></view><view class="ui-label">在世状态<view class="life-status-control"><button type="button" :class="{ active: form.isLife }" @click="form.isLife = true">在世</button><button type="button" :class="{ active: !form.isLife }" @click="form.isLife = false">已故</button></view></view></view><view v-if="mode === 'add' && parents.length" class="ui-label parent-label">{{ relationType === 'spouse' ? '关联成员' : '上级成员' }}<view v-if="lockParent" class="form-select locked-parent">{{ parent?.name || '未选择' }}</view><picker v-else class="form-select" :range="parentNames" :value="parentIndex" @change="changeParent"><view>{{ parents[parentIndex]?.name || '请选择' }}</view></picker></view><view class="ui-label">个人简介<textarea :value="form.bio" placeholder="记录一些值得被记住的事..." @input="form.bio = value($event)"></textarea></view><view class="ui-div modal-actions"><button class="ghost-button" type="button" @click="emit('close')">取消</button><button class="primary-button" type="button" @click="save"><AppIcon type="checkmarkempty" :size="17" /> 保存</button></view></view></view>
</template>

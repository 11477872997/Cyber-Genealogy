<script setup>
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import AppShell from '../../components/layout/AppShell.vue'
import FamilyTreeList from '../../components/tree/FamilyTreeList.vue'
import TreeList from '../../uni_modules/tree-list/components/tree-list/tree-list.vue'
import FeedbackAdminModal from '../../components/feedback/FeedbackAdminModal.vue'
import MemberFormModal from '../../components/modals/MemberFormModal.vue'
import { useGenealogyStore } from '../../services/genealogyStore'

const { families, activeFamily, selectedFamilyId, members, selectedMemberId, feedbacks, selectFamily, addMember, updateMember, removeMember, updateFeedbackStatus } = useGenealogyStore()
const names = computed(() => families.value.map((family) => family.name))
const familyIndex = computed(() => Math.max(0, families.value.findIndex((family) => family.id === selectedFamilyId.value)))
const showAdmin = ref(false)
const viewportHeight = ref(0)
const showMemberForm = ref(false)
const memberFormMode = ref('add')
const relationType = ref('child')
const parentId = ref('')
const editingMember = ref(null)

function measureWindow() {
  viewportHeight.value = uni.getWindowInfo().windowHeight
}

onMounted(() => {
  measureWindow()
  uni.onWindowResize?.(measureWindow)
})

onUnmounted(() => uni.offWindowResize?.(measureWindow))

function changeFamily(event) {
  const family = families.value[Number(event.detail.value)]
  if (family) selectFamily(family.id)
}

function goToFamilies() {
  uni.switchTab({ url: '/pages/me/index' })
}

function openAdd(item, type = 'child') {
  if (!activeFamily.value || activeFamily.value.isExample || activeFamily.value.canEdit === false) {
    uni.showToast({ title: '这份族谱仅可查看', icon: 'none' })
    return
  }
  if (type === 'spouse' && members.value.some((member) => member.role === '配偶' && member.parentId === item.id)) {
    uni.showToast({ title: '该成员已经有配偶', icon: 'none' })
    return
  }
  memberFormMode.value = 'add'
  relationType.value = type
  parentId.value = item?.id || ''
  editingMember.value = null
  showMemberForm.value = true
}

function openEdit(item) {
  if (!activeFamily.value || activeFamily.value.isExample || activeFamily.value.canEdit === false) return
  const member = members.value.find((current) => current.id === item.id)
  if (!member) return
  memberFormMode.value = 'edit'
  relationType.value = member.role === '配偶' ? 'spouse' : 'child'
  parentId.value = member.parentId || ''
  editingMember.value = member
  selectedMemberId.value = member.id
  showMemberForm.value = true
}

function saveMember(payload) {
  const saved = memberFormMode.value === 'edit'
    ? updateMember(editingMember.value?.id, payload)
    : addMember({ ...payload, relationType: relationType.value })
  if (!saved) {
    uni.showToast({ title: relationType.value === 'spouse' ? '该成员已经有配偶' : '请填写完整信息', icon: 'none' })
    return
  }
  showMemberForm.value = false
  uni.showToast({ title: memberFormMode.value === 'edit' ? '资料已更新' : '人员已新增', icon: 'success' })
}

function confirmDelete(item) {
  if (!activeFamily.value || activeFamily.value.isExample || activeFamily.value.canEdit === false) return
  const member = members.value.find((current) => current.id === item.id)
  if (!member) return
  uni.showModal({
    title: `删除${member.name}`,
    content: member.role === '配偶' ? '删除配偶后，子女仍会保留在原家族分支。' : '该成员及其下级分支将一起删除，此操作不可撤销。',
    confirmColor: '#c66346',
    success: ({ confirm }) => {
      if (!confirm) return
      const count = removeMember(member.id)
      if (count) uni.showToast({ title: count > 1 ? `已删除 ${count} 位人员` : '人员已删除', icon: 'none' })
    },
  })
}

provide('selectItem', (item) => { selectedMemberId.value = item.id })
provide('addItem', (item) => openAdd(item, 'child'))
provide('addSpouse', (item) => openAdd(item, 'spouse'))
provide('editItem', openEdit)
provide('delItem', confirmDelete)
</script>

<template>
  <page-meta page-style="overflow: hidden;" />
  <AppShell active-tab="home" :viewport-height="viewportHeight" :scrollable="false" @admin="showAdmin = true">
    <view class="ui-section content-wrap chart-page">
      <view class="ui-div chart-heading">
        <view class="ui-div">
          <view class="ui-small chart-label">当前族谱</view>
          <picker v-if="families.length" class="family-picker" :range="names" :value="familyIndex" @change="changeFamily">
            <view class="ui-div family-picker-value">{{ activeFamily?.name }} <view class="ui-span picker-chevron">⌄</view></view>
          </picker>
          <view v-else class="ui-h1">家族组织架构</view>
        </view>
      </view>
      <FamilyTreeList v-if="viewportHeight && activeFamily" :key="selectedFamilyId" :members="members" @add-root="openAdd(null)">
        <template #default="{ treeData }">
          <TreeList :tree-data="treeData" :tree-first="true" :selected-id="selectedMemberId" />
        </template>
      </FamilyTreeList>
      <view v-else-if="!activeFamily" class="ui-div chart-empty"><view class="ui-strong">还没有族谱</view><button class="ghost-button" type="button" @click="goToFamilies">前往我的族谱</button></view>
    </view>
  </AppShell>
  <MemberFormModal v-if="showMemberForm" :member="editingMember" :members="members" :mode="memberFormMode" :initial-parent-id="parentId" :relation-type="relationType" :lock-parent="memberFormMode === 'add' && !!parentId" @close="showMemberForm = false" @save="saveMember" />
  <FeedbackAdminModal v-if="showAdmin" :feedbacks="feedbacks" @close="showAdmin = false" @status="updateFeedbackStatus" />
</template>

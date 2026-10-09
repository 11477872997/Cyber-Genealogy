import { computed, ref } from 'vue'
import { isMemberAlive } from './memberStatus.js'
import { isSpouseMember, relationshipLabel } from './familyTree.js'
import {
  deleteFamilyCloud,
  hasCloudSession,
  scheduleFamilySave,
  setFavoriteCloud,
  submitFeedbackCloud,
  useCloudAccount,
} from './cloudService.js'

const legacyParents = {
  'li-ying': 'li-ji', 'li-yan': 'li-ji', 'li-xia': 'li-ji',
  'chen-fang': 'li-yan', 'li-ming': 'li-yan', 'li-ran': 'li-yan', 'li-xin': 'chen-fang',
}

const exampleMembers = [
  { id: 'li-ji', name: '李济', generation: '第一代', gender: '男', birth: '1938 — 2016', place: '浙江 · 宁波', role: '家族奠基人', color: '#f2b184', avatar: '李', x: 460, y: 94 },
  { id: 'li-ying', name: '李英', generation: '第二代', gender: '女', birth: '1961 —', place: '上海 · 徐汇', role: '长女', color: '#9ac9bc', avatar: '英', x: 188, y: 258 },
  { id: 'li-yan', name: '李岩', generation: '第二代', gender: '男', birth: '1964 —', place: '浙江 · 宁波', role: '长子', color: '#80b3cf', avatar: '岩', x: 462, y: 258 },
  { id: 'li-xia', name: '李霞', generation: '第二代', gender: '女', birth: '1968 —', place: '广东 · 深圳', role: '次女', color: '#d4a8c6', avatar: '霞', x: 736, y: 258 },
  { id: 'chen-fang', name: '陈芳', generation: '第二代', gender: '女', birth: '1965 —', place: '浙江 · 杭州', role: '配偶', color: '#e7b67d', avatar: '芳', x: 608, y: 258 },
  { id: 'li-ming', name: '李明', generation: '第三代', gender: '男', birth: '1990 —', place: '上海 · 徐汇', role: '长孙', color: '#9ab2da', avatar: '明', x: 364, y: 422 },
  { id: 'li-ran', name: '李然', generation: '第三代', gender: '女', birth: '1994 —', place: '北京 · 朝阳', role: '孙女', color: '#c7a7dc', avatar: '然', x: 548, y: 422 },
  { id: 'li-xin', name: '李昕', generation: '第三代', gender: '女', birth: '1998 —', place: '杭州 · 西湖', role: '孙女', color: '#a2c9b3', avatar: '昕', x: 738, y: 422 },
].map((member) => ({ ...member, parentId: legacyParents[member.id] || '', level: Math.round((member.y - 94) / 164) + 1 }))

const exampleFamily = {
  id: 'family-li', name: '李氏家族', surname: '李', ownerName: '示例用户', region: '浙江 · 宁波', description: '从先辈到今天，记录李氏家人的名字与故事。', type: 'local', isExample: true, updatedAt: 0, members: exampleMembers,
  comments: [{ id: 'comment-1', memberId: 'li-ji', user: '家人', content: '愿我们记得从哪里来，也一起把故事写下去。', time: '今天' }],
}

function isExampleFamily(family) {
  return !!family && (family.isExample || family.id === exampleFamily.id)
}

function customizedExample(family) {
  return (family.updatedAt || 0) > 0 || family.name !== exampleFamily.name ||
    JSON.stringify(family.members) !== JSON.stringify(exampleFamily.members) ||
    JSON.stringify(family.comments) !== JSON.stringify(exampleFamily.comments)
}

const families = ref([exampleFamily])
const selectedFamilyId = ref('family-li')
const selectedMemberId = ref('li-ji')
const favorites = ref([])
const feedbacks = ref([])
const profileConfigured = ref(false)
const availableFamilies = computed(() => profileConfigured.value ? families.value.filter((family) => !isExampleFamily(family)) : families.value)
const availableFavorites = computed(() => profileConfigured.value ? favorites.value.filter((family) => !isExampleFamily(family)) : favorites.value)
const keys = {
  families: 'cyber-genealogy:families-v2', selected: 'cyber-genealogy:selected-family',
  favorites: 'cyber-genealogy:favorites', feedbacks: 'cyber-genealogy:feedbacks',
  legacyMembers: 'cyber-genealogy:members', legacyComments: 'cyber-genealogy:comments',
}
let hydrated = false
let storageScope = ''

function read(key) {
  try {
    const value = uni.getStorageSync(key)
    if (value === '' || value == null) return null
    if (typeof value !== 'string') return value
    try { return JSON.parse(value) } catch { return value }
  } catch { return null }
}

function write(key, value) {
  try { uni.setStorageSync(key, JSON.parse(JSON.stringify(value))) } catch { /* Local demo storage is unavailable. */ }
}

function scopedKey(key) {
  return storageScope ? `${key}:user:${storageScope}` : key
}

function stateRead(key) {
  return read(scopedKey(key))
}

function stateWrite(key, value) {
  write(scopedKey(key), value)
}

function hydrate() {
  if (hydrated) return
  hydrated = true
  const savedFamilies = read(keys.families)
  let importedExample = null
  if (Array.isArray(savedFamilies)) {
    families.value = savedFamilies.filter((family) => family?.id && typeof family.name === 'string')
      .map((family) => ({ type: 'local', updatedAt: 0, ...family, members: Array.isArray(family.members) ? family.members : [], comments: Array.isArray(family.comments) ? family.comments : [] }))
    const existingExample = families.value.find((family) => family.id === exampleFamily.id)
    if (existingExample && customizedExample(existingExample)) {
      const baseName = `${existingExample.name}（我的副本）`
      let name = baseName
      while (families.value.some((family) => family.name === name)) name += '副本'
      importedExample = { ...existingExample, id: `family-import-${Date.now()}`, name, isExample: false, createdAt: Date.now(), updatedAt: Date.now() }
      families.value[families.value.indexOf(existingExample)] = { ...exampleFamily }
      families.value.push(importedExample)
      write(keys.families, families.value)
    } else if (existingExample && !existingExample.isExample) {
      families.value[families.value.indexOf(existingExample)] = { ...exampleFamily }
    }
    if (!families.value.some(isExampleFamily)) families.value.unshift(exampleFamily)
  } else {
    const oldMembers = read(keys.legacyMembers)
    const oldComments = read(keys.legacyComments)
    if (Array.isArray(oldMembers)) families.value[0].members = oldMembers.map((member) => ({ ...member, parentId: member.parentId || legacyParents[member.id] || '', level: member.level || Math.round(((member.y || 94) - 94) / 164) + 1 }))
    if (Array.isArray(oldComments)) families.value[0].comments = oldComments
    write(keys.families, families.value)
  }
  const savedFavorites = read(keys.favorites)
  const savedFeedbacks = read(keys.feedbacks)
  if (Array.isArray(savedFavorites)) {
    favorites.value = savedFavorites.map((family) => family.id === exampleFamily.id && importedExample ? importedExample : family)
    if (importedExample) write(keys.favorites, favorites.value)
  }
  if (Array.isArray(savedFeedbacks)) feedbacks.value = savedFeedbacks
  // A legacy local profile is not an authenticated account. Only cloud state may
  // hide the bundled example family.
  profileConfigured.value = false
  const savedId = importedExample && read(keys.selected) === exampleFamily.id ? importedExample.id : read(keys.selected)
  selectedFamilyId.value = availableFamilies.value.some((family) => family.id === savedId) ? savedId : (availableFamilies.value[0]?.id || '')
  selectedMemberId.value = families.value.find((family) => family.id === selectedFamilyId.value)?.members[0]?.id || ''
  if (importedExample) write(keys.selected, selectedFamilyId.value)
}

function setProfileConfigured(configured) {
  profileConfigured.value = !!configured
  if (!availableFamilies.value.some((family) => family.id === selectedFamilyId.value)) {
    selectedFamilyId.value = availableFamilies.value[0]?.id || ''
    selectedMemberId.value = availableFamilies.value[0]?.members[0]?.id || ''
    write(keys.selected, selectedFamilyId.value)
  }
}

function persist() {
  stateWrite(keys.families, families.value)
  stateWrite(keys.selected, selectedFamilyId.value)
  stateWrite(keys.favorites, favorites.value)
  stateWrite(keys.feedbacks, feedbacks.value)
}

function canEdit(family) {
  return !!family && !isExampleFamily(family) && family.canEdit !== false
}

function syncFamily(family) {
  if (canEdit(family)) scheduleFamilySave(family)
}

function currentCreatorName() {
  const { loggedIn, profile } = useCloudAccount()
  return loggedIn.value ? (profile.value?.nickName || '微信用户') : '本机用户'
}

function selectFamily(id) {
  const family = availableFamilies.value.find((item) => item.id === id)
  if (!family) return false
  selectedFamilyId.value = id
  selectedMemberId.value = family.members[0]?.id || ''
  persist()
  return true
}

function createFamily(input) {
  const details = typeof input === 'string' ? { name: input } : input || {}
  const value = details.name?.trim() || ''
  if (!value || families.value.some((family) => !isExampleFamily(family) && family.name === value)) return null
  const family = {
    id: `family-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: value, surname: details.surname?.trim() || '', ownerName: currentCreatorName(),
    region: details.region?.trim() || '', description: details.description?.trim() || '',
    motto: details.motto?.trim() || '', rules: details.rules?.trim() || '',
    type: hasCloudSession() ? 'cloud' : 'local', permission: hasCloudSession() ? 'owner' : undefined,
    canEdit: true, canDelete: true, canShare: true,
    createdAt: Date.now(), updatedAt: Date.now(), members: [], comments: [],
  }
  families.value.push(family)
  persist()
  syncFamily(family)
  return family
}

function updateFamily(id, details) {
  const family = families.value.find((item) => item.id === id)
  const name = details.name?.trim()
  if (!canEdit(family) || !name || families.value.some((item) => !isExampleFamily(item) && item.id !== id && item.name === name)) return false
  Object.assign(family, {
    name, surname: details.surname?.trim() || '',
    region: details.region?.trim() || '', description: details.description?.trim() || '',
    motto: details.motto?.trim() || '', rules: details.rules?.trim() || '', updatedAt: Date.now(),
  })
  persist()
  syncFamily(family)
  return true
}

function removeFamily(id) {
  const index = families.value.findIndex((family) => family.id === id && !isExampleFamily(family) && family.canDelete !== false)
  if (index < 0) return false
  const removed = families.value[index]
  families.value.splice(index, 1)
  favorites.value = favorites.value.filter((family) => family.id !== id)
  if (selectedFamilyId.value === id) {
    selectedFamilyId.value = availableFamilies.value[0]?.id || ''
    selectedMemberId.value = availableFamilies.value[0]?.members[0]?.id || ''
  }
  persist()
  if (removed.type === 'cloud') deleteFamilyCloud(id).catch((error) => console.error('Family cloud delete failed', error))
  return true
}

function memberText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function memberDetails(payload, existing = {}) {
  const surname = memberText(payload.surname, existing.surname || '')
  const givenName = memberText(payload.givenName, existing.givenName || '')
  const name = memberText(payload.name, `${surname}${givenName}`) || existing.name || ''
  return {
    name,
    surname: surname || (name.length > 1 ? name.slice(0, 1) : ''),
    givenName: givenName || (surname && name.startsWith(surname) ? name.slice(surname.length) : name),
    gender: payload.gender || existing.gender || '男',
    rank: memberText(payload.rank, existing.rank || ''),
    birth: memberText(payload.birth, existing.birth || ''),
    isLife: typeof payload.isLife === 'boolean' ? payload.isLife : isMemberAlive(existing),
    place: memberText(payload.place, existing.place || ''),
    courtesyName: memberText(payload.courtesyName, existing.courtesyName || ''),
    alias: memberText(payload.alias, existing.alias || ''),
    memberStatus: memberText(payload.memberStatus, existing.memberStatus || ''),
    note: memberText(payload.note, existing.note || ''),
    linked: typeof payload.linked === 'boolean' ? payload.linked : !!existing.linked,
    bio: memberText(payload.bio, existing.bio || ''),
    ethnicity: memberText(payload.ethnicity, existing.ethnicity || ''),
    bloodType: memberText(payload.bloodType, existing.bloodType || ''),
    residence: memberText(payload.residence, existing.residence || ''),
    school: memberText(payload.school, existing.school || ''),
    education: memberText(payload.education, existing.education || ''),
    company: memberText(payload.company, existing.company || ''),
    position: memberText(payload.position, existing.position || ''),
    avatarUrl: memberText(payload.avatarUrl, existing.avatarUrl || ''),
  }
}

function refreshFamilyRelations(family) {
  const members = family.members
  const byId = new Map(members.map((member) => [member.id, member]))
  const spouseOwners = new Map(members.filter(isSpouseMember).map((member) => [member.id, member.parentId]))
  const childrenByParent = new Map()

  members.filter((member) => !isSpouseMember(member)).forEach((member) => {
    const parentId = spouseOwners.get(member.parentId) || member.parentId
    if (!parentId || !byId.has(parentId)) return
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, [])
    childrenByParent.get(parentId).push(member)
  })

  const visited = new Set()
  const walk = (member, level) => {
    if (!member || visited.has(member.id)) return
    visited.add(member.id)
    member.level = level
    member.generation = `第${level}代`
    member.y = 94 + (level - 1) * 164
    const spouse = members.find((item) => isSpouseMember(item) && item.parentId === member.id)
    if (spouse) {
      visited.add(spouse.id)
      spouse.level = level
      spouse.generation = member.generation
      spouse.y = member.y
    }
    ;(childrenByParent.get(member.id) || []).forEach((child) => walk(child, level + 1))
  }

  members.filter((member) => !isSpouseMember(member) && (!member.parentId || !byId.has(member.parentId)))
    .forEach((member) => walk(member, 1))
  members.filter((member) => !visited.has(member.id) && !isSpouseMember(member))
    .forEach((member) => walk(member, Math.max(1, Number(member.level) || 1)))

  members.forEach((member) => {
    member.role = isSpouseMember(member) ? '配偶' : relationshipLabel(member, members)
    member.avatar = member.name?.slice(0, 1) || ''
  })
}

function addMember(payload) {
  const family = families.value.find((item) => item.id === selectedFamilyId.value)
  const details = memberDetails(payload)
  const name = details.name
  if (!canEdit(family) || !name) return false
  const relationKey = payload.relationKey || (payload.relationType === 'spouse' ? 'spouse' : (family.members.length ? 'child' : 'root'))
  const fixedGender = { father: '男', mother: '女', brother: '男', son: '男', daughter: '女' }[relationKey]
  if (fixedGender) details.gender = fixedGender
  let target = family.members.find((item) => item.id === (payload.targetId || payload.parentId))
  if (family.members.length && !target) return false
  if (target && isSpouseMember(target) && relationKey !== 'child') target = family.members.find((item) => item.id === target.parentId) || target

  let parentId = ''
  let relationType = relationKey === 'spouse' ? 'spouse' : 'child'
  if (relationKey === 'spouse') {
    if (!target || family.members.some((item) => isSpouseMember(item) && item.parentId === target.id)) return false
    parentId = target.id
  } else if (relationKey === 'brother') {
    parentId = target?.parentId || ''
  } else if (relationKey === 'father' || relationKey === 'mother') {
    if (!target) return false
    const structuralParent = family.members.find((item) => item.id === target.parentId)
    if (structuralParent) {
      const parents = [structuralParent, ...family.members.filter((item) => isSpouseMember(item) && item.parentId === structuralParent.id)]
      const expectedGender = relationKey === 'father' ? '男' : '女'
      if (parents.some((item) => item.gender === expectedGender)) return false
      parentId = structuralParent.id
      relationType = 'spouse'
    } else {
      parentId = ''
      relationType = 'child'
    }
  } else if (relationKey !== 'root') {
    parentId = target?.id || ''
  }

  const parent = family.members.find((item) => item.id === parentId)
  const parentLevel = parent ? (Number(parent.level) || 1) : 0
  const level = relationType === 'spouse' ? parentLevel : parentLevel + 1
  const peers = family.members.filter((item) => (Number(item.level) || 1) === level)
  const member = {
    id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...details, parentId, relationType, relationKey, level: Math.max(1, level), generation: `第${Math.max(1, level)}代`,
    role: relationType === 'spouse' ? '配偶' : '家族成员',
    color: level % 2 ? '#d6aa8d' : '#96bec5', avatar: name.slice(0, 1), createdAt: Date.now(),
    x: relationType === 'spouse' ? (parent.x || 460) + 145 : (peers.length ? Math.max(...peers.map((item) => item.x || 460)) + 185 : (parent?.x || 460)),
    y: relationType === 'spouse' ? (parent?.y || 94) : 94 + (Math.max(1, level) - 1) * 164,
  }
  family.members.push(member)
  if ((relationKey === 'father' || relationKey === 'mother') && !target.parentId) target.parentId = member.id
  refreshFamilyRelations(family)
  family.updatedAt = Date.now()
  selectedMemberId.value = member.id
  persist()
  syncFamily(family)
  return true
}

function removeMember(memberId) {
  const family = families.value.find((item) => item.id === selectedFamilyId.value)
  const target = family?.members.find((item) => item.id === memberId)
  if (!canEdit(family) || !target) return 0

  const removedIds = new Set([memberId])
  if (isSpouseMember(target) && target.parentId) {
    family.members.forEach((member) => {
      if (member.parentId === target.id) member.parentId = target.parentId
    })
  } else {
    let foundDescendant = true
    while (foundDescendant) {
      foundDescendant = false
      family.members.forEach((member) => {
        if (removedIds.has(member.parentId) && !removedIds.has(member.id)) {
          removedIds.add(member.id)
          foundDescendant = true
        }
      })
    }
  }

  family.members = family.members.filter((member) => !removedIds.has(member.id))
  refreshFamilyRelations(family)
  family.comments = family.comments.filter((comment) => !removedIds.has(comment.memberId))
  family.updatedAt = Date.now()
  selectedMemberId.value = family.members[0]?.id || ''
  persist()
  syncFamily(family)
  return removedIds.size
}

function updateMember(memberId, payload) {
  const family = families.value.find((item) => item.id === selectedFamilyId.value)
  const member = family?.members.find((item) => item.id === memberId)
  const details = memberDetails(payload, member || {})
  const name = details.name
  if (!member || !canEdit(family) || !name) return false
  Object.assign(member, details)
  refreshFamilyRelations(family)
  family.updatedAt = Date.now()
  persist()
  syncFamily(family)
  return true
}

function addComment(content) {
  const family = families.value.find((item) => item.id === selectedFamilyId.value)
  const value = content.trim()
  if (!canEdit(family) || !selectedMemberId.value || !value) return false
  family.comments.unshift({ id: `comment-${Date.now()}`, memberId: selectedMemberId.value, user: '家人', content: value, time: '刚刚', createdAt: Date.now() })
  family.updatedAt = Date.now()
  persist()
  syncFamily(family)
  return true
}

function addFeedback(payload) {
  const content = payload.content.trim()
  if (!content) return false
  const feedback = { id: `FB-${Date.now()}`, type: payload.type, content, status: '待处理', time: '刚刚', reply: '' }
  feedbacks.value.unshift(feedback)
  persist()
  if (hasCloudSession()) submitFeedbackCloud(payload).catch((error) => console.error('Feedback cloud sync failed', error))
  return true
}

function toggleFavorite(family) {
  const index = favorites.value.findIndex((item) => item.id === family.id)
  if (index >= 0) favorites.value.splice(index, 1)
  else favorites.value.push(family)
  persist()
  setFavoriteCloud(family.id, index < 0).catch((error) => console.error('Favorite cloud sync failed', error))
  return index < 0
}

function updateFeedbackStatus(feedback, status) {
  feedback.status = status
  persist()
}

function exportLocalData() {
  return {
    families: families.value.filter((family) => !isExampleFamily(family) && family.type !== 'cloud').map((family) => JSON.parse(JSON.stringify(family))),
    favoriteIds: favorites.value.filter((family) => !isExampleFamily(family)).map((family) => family.id),
  }
}

function exportAccountCache(uid) {
  if (!uid) return { families: [], favoriteIds: [] }
  const cachedFamilies = read(`${keys.families}:user:${uid}`)
  const cachedFavorites = read(`${keys.favorites}:user:${uid}`)
  const ownedFamilies = Array.isArray(cachedFamilies)
    ? cachedFamilies.filter((family) => !isExampleFamily(family) && !family?.cloudId && family?.canDelete !== false && family?.permission !== 'editor' && family?.permission !== 'viewer')
    : []
  return {
    families: ownedFamilies.map((family) => JSON.parse(JSON.stringify(family))),
    favoriteIds: Array.isArray(cachedFavorites) ? cachedFavorites.map((family) => family?.id).filter(Boolean) : [],
  }
}

function applyCloudState(uid, payload) {
  storageScope = uid || ''
  const incoming = Array.isArray(payload?.families) ? payload.families.filter((family) => !isExampleFamily(family)) : []
  families.value = incoming.map((family) => ({
    ...family,
    type: 'cloud',
    members: Array.isArray(family.members) ? family.members : [],
    comments: Array.isArray(family.comments) ? family.comments : [],
  }))
  const favoriteIds = new Set(Array.isArray(payload?.favoriteIds) ? payload.favoriteIds : [])
  favorites.value = families.value.filter((family) => favoriteIds.has(family.id))
  if (Array.isArray(payload?.feedbacks)) feedbacks.value = payload.feedbacks
  profileConfigured.value = true
  const savedId = stateRead(keys.selected)
  selectedFamilyId.value = families.value.some((family) => family.id === savedId) ? savedId : (families.value[0]?.id || '')
  selectedMemberId.value = families.value.find((family) => family.id === selectedFamilyId.value)?.members[0]?.id || ''
  persist()
}

function clearMigratedGuestData() {
  write(keys.families, [{ ...exampleFamily }])
  write(keys.selected, exampleFamily.id)
  write(keys.favorites, [])
  write(keys.feedbacks, [])
}

function resetToGuest() {
  storageScope = ''
  const storedFamilies = read(keys.families)
  families.value = Array.isArray(storedFamilies) && storedFamilies.length
    ? storedFamilies.map((family) => ({ ...family, members: family.members || [], comments: family.comments || [] }))
    : [{ ...exampleFamily }]
  if (!families.value.some(isExampleFamily)) families.value.unshift({ ...exampleFamily })
  favorites.value = Array.isArray(read(keys.favorites)) ? read(keys.favorites) : []
  feedbacks.value = Array.isArray(read(keys.feedbacks)) ? read(keys.feedbacks) : []
  profileConfigured.value = false
  const example = families.value.find(isExampleFamily)
  const initialFamily = example || families.value[0]
  selectedFamilyId.value = initialFamily?.id || ''
  selectedMemberId.value = initialFamily?.members[0]?.id || ''
}

export function useGenealogyStore() {
  hydrate()
  const activeFamily = computed(() => availableFamilies.value.find((family) => family.id === selectedFamilyId.value) || null)
  const members = computed(() => activeFamily.value?.members || [])
  const comments = computed(() => activeFamily.value?.comments || [])
  const selectedMember = computed(() => members.value.find((member) => member.id === selectedMemberId.value) || members.value[0] || null)
  const selectedComments = computed(() => comments.value.filter((comment) => comment.memberId === selectedMemberId.value))
  const myFamilies = computed(() => availableFamilies.value.map((family) => ({ ...family, memberCount: family.members.length })))
  return {
    families: availableFamilies, activeFamily, selectedFamilyId, members, comments, favorites: availableFavorites, feedbacks,
    selectedMemberId, selectedMember, selectedComments, myFamilies,
    createFamily, updateFamily, removeFamily, selectFamily, setProfileConfigured, addMember, updateMember, removeMember, addComment,
    addFeedback, toggleFavorite, updateFeedbackStatus, exportLocalData, exportAccountCache, applyCloudState, clearMigratedGuestData, resetToGuest,
  }
}

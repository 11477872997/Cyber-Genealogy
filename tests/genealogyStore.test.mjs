import assert from 'node:assert/strict'
import test from 'node:test'

const storage = new Map()
globalThis.uni = {
  getStorageSync: (key) => storage.get(key) ?? '',
  setStorageSync: (key, value) => storage.set(key, value),
  removeStorageSync: (key) => storage.delete(key),
}

const { useGenealogyStore } = await import('../services/genealogyStore.js')
const { buildFamilyTree } = await import('../services/familyTree.js')
const { toFgTree } = await import('../services/fgTreeAdapter.js')
const { flattenFgTree, layoutFgTree } = await import('../uni_modules/fg-tree/components/fg-tree/layout.js')
const { isMemberAlive } = await import('../services/memberStatus.js')
const { restoreCloudSession } = await import('../services/cloudSession.js')
const { createShareCloud } = await import('../services/cloudService.js')

test('Vue3 fg-tree adapter nests spouses and children without mutating members', () => {
  const members = [
    { id: 'root', name: '祖', role: '始祖', birth: '1938 — 2016', x: 1 },
    { id: 'wife', name: '芳', role: '配偶', parentId: 'root', x: 2 },
    { id: 'son', name: '建', role: '长子', parentId: 'wife', x: 3 },
    { id: 'granddaughter', name: '芸', role: '孙女', parentId: 'son', x: 4 },
  ]
  const before = JSON.stringify(members)
  const result = toFgTree(members)
  assert.deepEqual(result.map((node) => node.id), ['root'])
  assert.equal(result[0].isLife, false)
  assert.equal(result[0].spouse[0].id, 'wife')
  assert.equal(result[0].children[0].id, 'son')
  assert.equal(result[0].children[0].children[0].id, 'granddaughter')
  const layout = layoutFgTree(result)
  assert.ok(layout[0].layoutWidth >= layout[0].children[0].layoutWidth)
  assert.equal(result[0].layoutWidth, undefined)
  assert.equal(JSON.stringify(members), before)
  assert.deepEqual(toFgTree([]), [])
})

test('fg-tree accepts the original plugin list shape without layout metadata', () => {
  const original = [{ id: 'a', name: '祖', spouse: [{ id: 'b', name: '配' }], children: [
    { id: 'c', name: '子', children: [{ id: 'e', name: '孙' }, { id: 'f', name: '孙女' }] },
    { id: 'd', name: '女' },
  ] }]
  const prepared = layoutFgTree(original)
  assert.equal(prepared[0].layoutWidth, 336)
  assert.equal(prepared[0].children[0].layoutWidth, 224)
  const flattened = flattenFgTree(original)
  assert.equal(flattened.cards.length, 6)
  assert.equal(flattened.folds.length, 2)
  assert.ok(flattened.lines.length >= 6)
  assert.deepEqual(flattened.cards.map((item) => item.id), ['a', 'b', 'c', 'e', 'f', 'd'])
  assert.equal(original[0].layoutWidth, undefined)
  assert.deepEqual(layoutFgTree([]), [])
})

test('living status persists and overrides legacy birth-year inference', () => {
  assert.equal(isMemberAlive({ birth: '1938 — 2016' }), false)
  assert.equal(isMemberAlive({ birth: '1938 — 2016', isLife: true }), true)
  const store = useGenealogyStore()
  const family = store.createFamily('状态记录测试')
  assert.ok(store.selectFamily(family.id))
  assert.ok(store.addMember({ name: '甲', birth: '2000 —', isLife: false }))
  const memberId = store.selectedMemberId.value
  assert.equal(toFgTree(store.members.value)[0].isLife, false)
  assert.ok(store.updateMember(memberId, { name: '甲', birth: '2000 —', isLife: true }))
  assert.equal(toFgTree(store.members.value)[0].isLife, true)
  assert.equal(storage.get('cyber-genealogy:families-v2').find((item) => item.id === family.id).members[0].isLife, true)
  assert.ok(store.selectFamily('family-li'))
  assert.equal(toFgTree(store.members.value)[0].isLife, false)
})

test('separate families keep their own members and comments', () => {
  const store = useGenealogyStore()
  const originalFamilyCount = store.families.value.length
  const originalCount = store.members.value.length
  const originalComments = store.comments.value.length
  const family = store.createFamily('测试族谱')
  assert.ok(family)
  assert.equal(store.createFamily('测试族谱'), null)
  assert.ok(store.selectFamily(family.id))
  assert.equal(store.members.value.length, 0)
  assert.ok(store.addMember({ name: '甲', gender: '女', role: '始祖' }))
  const rootId = store.selectedMemberId.value
  assert.ok(store.addMember({ name: '乙', gender: '男', role: '子', parentId: rootId }))
  assert.equal(store.members.value[1].parentId, rootId)
  assert.ok(store.addComment('本族谱留言'))
  assert.equal(store.comments.value.length, 1)
  assert.ok(store.selectFamily('family-li'))
  assert.equal(store.members.value.length, originalCount)
  assert.equal(store.comments.value.length, originalComments)
  assert.equal(storage.get('cyber-genealogy:selected-family'), 'family-li')
  assert.equal(storage.get('cyber-genealogy:families-v2').length, originalFamilyCount + 1)
  assert.ok(store.selectFamily(family.id))
  assert.deepEqual(store.members.value.map((person) => person.name), ['甲', '乙'])
  assert.equal(store.selectedComments.value.length, 0)
})

test('spouses stay on the same generation and branch deletion is isolated', () => {
  const store = useGenealogyStore()
  const family = store.createFamily('关系操作测试')
  assert.ok(store.selectFamily(family.id))
  assert.ok(store.addMember({ name: '根', gender: '男', role: '第一代' }))
  const rootId = store.selectedMemberId.value
  assert.ok(store.addMember({ name: '配', gender: '女', parentId: rootId, relationType: 'spouse' }))
  const spouse = store.members.value.find((member) => member.role === '配偶')
  assert.equal(spouse.level, store.members.value.find((member) => member.id === rootId).level)
  assert.equal(store.addMember({ name: '另一个配偶', gender: '女', parentId: rootId, relationType: 'spouse' }), false)
  assert.ok(store.addMember({ name: '子', gender: '男', role: '子级', parentId: spouse.id }))
  const tree = buildFamilyTree(store.members.value)
  assert.equal(tree.length, 1)
  assert.equal(tree[0].spouse.id, spouse.id)
  assert.deepEqual(tree[0].child.map((child) => child.name), ['子'])
  assert.equal(store.removeMember(spouse.id), 1)
  assert.equal(store.members.value.find((member) => member.name === '子').parentId, rootId)
  assert.equal(store.removeMember(rootId), 2)
  assert.equal(store.members.value.length, 0)
  assert.ok(store.selectFamily('family-li'))
  assert.equal(store.members.value.length, 8)
})

test('family metadata persists across selection and updates without changing another family', () => {
  const store = useGenealogyStore()
  const family = store.createFamily({ name: '陈氏族谱', surname: '陈', region: '福建 · 泉州', description: '家族故事' })
  assert.equal(family.surname, '陈')
  assert.equal(family.ownerName, '本机用户')
  assert.equal('contact' in family, false)
  assert.equal(family.region, '福建 · 泉州')
  assert.ok(family.createdAt > 0)
  assert.ok(store.selectFamily(family.id))
  assert.ok(store.addMember({ name: '陈明', gender: '男', role: '始祖' }))
  const edited = store.updateFamily(family.id, { name: '陈氏家谱', surname: '陈', region: '福建 · 厦门', description: '新记录', motto: '和睦' })
  assert.equal(edited, true)
  assert.equal(store.activeFamily.value.name, '陈氏家谱')
  assert.equal(store.activeFamily.value.members.length, 1)
  assert.ok(store.createFamily('已用名称'))
  assert.equal(store.updateFamily(family.id, { name: '已用名称' }), false)
  assert.ok(store.selectFamily('family-li'))
  assert.equal(store.activeFamily.value.name, '李氏家族')
  assert.equal(store.activeFamily.value.members.length, 8)
  const saved = storage.get('cyber-genealogy:families-v2').find((item) => item.id === family.id)
  assert.equal(saved.region, '福建 · 厦门')
  assert.equal(saved.motto, '和睦')
})

test('example family is read-only and hidden only while account data is active', () => {
  const store = useGenealogyStore()
  store.setProfileConfigured(false)
  assert.ok(store.selectFamily('family-li'))
  const count = store.members.value.length
  assert.equal(store.updateFamily('family-li', { name: '改名' }), false)
  assert.equal(store.removeFamily('family-li'), false)
  assert.equal(store.addMember({ name: '新增', parentId: 'li-ji' }), false)
  assert.equal(store.updateMember('li-ji', { name: '改名' }), false)
  assert.equal(store.removeMember('li-ji'), 0)
  assert.equal(store.addComment('示例留言'), false)
  assert.equal(store.members.value.length, count)
  store.setProfileConfigured(true)
  assert.equal(store.families.value.some((family) => family.isExample), false)
  assert.equal(store.selectFamily('family-li'), false)
  assert.notEqual(store.selectedFamilyId.value, 'family-li')
  store.setProfileConfigured(false)
  assert.equal(store.families.value.some((family) => family.id === 'family-li'), true)
})

test('cold boot without a cloud session restores and selects the guest example', async () => {
  const store = useGenealogyStore()
  store.setProfileConfigured(true)
  assert.equal(store.families.value.some((family) => family.isExample), false)
  assert.equal(await restoreCloudSession(), null)
  assert.equal(store.families.value.some((family) => family.id === 'family-li' && family.isExample), true)
  assert.equal(store.selectedFamilyId.value, 'family-li')
  assert.equal(store.members.value.length, 8)
})

test('account cache recovery includes only owned families never confirmed by cloud', () => {
  const store = useGenealogyStore()
  const uid = 'recovery-user'
  storage.set(`cyber-genealogy:families-v2:user:${uid}`, [
    { id: 'pending-family', name: '待补传族谱', permission: 'owner', canDelete: true, members: [], comments: [] },
    { id: 'synced-family', cloudId: 'cloud-1', name: '已同步族谱', permission: 'owner', canDelete: true, members: [], comments: [] },
    { id: 'shared-family', name: '共享族谱', permission: 'editor', canDelete: false, members: [], comments: [] },
  ])
  storage.set(`cyber-genealogy:favorites:user:${uid}`, [{ id: 'pending-family' }])
  const cache = store.exportAccountCache(uid)
  assert.deepEqual(cache.families.map((family) => family.id), ['pending-family'])
  assert.deepEqual(cache.favoriteIds, ['pending-family'])
})

test('cloud business errors reject share generation instead of creating an empty path', async () => {
  globalThis.uniCloud = {
    importObject: () => ({
      createShare: async () => ({ errCode: 'GENEALOGY_OWNER_REQUIRED', errMsg: '只有族谱创建者可以分享' }),
    }),
  }
  await assert.rejects(
    () => createShareCloud('family-test', 'viewer'),
    (error) => error.errCode === 'GENEALOGY_OWNER_REQUIRED' && error.message === '只有族谱创建者可以分享',
  )
  delete globalThis.uniCloud
})

test('deleting a family removes its members, comments, favorites, and current selection', () => {
  const store = useGenealogyStore()
  const family = store.createFamily('待删除族谱')
  assert.ok(store.selectFamily(family.id))
  assert.ok(store.addMember({ name: '家人' }))
  assert.ok(store.addComment('留言'))
  assert.equal(store.toggleFavorite(family), true)
  assert.equal(store.removeFamily(family.id), true)
  assert.equal(store.removeFamily(family.id), false)
  assert.equal(store.families.value.some((item) => item.id === family.id), false)
  assert.equal(store.favorites.value.some((item) => item.id === family.id), false)
  assert.notEqual(store.selectedFamilyId.value, family.id)
  assert.equal(storage.get('cyber-genealogy:families-v2').some((item) => item.id === family.id), false)
  assert.equal(storage.get('cyber-genealogy:favorites').some((item) => item.id === family.id), false)
})

test('previous edits to the example become a personal copy during hydration', async () => {
  const legacy = {
    id: 'family-li', name: '李氏家族', isExample: true, type: 'local', updatedAt: 123,
    members: [{ id: 'edited-member', name: '录入的家人' }], comments: [{ id: 'c', memberId: 'edited-member', content: '回忆' }],
  }
  storage.set('cyber-genealogy:families-v2', [legacy])
  storage.set('cyber-genealogy:selected-family', 'family-li')
  storage.set('cyber-genealogy:favorites', [legacy])
  storage.set('cyber-genealogy:profile', { nickName: '家人' })
  const { useGenealogyStore: useFreshStore } = await import(`../services/genealogyStore.js?migration=${Date.now()}`)
  const fresh = useFreshStore()
  const copy = fresh.families.value.find((family) => family.members.some((person) => person.id === 'edited-member'))
  assert.ok(copy)
  assert.notEqual(copy.id, 'family-li')
  assert.equal(copy.isExample, false)
  assert.equal(fresh.selectedFamilyId.value, copy.id)
  assert.equal(fresh.favorites.value[0].id, copy.id)
  assert.equal(fresh.families.value.some((family) => family.isExample), true)
  assert.equal(fresh.families.value.find((family) => family.isExample).members.length, 8)
  assert.equal(storage.get('cyber-genealogy:families-v2').length, 2)
})

test('cloud viewer permission blocks local mutation and owner-only deletion', async () => {
  const { useGenealogyStore: useCloudStore } = await import(`../services/genealogyStore.js?permissions=${Date.now()}`)
  const cloudStore = useCloudStore()
  const viewerFamily = {
    id: 'family-shared-viewer', name: '共享查看族谱', type: 'cloud', permission: 'viewer',
    canEdit: false, canDelete: false, canShare: false, members: [{ id: 'member-viewer', name: '只读成员' }], comments: [],
  }
  const ownerFamily = {
    id: 'family-owned-cloud', name: '我的云端族谱', type: 'cloud', permission: 'owner',
    canEdit: true, canDelete: true, canShare: true, members: [], comments: [],
  }
  const leakedExample = {
    id: 'family-li', name: '旧版本误同步的示例', type: 'cloud', permission: 'owner',
    canEdit: true, canDelete: true, canShare: true, members: [], comments: [],
  }
  cloudStore.applyCloudState('uid-test', { families: [leakedExample, viewerFamily, ownerFamily], favoriteIds: ['family-li', 'family-shared-viewer'] })
  assert.equal(cloudStore.families.value.some((family) => family.isExample), false)
  assert.equal(cloudStore.families.value.some((family) => family.id === 'family-li'), false)
  assert.equal(cloudStore.favorites.value[0].id, viewerFamily.id)
  assert.ok(cloudStore.selectFamily(viewerFamily.id))
  assert.equal(cloudStore.updateFamily(viewerFamily.id, { name: '越权修改' }), false)
  assert.equal(cloudStore.addMember({ name: '越权新增' }), false)
  assert.equal(cloudStore.removeMember('member-viewer'), 0)
  assert.equal(cloudStore.removeFamily(viewerFamily.id), false)
  assert.ok(cloudStore.selectFamily(ownerFamily.id))
  assert.equal(cloudStore.updateFamily(ownerFamily.id, { name: '允许修改' }), true)
  assert.equal(cloudStore.removeFamily(ownerFamily.id), true)
})

test('relation actions rebuild parent, spouse, and child generations with automatic labels', () => {
  const store = useGenealogyStore()
  const family = store.createFamily({ name: '自动关系测试', surname: '周' })
  assert.ok(store.selectFamily(family.id))
  assert.ok(store.addMember({ surname: '周', givenName: '明', relationKey: 'root', gender: '男' }))
  const originalId = store.selectedMemberId.value
  assert.ok(store.addMember({ surname: '周', givenName: '父', relationKey: 'father', targetId: originalId }))
  const fatherId = store.selectedMemberId.value
  assert.equal(store.members.value.find((item) => item.id === originalId).parentId, fatherId)
  assert.equal(store.members.value.find((item) => item.id === originalId).generation, '第2代')
  assert.ok(store.addMember({ surname: '吴', givenName: '母', relationKey: 'mother', targetId: originalId }))
  const mother = store.members.value.find((item) => item.name === '吴母')
  assert.equal(mother.gender, '女')
  assert.equal(mother.relationType, 'spouse')
  assert.equal(mother.parentId, fatherId)
  assert.ok(store.addMember({
    surname: '周', givenName: '兰', relationKey: 'daughter', targetId: originalId,
    note: '小女儿', ethnicity: '汉', education: '本科', avatarUrl: 'data:image/jpeg;base64,AA==',
  }))
  const daughter = store.members.value.find((item) => item.name === '周兰')
  assert.equal(daughter.gender, '女')
  assert.equal(daughter.generation, '第3代')
  assert.equal(daughter.note, '小女儿')
  assert.equal(daughter.education, '本科')
  const tree = toFgTree(store.members.value)
  assert.equal(tree[0].relation, '始祖')
  assert.equal(tree[0].spouse[0].relation, '妻子')
  assert.equal(tree[0].children[0].children[0].relation, '长女')
})

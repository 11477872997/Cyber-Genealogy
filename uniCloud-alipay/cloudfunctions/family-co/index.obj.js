'use strict'

const crypto = require('crypto')
const uniIdCommon = require('uni-id-common')

const db = uniCloud.database()
const command = db.command
const familiesCollection = db.collection('genealogy-families')
const permissionsCollection = db.collection('genealogy-permissions')
const sharesCollection = db.collection('genealogy-shares')
const favoritesCollection = db.collection('genealogy-favorites')
const feedbackCollection = db.collection('genealogy-feedback')
const usersCollection = db.collection('uni-id-users')
const EXAMPLE_FAMILY_ID = 'family-li'

function fail(errCode, errMsg) {
  throw { errCode, errMsg }
}

function text(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function clientId(value) {
  const result = text(value, 80)
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(result)) fail('GENEALOGY_INVALID_ID', '族谱标识无效')
  return result
}

function cleanMembers(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 500).map((member) => ({
    id: text(member && member.id, 80),
    name: text(member && member.name, 30),
    surname: text(member && member.surname, 12),
    givenName: text(member && member.givenName, 20),
    parentId: text(member && member.parentId, 80),
    relationType: text(member && member.relationType, 20),
    relationKey: text(member && member.relationKey, 20),
    level: Math.max(1, Math.min(99, Number(member && member.level) || 1)),
    generation: text(member && member.generation, 20),
    gender: text(member && member.gender, 8),
    rank: text(member && member.rank, 12),
    birth: text(member && member.birth, 40),
    isLife: member && typeof member.isLife === 'boolean' ? member.isLife : true,
    place: text(member && member.place, 80),
    role: text(member && member.role, 30),
    courtesyName: text(member && member.courtesyName, 30),
    alias: text(member && member.alias, 30),
    memberStatus: text(member && member.memberStatus, 30),
    note: text(member && member.note, 50),
    linked: !!(member && member.linked),
    bio: text(member && member.bio, 500),
    ethnicity: text(member && member.ethnicity, 20),
    bloodType: text(member && member.bloodType, 10),
    residence: text(member && member.residence, 80),
    school: text(member && member.school, 80),
    education: text(member && member.education, 30),
    company: text(member && member.company, 80),
    position: text(member && member.position, 50),
    color: text(member && member.color, 20),
    avatar: text(member && member.avatar, 200000),
    avatarUrl: text(member && member.avatarUrl, 180000),
    createdAt: Number(member && member.createdAt) || Date.now(),
    x: Number(member && member.x) || 0,
    y: Number(member && member.y) || 0,
  })).filter((member) => member.id && member.name)
}

function cleanComments(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 2000).map((comment) => ({
    id: text(comment && comment.id, 80),
    memberId: text(comment && comment.memberId, 80),
    user: text(comment && comment.user, 30),
    content: text(comment && comment.content, 200),
    time: text(comment && comment.time, 30),
    createdAt: Number(comment && comment.createdAt) || Date.now(),
  })).filter((comment) => comment.id && comment.memberId && comment.content)
}

function cleanFamily(input) {
  const raw = input || {}
  const name = text(raw.name, 30)
  if (!name) fail('GENEALOGY_NAME_REQUIRED', '请填写族谱名称')
  const familyClientId = clientId(raw.id || raw.clientId)
  if (familyClientId === EXAMPLE_FAMILY_ID) fail('GENEALOGY_EXAMPLE_READ_ONLY', '示例族谱不能同步到账号')
  const result = {
    client_id: familyClientId,
    name,
    surname: text(raw.surname, 12),
    region: text(raw.region, 50),
    description: text(raw.description, 500),
    motto: text(raw.motto, 300),
    rules: text(raw.rules, 300),
    members: cleanMembers(raw.members),
    comments: cleanComments(raw.comments),
  }
  if (Buffer.byteLength(JSON.stringify(result), 'utf8') > 900 * 1024) {
    fail('GENEALOGY_DATA_TOO_LARGE', '族谱数据过大，请减少图片或成员资料后重试')
  }
  return result
}

async function ownerNamesFor(documents) {
  const ownerIds = Array.from(new Set(documents.map((item) => item && item.owner_uid).filter(Boolean)))
  if (!ownerIds.length) return new Map()
  const result = await usersCollection.where({ _id: command.in(ownerIds) }).get()
  return new Map(result.data.map((user) => [user._id, text(user.nickname, 30) || '微信用户']))
}

function toClientFamily(doc, role, ownerName) {
  return {
    id: doc.client_id,
    cloudId: doc._id,
    name: doc.name,
    surname: doc.surname || '',
    ownerName: ownerName || '微信用户',
    region: doc.region || '',
    description: doc.description || '',
    motto: doc.motto || '',
    rules: doc.rules || '',
    members: Array.isArray(doc.members) ? doc.members : [],
    comments: Array.isArray(doc.comments) ? doc.comments : [],
    createdAt: doc.created_at || 0,
    updatedAt: doc.updated_at || 0,
    version: doc.version || 1,
    type: 'cloud',
    permission: role,
    canEdit: role === 'owner' || role === 'editor',
    canDelete: role === 'owner',
    canShare: role === 'owner',
  }
}

async function findFamily(value) {
  const result = await familiesCollection.where({ client_id: clientId(value) }).limit(1).get()
  return result.data[0] || null
}

async function roleFor(doc, uid) {
  if (doc.owner_uid === uid) return 'owner'
  const result = await permissionsCollection.where({ family_id: doc._id, user_id: uid, status: 'active' }).limit(1).get()
  return result.data[0] && result.data[0].role
}

async function requireFamily(value, uid, requiredRole) {
  const doc = await findFamily(value)
  if (!doc) fail('GENEALOGY_NOT_FOUND', '族谱不存在或已被删除')
  const role = await roleFor(doc, uid)
  if (!role) fail('GENEALOGY_FORBIDDEN', '你没有查看这份族谱的权限')
  if (requiredRole === 'editor' && role !== 'owner' && role !== 'editor') {
    fail('GENEALOGY_READ_ONLY', '这份族谱仅允许查看')
  }
  if (requiredRole === 'owner' && role !== 'owner') {
    fail('GENEALOGY_OWNER_REQUIRED', '只有族谱创建者可以执行此操作')
  }
  return { doc, role }
}

async function upsertOwnedFamily(uid, input) {
  const family = cleanFamily(input)
  const existing = await familiesCollection.where({ client_id: family.client_id }).limit(1).get()
  const now = Date.now()
  if (existing.data[0]) {
    if (existing.data[0].owner_uid !== uid) fail('GENEALOGY_ID_CONFLICT', '族谱标识冲突')
    await familiesCollection.doc(existing.data[0]._id).update({
      ...family,
      updated_at: now,
      version: (existing.data[0].version || 1) + 1,
    })
    return findFamily(family.client_id)
  }
  const duplicate = await familiesCollection.where({ owner_uid: uid, name: family.name }).limit(1).get()
  if (duplicate.data[0]) return duplicate.data[0]
  const added = await familiesCollection.add({
    ...family,
    owner_uid: uid,
    created_at: Number(input.createdAt) || now,
    updated_at: Number(input.updatedAt) || now,
    version: 1,
  })
  const created = await familiesCollection.doc(added.id).get()
  return created.data[0]
}

module.exports = {
  async _before() {
    this.response = {}
    this.uniIdCommon = uniIdCommon.createInstance({ clientInfo: this.getClientInfo() })
    const auth = await this.uniIdCommon.checkToken(this.getUniIdToken())
    if (!auth || auth.errCode) fail(auth && auth.errCode || 'uni-id-check-token-failed', auth && auth.errMsg || '请先登录')
    this.authInfo = auth
    this.uid = auth.uid
    if (auth.token) this.response.newToken = { token: auth.token, tokenExpired: auth.tokenExpired }
  },

  _after(error, result) {
    // Cloud objects must return business errors so the client can read errCode.
    // Throwing a plain object is wrapped as FUNCTION_EXCUTE_ERROR by local debug.
    if (error) {
      if (error.errCode) return error
      throw error
    }
    return Object.assign(this.response, result || {})
  },

  async bootstrap() {
    const ownedResult = await familiesCollection.where({ owner_uid: this.uid }).get()
    const permissionResult = await permissionsCollection.where({ user_id: this.uid, status: 'active' }).get()
    const roleMap = {}
    permissionResult.data.forEach((item) => { roleMap[item.family_id] = item.role })
    const sharedIds = Object.keys(roleMap)
    let shared = []
    if (sharedIds.length) {
      const sharedResult = await familiesCollection.where({ _id: command.in(sharedIds) }).get()
      shared = sharedResult.data
    }
    const owned = ownedResult.data.filter((item) => item.client_id !== EXAMPLE_FAMILY_ID)
    shared = shared.filter((item) => item.client_id !== EXAMPLE_FAMILY_ID)
    const ownerNames = await ownerNamesFor([...owned, ...shared])
    const familyMap = new Map()
    owned.forEach((item) => familyMap.set(item._id, toClientFamily(item, 'owner', ownerNames.get(item.owner_uid))))
    shared.forEach((item) => familyMap.set(item._id, toClientFamily(item, roleMap[item._id], ownerNames.get(item.owner_uid))))

    const favoriteResult = await favoritesCollection.where({ user_id: this.uid }).get()
    const favoriteIds = new Set(favoriteResult.data.map((item) => item.family_id))
    const userResult = await usersCollection.doc(this.uid).get()
    const user = userResult.data[0] || {}

    return {
      families: Array.from(familyMap.values()),
      favoriteIds: Array.from(familyMap.values()).filter((item) => favoriteIds.has(item.cloudId)).map((item) => item.id),
      profile: { nickName: user.nickname || '', avatarUrl: user.avatar || '' },
      uid: this.uid,
    }
  },

  async migrateLocal(payload = {}) {
    const source = Array.isArray(payload.families) ? payload.families : []
    const favoriteIds = new Set(Array.isArray(payload.favoriteIds) ? payload.favoriteIds : [])
    let imported = 0
    for (const family of source.slice(0, 20)) {
      if (!family || family.isExample || family.id === EXAMPLE_FAMILY_ID || family.clientId === EXAMPLE_FAMILY_ID) continue
      const saved = await upsertOwnedFamily(this.uid, family)
      if (favoriteIds.has(family.id)) {
        const favorite = await favoritesCollection.where({ user_id: this.uid, family_id: saved._id }).limit(1).get()
        if (!favorite.data[0]) await favoritesCollection.add({ user_id: this.uid, family_id: saved._id, created_at: Date.now() })
      }
      imported += 1
    }
    return { imported }
  },

  async saveFamily(input) {
    const family = cleanFamily(input)
    const existing = await findFamily(family.client_id)
    if (!existing) {
      const created = await upsertOwnedFamily(this.uid, input)
      const ownerNames = await ownerNamesFor([created])
      return { family: toClientFamily(created, 'owner', ownerNames.get(created.owner_uid)) }
    }
    const access = await requireFamily(family.client_id, this.uid, 'editor')
    const now = Date.now()
    await familiesCollection.doc(access.doc._id).update({
      ...family,
      updated_at: now,
      version: (access.doc.version || 1) + 1,
    })
    const updated = await findFamily(family.client_id)
    const ownerNames = await ownerNamesFor([updated])
    return { family: toClientFamily(updated, access.role, ownerNames.get(updated.owner_uid)) }
  },

  async deleteFamily(value) {
    const access = await requireFamily(value, this.uid, 'owner')
    await Promise.all([
      permissionsCollection.where({ family_id: access.doc._id }).remove(),
      sharesCollection.where({ family_id: access.doc._id }).remove(),
      favoritesCollection.where({ family_id: access.doc._id }).remove(),
    ])
    await familiesCollection.doc(access.doc._id).remove()
    return { deleted: true }
  },

  async setFavorite(value, favorite) {
    const access = await requireFamily(value, this.uid)
    const existing = await favoritesCollection.where({ user_id: this.uid, family_id: access.doc._id }).limit(1).get()
    if (favorite && !existing.data[0]) {
      await favoritesCollection.add({ user_id: this.uid, family_id: access.doc._id, created_at: Date.now() })
    } else if (!favorite && existing.data[0]) {
      await favoritesCollection.doc(existing.data[0]._id).remove()
    }
    return { favorite: !!favorite }
  },

  async createShare(value, requestedRole) {
    const access = await requireFamily(value, this.uid, 'owner')
    const role = requestedRole === 'editor' ? 'editor' : 'viewer'
    const token = crypto.randomBytes(24).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await sharesCollection.add({
      family_id: access.doc._id,
      token_hash: tokenHash,
      role,
      created_by: this.uid,
      created_at: Date.now(),
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
      revoked: false,
    })
    return { token, role, familyName: access.doc.name }
  },

  async acceptShare(tokenValue) {
    const token = text(tokenValue, 100)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const result = await sharesCollection.where({ token_hash: tokenHash, revoked: false }).limit(1).get()
    const share = result.data[0]
    if (!share || share.expires_at < Date.now()) fail('GENEALOGY_SHARE_INVALID', '分享已失效，请联系族谱创建者重新分享')
    const familyResult = await familiesCollection.doc(share.family_id).get()
    const family = familyResult.data[0]
    if (!family) fail('GENEALOGY_NOT_FOUND', '这份族谱已被删除')
    if (family.owner_uid !== this.uid) {
      const existing = await permissionsCollection.where({ family_id: family._id, user_id: this.uid }).limit(1).get()
      const nextRole = existing.data[0] && existing.data[0].role === 'editor' ? 'editor' : share.role
      if (existing.data[0]) {
        await permissionsCollection.doc(existing.data[0]._id).update({ role: nextRole, status: 'active', updated_at: Date.now() })
      } else {
        await permissionsCollection.add({ family_id: family._id, user_id: this.uid, role: nextRole, status: 'active', created_at: Date.now() })
      }
    }
    const role = family.owner_uid === this.uid ? 'owner' : share.role
    const ownerNames = await ownerNamesFor([family])
    return { family: toClientFamily(family, role, ownerNames.get(family.owner_uid)) }
  },

  async saveProfile(input = {}) {
    const nickname = text(input.nickName, 30) || '微信用户'
    const avatar = text(input.avatarUrl, 180000)
    if (avatar && !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(avatar) && !/^https?:\/\//.test(avatar)) {
      fail('GENEALOGY_AVATAR_INVALID', '头像格式无效')
    }
    await usersCollection.doc(this.uid).update({ nickname, avatar })
    return { profile: { nickName: nickname, avatarUrl: avatar } }
  },

  async submitFeedback(input = {}) {
    const content = text(input.content, 500)
    if (!content) fail('GENEALOGY_FEEDBACK_REQUIRED', '请填写反馈内容')
    const record = {
      user_id: this.uid,
      type: text(input.type, 20) || '建议',
      content,
      contact: text(input.contact, 80),
      status: '待处理',
      reply: '',
      created_at: Date.now(),
      updated_at: Date.now(),
    }
    const added = await feedbackCollection.add(record)
    return { feedback: { id: added.id, ...record } }
  },

  async listMyFeedback() {
    const result = await feedbackCollection.where({ user_id: this.uid }).orderBy('created_at', 'desc').limit(100).get()
    return { feedbacks: result.data.map((item) => ({ id: item._id, ...item })) }
  },

  async listFeedbacks() {
    const roles = this.authInfo.role || []
    if (!roles.includes('admin')) fail('GENEALOGY_ADMIN_REQUIRED', '仅管理员可以查看全部反馈')
    const result = await feedbackCollection.orderBy('created_at', 'desc').limit(200).get()
    return { feedbacks: result.data.map((item) => ({ id: item._id, ...item })) }
  },

  async updateFeedback(feedbackId, status) {
    const roles = this.authInfo.role || []
    if (!roles.includes('admin')) fail('GENEALOGY_ADMIN_REQUIRED', '仅管理员可以处理反馈')
    const nextStatus = ['待处理', '处理中', '已解决'].includes(status) ? status : '待处理'
    await feedbackCollection.doc(text(feedbackId, 80)).update({ status: nextStatus, updated_at: Date.now() })
    return { updated: true, status: nextStatus }
  },
}

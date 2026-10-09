import { computed, ref } from 'vue'

const TOKEN_KEY = 'uni_id_token'
const TOKEN_EXPIRED_KEY = 'uni_id_token_expired'
const PROFILE_KEY = 'cyber-genealogy:cloud-profile'

function readStorage(key) {
  try { return uni.getStorageSync(key) } catch { return '' }
}

function writeStorage(key, value) {
  try { uni.setStorageSync(key, value) } catch { /* Storage can be unavailable in tests. */ }
}

function removeStorage(key) {
  try { uni.removeStorageSync(key) } catch { /* Storage can be unavailable in tests. */ }
}

function currentUid() {
  if (typeof uniCloud === 'undefined' || !uniCloud.getCurrentUserInfo) return ''
  try { return uniCloud.getCurrentUserInfo().uid || '' } catch { return '' }
}

function validStoredToken() {
  return !!readStorage(TOKEN_KEY) && Number(readStorage(TOKEN_EXPIRED_KEY) || 0) > Date.now()
}

const initialTokenValid = validStoredToken()
const loggedIn = ref(initialTokenValid)
const uid = ref(loggedIn.value ? currentUid() : '')
const profile = ref(initialTokenValid ? (readStorage(PROFILE_KEY) || null) : null)
const sessionLoading = ref(false)
const syncError = ref('')
const globalLoading = ref(false)
const isCloudReady = computed(() => loggedIn.value && !!uid.value)
let globalLoadingRequests = 0

function requireCloud() {
  if (typeof uniCloud === 'undefined') throw new Error('当前运行环境没有启用 uniCloud')
}

function applyToken(result) {
  const tokenInfo = result && result.newToken ? result.newToken : result
  if (tokenInfo && tokenInfo.token) writeStorage(TOKEN_KEY, tokenInfo.token)
  if (tokenInfo && tokenInfo.tokenExpired) writeStorage(TOKEN_EXPIRED_KEY, tokenInfo.tokenExpired)
  loggedIn.value = validStoredToken()
  uid.value = loggedIn.value ? currentUid() : ''
}

function errorMessage(error, fallback = '云端请求失败，请稍后重试') {
  return error && (error.errMsg || error.message) || fallback
}

async function callFamily(method, ...args) {
  requireCloud()
  const cloudObject = uniCloud.importObject('family-co', { customUI: true })
  try {
    const result = await cloudObject[method](...args)
    if (result && result.errCode) {
      throw Object.assign(new Error(result.errMsg || '云端请求失败'), result)
    }
    applyToken(result)
    syncError.value = ''
    return result
  } catch (error) {
    syncError.value = errorMessage(error)
    if (error && ['uni-id-token-expired', 'uni-id-check-token-failed'].includes(error.errCode)) clearLocalSession()
    throw error
  }
}

function requestWeixinCode() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      onlyAuthorize: true,
      success: ({ code }) => code ? resolve(code) : reject(new Error('微信登录未返回授权码')),
      fail: reject,
    })
  })
}

export async function loginByWeixin() {
  requireCloud()
  sessionLoading.value = true
  try {
    // #ifndef MP-WEIXIN
    throw new Error('微信一键登录只能在微信小程序中使用')
    // #endif
    // #ifdef MP-WEIXIN
    const code = await requestWeixinCode()
    const uniIdCo = uniCloud.importObject('uni-id-co', { customUI: true })
    const result = await uniIdCo.loginByWeixin({ code })
    if (result.errCode) throw result
    applyToken(result)
    uid.value = currentUid() || result.uid || ''
    loggedIn.value = !!uid.value
    return { ...result, uid: uid.value }
    // #endif
  } finally {
    sessionLoading.value = false
  }
}

export function clearLocalSession() {
  removeStorage(TOKEN_KEY)
  writeStorage(TOKEN_EXPIRED_KEY, 0)
  removeStorage(PROFILE_KEY)
  loggedIn.value = false
  uid.value = ''
  profile.value = null
}

export async function logoutCloud() {
  if (validStoredToken() && typeof uniCloud !== 'undefined') {
    try {
      const uniIdCo = uniCloud.importObject('uni-id-co', { customUI: true })
      await uniIdCo.logout()
    } catch (error) {
      console.error('Cloud logout failed', error)
    }
  }
  clearLocalSession()
}

export function hasCloudSession() {
  if (!validStoredToken()) {
    if (loggedIn.value) clearLocalSession()
    return false
  }
  loggedIn.value = true
  uid.value = currentUid()
  return !!uid.value
}

export async function fetchBootstrap() {
  const result = await callFamily('bootstrap')
  if (result.profile) {
    profile.value = result.profile
    writeStorage(PROFILE_KEY, result.profile)
  }
  uid.value = result.uid || currentUid()
  loggedIn.value = !!uid.value
  return result
}

export async function migrateLocalData(payload) {
  return callFamily('migrateLocal', payload)
}

export async function saveProfileCloud(nextProfile) {
  const result = await callFamily('saveProfile', nextProfile)
  profile.value = result.profile
  writeStorage(PROFILE_KEY, result.profile)
  return result.profile
}

export async function createShareCloud(familyId, role) {
  const result = await callFamily('createShare', familyId, role)
  if (!result?.token || !result?.familyName) {
    throw new Error('云端未返回有效的分享入口，请重新部署 family-co 后重试')
  }
  return result
}

export async function acceptShareCloud(token) {
  return callFamily('acceptShare', token)
}

export async function submitFeedbackCloud(payload) {
  return callFamily('submitFeedback', payload)
}

export async function listMyFeedbackCloud() {
  return normalizeFeedbacks(await callFamily('listMyFeedback'))
}

export async function listFeedbacksCloud() {
  return normalizeFeedbacks(await callFamily('listFeedbacks'))
}

export async function updateFeedbackCloud(feedbackId, status) {
  return callFamily('updateFeedback', feedbackId, status)
}

const pendingFamilySaves = new Map()

export function scheduleFamilySave(family) {
  if (!hasCloudSession() || !family || family.isExample || family.canEdit === false) return
  const id = family.id
  const existing = pendingFamilySaves.get(id)
  if (existing) clearTimeout(existing.timer)
  const snapshot = JSON.parse(JSON.stringify(family))
  const timer = setTimeout(async () => {
    pendingFamilySaves.delete(id)
    try { await callFamily('saveFamily', snapshot) } catch (error) { console.error('Family cloud sync failed', error) }
  }, 350)
  pendingFamilySaves.set(id, { timer, snapshot })
}

export async function flushFamilySave(family) {
  if (!hasCloudSession() || !family || family.isExample) return null
  const pending = pendingFamilySaves.get(family.id)
  if (pending) {
    clearTimeout(pending.timer)
    pendingFamilySaves.delete(family.id)
  }
  return callFamily('saveFamily', JSON.parse(JSON.stringify(family)))
}

export function deleteFamilyCloud(familyId) {
  if (!hasCloudSession()) return Promise.resolve()
  const pending = pendingFamilySaves.get(familyId)
  if (pending) clearTimeout(pending.timer)
  pendingFamilySaves.delete(familyId)
  return callFamily('deleteFamily', familyId)
}

export function setFavoriteCloud(familyId, favorite) {
  return hasCloudSession() ? callFamily('setFavorite', familyId, favorite) : Promise.resolve({ favorite })
}

export function useCloudAccount() {
  return { loggedIn, uid, profile, sessionLoading, syncError, globalLoading, isCloudReady }
}

export async function withGlobalLoading(task, minimumDuration = 280) {
  const startedAt = Date.now()
  globalLoadingRequests += 1
  globalLoading.value = true
  try {
    return await task()
  } finally {
    const remaining = minimumDuration - (Date.now() - startedAt)
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
    globalLoadingRequests = Math.max(0, globalLoadingRequests - 1)
    globalLoading.value = globalLoadingRequests > 0
  }
}

export function cloudErrorMessage(error, fallback) {
  return errorMessage(error, fallback)
}

function normalizeFeedbacks(result) {
  const feedbacks = Array.isArray(result.feedbacks) ? result.feedbacks.map((item) => {
    const date = new Date(item.created_at || Date.now())
    const pad = (value) => String(value).padStart(2, '0')
    return { ...item, time: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` }
  }) : []
  return { ...result, feedbacks }
}

export function compressAvatarToBase64(sourcePath) {
  return new Promise((resolve, reject) => {
    // #ifndef MP-WEIXIN
    resolve(sourcePath)
    // #endif
    // #ifdef MP-WEIXIN
    uni.compressImage({
      src: sourcePath,
      quality: 55,
      success: ({ tempFilePath }) => {
        uni.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: ({ data }) => {
            const value = `data:image/jpeg;base64,${data}`
            if (value.length > 180000) reject(new Error('头像仍然过大，请选择更小的图片'))
            else resolve(value)
          },
          fail: reject,
        })
      },
      fail: reject,
    })
    // #endif
  })
}

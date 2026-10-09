import {
  acceptShareCloud,
  fetchBootstrap,
  hasCloudSession,
  listMyFeedbackCloud,
  loginByWeixin,
  logoutCloud,
  migrateLocalData,
  withGlobalLoading,
} from './cloudService.js'
import { useGenealogyStore } from './genealogyStore.js'

const PENDING_SHARE_KEY = 'cyber-genealogy:pending-share'
const MIGRATION_PREFIX = 'cyber-genealogy:migrated:'
let restoring = null

function migrationDone(uid) {
  try { return !!uni.getStorageSync(`${MIGRATION_PREFIX}${uid}`) } catch { return false }
}

function markMigrationDone(uid) {
  try { uni.setStorageSync(`${MIGRATION_PREFIX}${uid}`, Date.now()) } catch { /* Ignore storage failures. */ }
}

function pendingShare() {
  try { return uni.getStorageSync(PENDING_SHARE_KEY) || '' } catch { return '' }
}

export function rememberShareToken(token) {
  if (!token) return
  try { uni.setStorageSync(PENDING_SHARE_KEY, token) } catch { /* Ignore storage failures. */ }
}

function clearPendingShare() {
  try { uni.removeStorageSync(PENDING_SHARE_KEY) } catch { /* Ignore storage failures. */ }
}

async function loadAccount(uid, localSnapshot) {
  const store = useGenealogyStore()
  if (!migrationDone(uid)) {
    await migrateLocalData(localSnapshot || store.exportLocalData())
    markMigrationDone(uid)
    store.clearMigratedGuestData()
  }
  let acceptedFamilyId = ''
  const token = pendingShare()
  if (token) {
    const accepted = await acceptShareCloud(token)
    acceptedFamilyId = accepted.family && accepted.family.id || ''
    clearPendingShare()
  }
  let bootstrap = await fetchBootstrap()
  const accountCache = store.exportAccountCache(uid)
  const cloudFamilyIds = new Set((bootstrap.families || []).map((family) => family.id))
  const missingFamilies = accountCache.families.filter((family) => !cloudFamilyIds.has(family.id))
  if (missingFamilies.length) {
    await migrateLocalData({
      families: missingFamilies,
      favoriteIds: accountCache.favoriteIds.filter((id) => missingFamilies.some((family) => family.id === id)),
    })
    bootstrap = await fetchBootstrap()
  }
  const feedbackResult = await listMyFeedbackCloud()
  bootstrap.feedbacks = feedbackResult.feedbacks || []
  store.applyCloudState(uid, bootstrap)
  if (acceptedFamilyId) store.selectFamily(acceptedFamilyId)
  return { ...bootstrap, acceptedFamilyId }
}

export async function loginAndLoadAccount() {
  return withGlobalLoading(async () => {
    const store = useGenealogyStore()
    const localSnapshot = store.exportLocalData()
    const login = await loginByWeixin()
    store.setProfileConfigured(true)
    try {
      return await loadAccount(login.uid, localSnapshot)
    } catch (error) {
      if (!hasCloudSession()) store.resetToGuest()
      throw error
    }
  }, 360)
}

export async function restoreCloudSession() {
  const store = useGenealogyStore()
  if (!hasCloudSession()) {
    store.resetToGuest()
    return null
  }
  store.setProfileConfigured(true)
  if (restoring) return restoring
  restoring = (async () => {
    const info = uniCloud.getCurrentUserInfo()
    try {
      return await loadAccount(info.uid)
    } catch (error) {
      if (!hasCloudSession()) store.resetToGuest()
      throw error
    }
  })()
  try { return await restoring } finally { restoring = null }
}

export async function logoutAccount() {
  await logoutCloud()
  useGenealogyStore().resetToGuest()
}

export async function acceptOrRememberShare(token) {
  rememberShareToken(token)
  if (!hasCloudSession()) return { needsLogin: true }
  const accepted = await acceptShareCloud(token)
  clearPendingShare()
  const bootstrap = await fetchBootstrap()
  const feedbackResult = await listMyFeedbackCloud()
  bootstrap.feedbacks = feedbackResult.feedbacks || []
  const store = useGenealogyStore()
  store.applyCloudState(bootstrap.uid, bootstrap)
  store.selectFamily(accepted.family.id)
  return { family: accepted.family }
}

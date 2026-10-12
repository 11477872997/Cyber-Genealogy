export const LEGAL_VERSION = '2026-10-12'

const CONSENT_KEY = 'cyber-genealogy:legal-consent'

function readConsent() {
  try { return uni.getStorageSync(CONSENT_KEY) || null } catch { return null }
}

export function hasAcceptedLegalDocuments() {
  const consent = readConsent()
  return consent === LEGAL_VERSION || consent?.version === LEGAL_VERSION
}

export function acceptLegalDocuments() {
  try {
    uni.setStorageSync(CONSENT_KEY, { version: LEGAL_VERSION, acceptedAt: Date.now() })
  } catch { /* Storage can be unavailable in tests. */ }
}

export function requireLegalConsent() {
  if (hasAcceptedLegalDocuments()) return
  const error = new Error('请先阅读并同意《用户服务协议》和《隐私政策》')
  error.code = 'LEGAL_CONSENT_REQUIRED'
  throw error
}

export function isLegalConsentError(error) {
  return error?.code === 'LEGAL_CONSENT_REQUIRED'
}

export function requestWechatPrivacyAuthorization() {
  return new Promise((resolve, reject) => {
    const request = typeof uni !== 'undefined' && typeof uni.requirePrivacyAuthorize === 'function'
      ? uni.requirePrivacyAuthorize.bind(uni)
      : typeof wx !== 'undefined' && typeof wx.requirePrivacyAuthorize === 'function'
        ? wx.requirePrivacyAuthorize.bind(wx)
        : null
    if (!request) {
      resolve()
      return
    }
    request({ success: resolve, fail: reject })
  })
}

export async function ensurePrivacyAuthorization() {
  requireLegalConsent()
  await requestWechatPrivacyAuthorization()
}

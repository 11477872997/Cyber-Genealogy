<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { rememberShareToken, restoreCloudSession } from './services/cloudSession.js'
import { withGlobalLoading } from './services/cloudService.js'

let initialBoot = null
let booted = false

function rememberOptions(options = {}) {
  const token = options.query && options.query.shareToken
  if (token) rememberShareToken(token)
  return token
}

function startInitialBoot(options = {}) {
  rememberOptions(options)
  if (initialBoot) return initialBoot
  initialBoot = withGlobalLoading(() => restoreCloudSession(), 320)
    .catch((error) => console.error('Cloud session restore failed', error))
    .finally(() => { booted = true })
  return initialBoot
}

onLaunch(startInitialBoot)
onShow((options = {}) => {
  rememberOptions(options)
  if (!booted) return startInitialBoot(options)
})
</script>

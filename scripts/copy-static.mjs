import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const platform = process.argv[2]
if (!['mp-weixin', 'h5'].includes(platform)) throw new Error(`Unknown platform: ${platform}`)

const source = resolve('static')
const output = resolve('dist', 'build', platform)
if (!existsSync(source) || !existsSync(output)) throw new Error('Build output or static directory is missing')
cpSync(source, resolve(output, 'static'), { recursive: true, force: true })

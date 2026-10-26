import { App, type AppInfo } from '@capacitor/app'
import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { create } from 'zustand'
import { isNative } from './platform'

/**
 * App 内自动更新：
 * 1. 查 GitHub 最新 Release（仓库地址在构建时由 GitHub Actions 注入）
 * 2. 和 App 当前 versionName 比较
 * 3. 原生下载 APK、校验大小、调起系统安装器
 *
 * 必须用同一个签名打包，否则 Android 会拒绝覆盖安装。
 */

type AppUpdaterPlugin = {
  downloadAndInstall(options: { url: string; fileName?: string }): Promise<{ started: boolean }>
  canInstall(): Promise<{ granted: boolean }>
  addListener(
    eventName: 'progress',
    listener: (data: { percent: number; downloaded: number; total: number }) => void,
  ): Promise<PluginListenerHandle>
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater')

const repo = String(import.meta.env.VITE_GITHUB_REPO || '').trim()
const CHECK_KEY = 'wechat-update-last-check-v1'
const PROMPT_KEY = 'wechat-update-prompted-v1'
const AUTO_INTERVAL_MS = 6 * 60 * 60_000

export const UPDATE_REPO = repo
export const UPDATE_CHANNEL_LABEL = repo || '未配置更新源'

export type UpdateInfo = {
  version: string
  name: string
  notes: string
  apkUrl: string
  size: number
  publishedAt: string
  htmlUrl: string
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'latest' | 'error'

type UpdaterState = {
  status: UpdateStatus
  info: UpdateInfo | null
  progress: number
  error: string
  dialogOpen: boolean
  currentVersion: string
  currentBuild: string
  /** 手动检查一次；manual=false 时失败不打扰用户 */
  check: (manual?: boolean) => Promise<void>
  install: () => Promise<void>
  dismiss: () => void
  autoCheck: () => Promise<void>
  loadVersion: () => Promise<void>
}

function parseVersion(value: string): number[] | null {
  const match = String(value || '')
    .replace(/^v/i, '')
    .match(/(\d+)\.(\d+)(?:\.(\d+))?/)
  if (!match) return null
  return [Number(match[1]) || 0, Number(match[2]) || 0, Number(match[3]) || 0]
}

function isNewer(remote: string, local: string) {
  const a = parseVersion(remote)
  const b = parseVersion(local)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true
    if (a[i] < b[i]) return false
  }
  return false
}

function readNumber(key: string) {
  const value = Number(localStorage.getItem(key))
  return Number.isFinite(value) ? value : 0
}

async function fetchLatestRelease(): Promise<UpdateInfo | null> {
  if (!repo) throw new Error('还没有配置更新源（VITE_GITHUB_REPO）')
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (response.status === 404) return null
  if (!response.ok) {
    if (response.status === 403) throw new Error('GitHub 访问太频繁，稍后再试')
    throw new Error(`检查更新失败（GitHub 返回 ${response.status}）`)
  }
  const release = await response.json()
  const tag = String(release?.tag_name || release?.name || '')
  const version = tag.replace(/^v/i, '').trim()
  const assets = Array.isArray(release?.assets) ? release.assets : []
  const apk = assets.find((asset: { name?: string }) => /\.apk$/i.test(String(asset?.name || '')))
  if (!version) return null
  if (!apk) throw new Error('最新 Release 里没有 .apk 安装包附件')
  return {
    version,
    name: String(release?.name || tag || version),
    notes: String(release?.body || '').trim(),
    apkUrl: String(apk.browser_download_url || ''),
    size: Number(apk.size) || 0,
    publishedAt: String(release?.published_at || ''),
    htmlUrl: String(release?.html_url || ''),
  }
}

export function formatSize(bytes: number) {
  if (!bytes) return ''
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function formatDate(value: string) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return ''
  }
}

export const useUpdater = create<UpdaterState>((set, get) => ({
  status: 'idle',
  info: null,
  progress: 0,
  error: '',
  dialogOpen: false,
  currentVersion: '',
  currentBuild: '',

  loadVersion: async () => {
    try {
      const info: AppInfo = await App.getInfo()
      set({ currentVersion: info.version || '', currentBuild: info.build || '' })
    } catch {
      // 浏览器里没有原生版本号
    }
  },

  check: async (manual = true) => {
    if (!isNative()) {
      if (manual) set({ status: 'error', error: '自动更新只在手机 App 里可用' })
      return
    }
    if (get().status === 'checking' || get().status === 'downloading') return
    set({ status: 'checking', error: '' })
    try {
      const info = await fetchLatestRelease()
      localStorage.setItem(CHECK_KEY, String(Date.now()))
      await get().loadVersion()
      const current = get().currentVersion
      if (!info) {
        set({ status: 'latest', info: null, dialogOpen: false })
        return
      }
      if (isNewer(info.version, current)) {
        const prompted = localStorage.getItem(PROMPT_KEY) || ''
        const shouldOpen = manual || prompted !== info.version
        set({ status: 'available', info, dialogOpen: shouldOpen, error: '' })
        if (!manual) localStorage.setItem(PROMPT_KEY, info.version)
      } else {
        set({ status: 'latest', info: null, dialogOpen: false })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '检查更新失败'
      set({ status: 'error', error: message })
    }
  },

  install: async () => {
    const info = get().info
    if (!info) return
    if (!isNative()) {
      set({ status: 'error', error: '请在手机 App 内更新' })
      return
    }
    set({ status: 'downloading', progress: 0, error: '' })
    const progressHandle = await AppUpdater.addListener(
      'progress',
      ({ percent }: { percent: number }) => {
        set({ progress: Math.max(0, Math.min(100, Math.round(percent))) })
      },
    )
    try {
      const fileName = `wechat-sandbox-${info.version}.apk`
      await AppUpdater.downloadAndInstall({ url: info.apkUrl, fileName })
      set({ status: 'installing', progress: 100 })
    } catch (error) {
      const message = error instanceof Error ? error.message : '下载安装包失败'
      set({ status: 'error', error: message })
    } finally {
      await progressHandle.remove().catch(() => undefined)
    }
  },

  dismiss: () => set({ dialogOpen: false }),

  autoCheck: async () => {
    if (!isNative() || !repo) return
    if (Date.now() - readNumber(CHECK_KEY) < AUTO_INTERVAL_MS) return
    await get().check(false)
  },
}))

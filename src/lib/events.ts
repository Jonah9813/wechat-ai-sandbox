import { isNative } from './platform'

/**
 * 每日事件的读写：
 *  - 电脑网页：仍写到本机 events/日期.md（Vite 插件提供接口）
 *  - 手机 App：写到 WebView 的 localStorage（App 私有目录，升级不丢）
 *
 * 两边都额外留一份 localStorage 副本，文件接口不可用时不会丢内容。
 */

const storageKey = (date: string) => `wechat-ai-event:${date}`

function readLocal(date: string) {
  try {
    return localStorage.getItem(storageKey(date)) ?? ''
  } catch {
    return ''
  }
}

function writeLocal(date: string, content: string) {
  try {
    localStorage.setItem(storageKey(date), content)
  } catch {
    // 空间满等极端情况：state 里还有一份，不阻塞使用
  }
}

export async function loadEvent(date: string): Promise<string> {
  if (!isNative()) {
    try {
      const response = await fetch(`/api/events/today?date=${date}`)
      const data = await response.json().catch(() => ({}))
      if (response.ok && typeof data.content === 'string' && data.content.trim()) {
        writeLocal(date, data.content)
        return data.content
      }
    } catch {
      // 文件接口不可用时退回本地副本
    }
  }
  return readLocal(date)
}

export type SaveEventResult = 'file' | 'local'

export async function saveEvent(date: string, content: string): Promise<SaveEventResult> {
  writeLocal(date, content)
  if (isNative()) return 'local'
  try {
    const response = await fetch('/api/events/today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    return response.ok ? 'file' : 'local'
  } catch {
    return 'local'
  }
}

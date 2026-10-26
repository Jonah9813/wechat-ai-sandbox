import { isNative } from './platform'
import {
  askNativeWeb,
  forgetNativeWeb,
  loginNativeWeb,
  statusNativeWeb,
  warmUpNativeWeb,
  type WebStatus,
} from './deepseekWebNative'

/** DeepSeek 网页端桥接：电脑走本地代理，手机走 App 内置 WebView。 */

export type { WebStatus }

export type WebAskParams = {
  text: string
  system?: string
  threadKey?: string
}

export async function webAsk({ text, system, threadKey }: WebAskParams): Promise<string> {
  if (isNative()) return askNativeWeb({ text, system, threadKey })

  const response = await fetch('/api/web-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, system, threadKey }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || '网页端连接失败')
  return String(data?.content || '')
}

export async function webStatus(): Promise<WebStatus> {
  if (isNative()) return statusNativeWeb()
  try {
    const response = await fetch('/api/web/status')
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return { running: false, loggedIn: false }
    return { running: Boolean(data.running), loggedIn: Boolean(data.loggedIn) }
  } catch {
    return { running: false, loggedIn: false }
  }
}

export async function webLogin(): Promise<WebStatus> {
  if (isNative()) return loginNativeWeb()

  const response = await fetch('/api/web/login', { method: 'POST' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || '浏览器启动失败')
  return { running: true, loggedIn: Boolean(data.loggedIn) }
}

export async function webForget(threadKey: string): Promise<void> {
  if (isNative()) {
    await forgetNativeWeb(threadKey)
    return
  }
  await fetch('/api/web/forget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadKey }),
  }).catch(() => undefined)
}

/** App 启动时预热 WebView，第一次网页端回复不用等页面加载。 */
export function warmUpWebBridge() {
  if (isNative()) warmUpNativeWeb()
}

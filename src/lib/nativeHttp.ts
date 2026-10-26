import { CapacitorHttp } from '@capacitor/core'
import type { PostJson } from '../../shared/upstream'

/**
 * 原生 HTTP：在 App 里直接请求模型接口，不走浏览器 fetch。
 * 好处是完全没有 CORS 限制，API Key 也只留在手机本地。
 */
export const nativePostJson: PostJson = async (url, headers, body, timeoutMs = 60_000) => {
  const response = await CapacitorHttp.post({
    url,
    headers,
    data: body,
    connectTimeout: Math.min(20_000, timeoutMs),
    readTimeout: timeoutMs,
    responseType: 'json',
  })
  let data: unknown = response.data
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      // 保持原样，交给调用方报错
    }
  }
  return { status: response.status, data }
}

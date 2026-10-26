/**
 * 模型接口调用（DeepSeek / Gemini）的共用实现。
 *
 * 同一个文件同时给两端用：
 *  - 电脑网页：Vite 开发/预览服务器里的 /api/chat 代理（浏览器不直连，省得撞跨域）
 *  - 手机 App：Capacitor 原生 HTTP 直连（不受浏览器跨域限制）
 *
 * 这样两条路径的回退规则、模型名、报错文案完全一致，改一处两边都生效。
 */

export type UpstreamMessage = { role: string; content: string }

export type PostJson = (
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs?: number,
) => Promise<{ status: number; data: unknown }>

export type UpstreamRequest = {
  provider: 'deepseek' | 'gemini'
  baseUrl?: string
  apiKey: string
  model?: string
  messages: UpstreamMessage[]
  temperature?: number
}

export type UpstreamResult = { content: string; model: string }

// Gemini 新版 Interactions API（generateContent 不支持 gemini-3.8-flash 这类新模型）
export const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions'
export const GEMINI_DEFAULT_MODEL = 'gemini-3.8-flash'
export const GEMINI_MODEL_FALLBACKS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
]

// 记住某个 Key 实际能用的模型，避免每条消息都重试 4 次（免费额度很有限）
const geminiModelCache = new Map<string, { model: string; at: number }>()
const GEMINI_CACHE_MS = 30 * 60_000

export function cachedGeminiModel(apiKey: string): string | null {
  const hit = geminiModelCache.get(apiKey)
  if (hit && Date.now() - hit.at < GEMINI_CACHE_MS) return hit.model
  return null
}

function rememberGeminiModel(apiKey: string, model: string) {
  geminiModelCache.set(apiKey, { model, at: Date.now() })
}

/** Interactions API 的错误体有时是数组，统一取出 message。 */
export function geminiErrorMessage(payload: unknown, status: number): string {
  const list = Array.isArray(payload) ? payload : [payload]
  for (const item of list) {
    const message = (item as { error?: { message?: string } })?.error?.message
    if (message) return message
  }
  return `Gemini 接口返回 ${status}`
}

/** 从 Interactions API 的 steps 里取最后一段 model_output 文本。 */
type GeminiBlock = { type?: string; text?: string }

export function geminiOutputText(payload: unknown): string {
  const data = payload as {
    steps?: { type?: string; content?: GeminiBlock[] }[]
    outputs?: unknown
  }
  const steps = Array.isArray(data?.steps) ? data.steps : []
  const outputs = steps.filter((step) => step?.type === 'model_output')
  const blocks = outputs.length
    ? outputs[outputs.length - 1]?.content
    : Array.isArray(data?.outputs)
      ? (data.outputs as GeminiBlock[])
      : []
  return (Array.isArray(blocks) ? blocks : [])
    .filter((block) => typeof block?.text === 'string')
    .map((block) => String(block.text))
    .join('')
}

/** 把消息历史拼成 Interactions API 的 input 文本。 */
export function geminiInput(history: UpstreamMessage[]): string {
  const lines = history
    .filter((item) => item.role !== 'system' && String(item.content || '').trim())
    .map((item) => `${item.role === 'assistant' ? '你' : '用户'}：${item.content}`)
  if (!lines.length) return '你好'
  return `以下是聊天记录（“用户”是正在和你聊天的人，“你”是你自己之前说过的话）：\n${lines.join('\n')}`
}

async function callGemini(
  post: PostJson,
  { apiKey, model, messages }: UpstreamRequest,
): Promise<UpstreamResult> {
  const systemText = messages
    .filter((item) => item.role === 'system')
    .map((item) => item.content)
    .join('\n\n')
  const input = geminiInput(messages)

  const request = (requestedModel: string) =>
    post(
      GEMINI_INTERACTIONS_URL,
      {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      {
        model: requestedModel,
        input,
        ...(systemText ? { system_instruction: systemText } : {}),
        generation_config: { max_output_tokens: 400 },
        store: false,
      },
      60_000,
    )

  const requested = String(model || '').trim()
  const configured =
    requested && requested !== 'auto' && requested.startsWith('gemini') ? requested : GEMINI_DEFAULT_MODEL
  // 优先用这个 Key 上次实际成功的模型，避免每条消息都白跑几轮
  const preferred = cachedGeminiModel(apiKey) ?? configured
  const candidates = [preferred, ...GEMINI_MODEL_FALLBACKS].filter(
    (name, index, list) => list.indexOf(name) === index,
  )

  let usedModel = preferred
  let result = await request(preferred)
  // 模型名不可用时依次回退；Key 无效、配额用尽等错误直接返回，不做无意义重试
  for (const candidate of candidates.slice(1)) {
    if (result.status >= 200 && result.status < 300) break
    const reason = geminiErrorMessage(result.data, result.status)
    const status = result.status
    if (
      status === 401 ||
      status === 403 ||
      status === 429 ||
      /api key|permission|quota|billing|resource exhausted|too many requests/i.test(reason)
    ) {
      break
    }
    usedModel = candidate
    result = await request(candidate)
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(geminiErrorMessage(result.data, result.status))
  }
  if (usedModel !== configured) rememberGeminiModel(apiKey, usedModel)
  const text = geminiOutputText(result.data)
  if (!text) throw new Error('模型没有返回内容')
  return { content: text, model: usedModel }
}

async function callDeepSeek(
  post: PostJson,
  { baseUrl, apiKey, model, messages, temperature = 0.9 }: UpstreamRequest,
): Promise<UpstreamResult> {
  const endpoint = `${String(baseUrl || 'https://api.deepseek.com').replace(/\/$/, '')}/chat/completions`
  const request = (requestedModel: string) =>
    post(
      endpoint,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      {
        model: requestedModel,
        messages,
        temperature,
        max_tokens: 400,
        stream: false,
      },
      60_000,
    )

  const requestedModel = String(model || 'deepseek-flash')
  let result = await request(requestedModel)

  // 用户写的是 DeepSeek Flash：若该模型名在当前账号不可用，自动回退到 deepseek-chat
  if (!(result.status >= 200 && result.status < 300) && requestedModel !== 'deepseek-chat') {
    const reason = String((result.data as { error?: { message?: string } })?.error?.message || '')
    if (result.status === 404 || /model|not\s*found|invalid|不存在|unsupported/i.test(reason)) {
      result = await request('deepseek-chat')
    }
  }

  if (result.status < 200 || result.status >= 300) {
    const message =
      (result.data as { error?: { message?: string } })?.error?.message ||
      `模型接口返回 ${result.status}`
    throw new Error(String(message))
  }
  const data = result.data as { choices?: { message?: { content?: string } }[]; model?: string }
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('模型没有返回内容')
  return { content, model: data?.model || requestedModel }
}

/** 按服务商分发；出错统一抛 Error，页面只负责展示 message。 */
export async function callUpstream(post: PostJson, request: UpstreamRequest): Promise<UpstreamResult> {
  if (!request.apiKey) throw new Error('还没有填写 API Key')
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new Error('消息为空')
  }
  return request.provider === 'gemini' ? callGemini(post, request) : callDeepSeek(post, request)
}

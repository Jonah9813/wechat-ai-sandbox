import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { ask as webAsk, forgetThread as webForget, openForLogin, status as webStatus } from './server/deepseekWeb.ts'
import { callUpstream, type PostJson } from './shared/upstream.ts'

const root = process.cwd()
const eventsDir = path.join(root, 'events')

function localDateKey(date = new Date()) {
  return date.toLocaleDateString('sv-SE')
}

async function readBody(req: import('node:http').IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function sendJson(res: import('node:http').ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

/** 电脑网页端的模型请求走 Node fetch；和手机原生 HTTP 共用同一套回退逻辑。 */
const nodePostJson: PostJson = async (url, headers, body, timeoutMs = 60_000) => {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}

function apiPlugin(): Plugin {
  return {
    name: 'wechat-local-api',
    configureServer(server) {
      server.middlewares.use('/api/health', (_req, res) => {
        sendJson(res, 200, { ok: true, date: localDateKey() })
      })

      // DeepSeek 网页端桥接（电脑：Playwright 可见浏览器）
      server.middlewares.use('/api/web/status', async (_req, res) => {
        try {
          sendJson(res, 200, await webStatus())
        } catch (error) {
          sendJson(res, 500, { error: error instanceof Error ? error.message : '状态读取失败' })
        }
      })

      server.middlewares.use('/api/web/login', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
        try {
          sendJson(res, 200, await openForLogin())
        } catch (error) {
          sendJson(res, 500, { error: error instanceof Error ? error.message : '浏览器启动失败' })
        }
      })

      // 网页端自带会话记忆，这里只传"当前这一句 + 会话标识"，不再整段历史重发
      server.middlewares.use('/api/web-chat', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
        try {
          const body = await readBody(req)
          const text = String(body?.text ?? '').trim()
          if (!text) return sendJson(res, 400, { error: '消息为空' })
          const content = await webAsk({
            text,
            system: typeof body?.system === 'string' ? body.system : undefined,
            threadKey: typeof body?.threadKey === 'string' ? body.threadKey : undefined,
          })
          return sendJson(res, 200, { content })
        } catch (error) {
          return sendJson(res, 502, { error: error instanceof Error ? error.message : '网页端请求失败' })
        }
      })

      server.middlewares.use('/api/web/forget', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
        try {
          const body = await readBody(req)
          const threadKey = String(body?.threadKey ?? body?.friendId ?? '')
          if (!threadKey) return sendJson(res, 400, { error: '缺少会话标识' })
          await webForget(threadKey)
          return sendJson(res, 200, { ok: true })
        } catch (error) {
          return sendJson(res, 500, { error: error instanceof Error ? error.message : '清空会话失败' })
        }
      })

      // 模型代理：时间/今日事件由前端拼进 system，服务端只负责转发
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
        try {
          const body = await readBody(req)
          const { baseUrl, apiKey, model, messages, temperature } = body
          if (!apiKey) return sendJson(res, 400, { error: '还没有填写 API Key' })
          if (!Array.isArray(messages) || messages.length === 0) {
            return sendJson(res, 400, { error: '消息为空' })
          }
          const result = await callUpstream(nodePostJson, {
            provider: body.provider === 'gemini' ? 'gemini' : 'deepseek',
            baseUrl,
            apiKey,
            model,
            temperature,
            messages,
          })
          return sendJson(res, 200, result)
        } catch (error) {
          const message = error instanceof Error ? error.message : '请求模型失败'
          return sendJson(res, 502, { error: message })
        }
      })

      server.middlewares.use('/api/events/today', async (req, res) => {
        try {
          await fsp.mkdir(eventsDir, { recursive: true })
          const url = new URL(req.url || '/', 'http://localhost')
          const date = url.searchParams.get('date') || localDateKey()
          const file = path.join(eventsDir, `${date}.md`)
          if (req.method === 'GET') {
            const content = fs.existsSync(file) ? await fsp.readFile(file, 'utf8') : ''
            return sendJson(res, 200, { date, content })
          }
          if (req.method === 'POST') {
            const body = await readBody(req)
            await fsp.writeFile(file, String(body.content ?? ''), 'utf8')
            return sendJson(res, 200, { date, saved: true })
          }
          return sendJson(res, 405, { error: 'Method not allowed' })
        } catch (error) {
          const message = error instanceof Error ? error.message : '事件文件读写失败'
          return sendJson(res, 500, { error: message })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
  },
})

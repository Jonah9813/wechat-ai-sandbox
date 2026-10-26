import { chromium, type BrowserContext, type Locator, type Page } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * DeepSeek 网页端桥接：用 Playwright 打开一个**有头**浏览器窗口，
 * 由用户自己手动登录，之后由程序在这个窗口里输入和读取回复。
 *
 * 和 API 模式最大的区别：网页端自带会话记忆。
 * 所以每个好友固定复用同一条会话，只在第一次发设定，之后只发当前这一句话，
 * 不再把整段历史重新拼一遍发过去。
 *
 * 降风险原则：不做指纹伪装，而是让操作本身更像真人——
 * 鼠标分多步移动、点进输入框、随机滚动查看、按人的速度打字、
 * 每条消息之间留随机（有时较长）的间隔、节奏串行不并发；
 * 一旦页面出现人机验证/滑块，就立刻停下并把控制权交还给人。
 */

const PROFILE_DIR = path.join(process.cwd(), '.browser-data', 'deepseek')
const THREAD_FILE = path.join(process.cwd(), '.browser-data', 'deepseek-threads.json')
const CHAT_URL = 'https://chat.deepseek.com/'

// 两条消息之间的间隔：常态 6–15 秒，偶发一次长停顿，避免出现机器般的等间距
const GAP_MIN_MS = 6000
const GAP_MAX_MS = 15000
const LONG_PAUSE_CHANCE = 0.12

// 连续失败太多次就主动停一会儿，避免风控前还一直重试
const MAX_FAIL_STREAK = 3
const FAIL_COOLDOWN_MS = 5 * 60_000

// 一小时内的合理上限，防止主动消息调度之类的原因把网页端刷得太频繁
const MAX_REQUESTS_PER_HOUR = 50
const HOUR_MS = 60 * 60_000
const recentRequests: number[] = []

let context: BrowserContext | null = null
let page: Page | null = null
let launching: Promise<Page> | null = null
let nextRequestAt = 0
let failStreak = 0
let blockedUntil = 0
let queue: Promise<unknown> = Promise.resolve()

/** 每个好友在网页端那条会话的状态：地址、上次发设定后聊了多少句、上次发设定的时间 */
type ThreadState = {
  url: string
  sent: number
  seededAt: number
}

/** threadKey（好友 id）→ 会话状态 */
let threads: Record<string, ThreadState> = {}

export type WebStatus = {
  running: boolean
  loggedIn: boolean
}

export type WebAskParams = {
  /** 本轮要说的这一句 */
  text: string
  /** 人物设定，只在这条会话的第一句时发一次 */
  system?: string
  /** 会话标识，通常用好友 id；同一个 key 复用同一条网页会话 */
  threadKey?: string
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1))
}

/** 上一次鼠标停在哪，下一次从那里继续动，避免每次都被瞬移到随机位置。 */
let mousePos: { x: number; y: number } | null = null

/** 鼠标分多步走到目标点，中间带一点偏移，像真实的手在动。 */
async function moveMouseLikeHuman(target: Page, x: number, y: number) {
  const viewport = target.viewportSize() ?? { width: 1280, height: 900 }
  const from =
    mousePos ??
    ({
      x: randomBetween(viewport.width * 0.45, viewport.width * 0.95),
      y: randomBetween(viewport.height * 0.55, viewport.height * 0.95),
    } as { x: number; y: number })
  await target.mouse.move(from.x, from.y)
  await target.waitForTimeout(randomInt(30, 90))
  const midX = (from.x + x) / 2 + randomBetween(-70, 70)
  const midY = (from.y + y) / 2 + randomBetween(-50, 50)
  await target.mouse.move(midX, midY, { steps: randomInt(4, 9) })
  await target.waitForTimeout(randomInt(40, 130))
  await target.mouse.move(x, y, { steps: randomInt(6, 12) })
  mousePos = { x, y }
  await target.waitForTimeout(randomInt(60, 200))
}

/** 点击落在元素内的随机位置，而不是永远正中。 */
async function clickLikeHuman(target: Page, locator: Locator) {
  const box = await locator.boundingBox().catch(() => null)
  if (!box) {
    await locator.click({ timeout: 15_000 })
    return
  }
  const x = box.x + box.width * randomBetween(0.3, 0.7)
  const y = box.y + box.height * randomBetween(0.35, 0.65)
  await moveMouseLikeHuman(target, x, y)
  await target.mouse.click(x, y)
}

/** 用滚轮分几段滚，像人在翻看对话。 */
async function scrollLikeHuman(target: Page, direction: 'down' | 'up' = 'down', rounds = randomInt(2, 5)) {
  const sign = direction === 'down' ? 1 : -1
  for (let i = 0; i < rounds; i++) {
    await target.mouse.wheel(0, sign * randomInt(90, 280))
    await target.waitForTimeout(randomInt(80, 240))
  }
}

/** 发消息前“看一眼页面”：多数时候滚一下对话，偶尔只是挪一下鼠标。 */
async function glanceAtPage(target: Page) {
  await target.waitForTimeout(randomInt(500, 1400))
  const roll = Math.random()
  if (roll < 0.35) {
    await scrollLikeHuman(target, 'up', randomInt(1, 3))
    await target.waitForTimeout(randomInt(200, 600))
    await scrollLikeHuman(target, 'down', randomInt(2, 4))
  } else if (roll < 0.7) {
    await scrollLikeHuman(target, 'down', randomInt(1, 3))
  } else {
    const viewport = target.viewportSize() ?? { width: 1280, height: 900 }
    await moveMouseLikeHuman(
      target,
      randomBetween(viewport.width * 0.3, viewport.width * 0.8),
      randomBetween(viewport.height * 0.3, viewport.height * 0.7),
    )
  }
  await target.waitForTimeout(randomInt(200, 700))
}

/**
 * 页面是否出现了需要人来接手的东西（人机验证/滑块/登录过期）。
 * 只在弹层和验证类容器里找文字，避免把侧边栏的会话标题误判成验证码。
 */
async function detectChallenge(target: Page): Promise<string | null> {
  const markers = ['[class*="captcha"]', '[id*="captcha"]', 'iframe[src*="captcha"]', 'iframe[src*="verify"]']
  for (const selector of markers) {
    const count = await target.locator(selector).count().catch(() => 0)
    if (count > 0) return 'captcha 元素'
  }
  const zones = target.locator('[role="dialog"], [class*="modal"], [class*="dialog"], [class*="verify"]')
  const count = await zones.count().catch(() => 0)
  if (!count) return null
  for (let i = 0; i < Math.min(count, 4); i++) {
    const text = (await zones.nth(i).innerText().catch(() => '')) || ''
    const hit = /人机验证|拖动滑块|滑动验证|请完成验证|安全验证|登录已过期|账号异常/.exec(text)
    if (hit) return hit[0]
  }
  return null
}

/** 按当前节奏算出下一条最早可以发的时间。 */
function scheduleNextGap() {
  const base = randomInt(GAP_MIN_MS, GAP_MAX_MS)
  const extra = Math.random() < LONG_PAUSE_CHANCE ? randomInt(15000, 45000) : 0
  nextRequestAt = Date.now() + base + extra
}

/**
 * 人物设定多久重发一次。
 *
 * 网页端虽然自己有记忆，但一条会话聊到几十句之后，开头那段设定会被稀释，
 * 甚至因为上下文截断而彻底丢掉——表现就是“它忘了自己是谁”。
 * 这里用两个阈值取先到者：
 *  - 每聊 12–16 句（每个好友固定一个值，避免所有人都是整齐的同一节拍）
 *  - 距离上次发设定超过 45 分钟（跨时段、跨天时时间信息也一起刷新）
 * 重发时只补设定，不重发历史，也不重开会话，所以对话是连续的。
 */
const SEED_TURNS_MIN = 12
const SEED_TURNS_SPAN = 5
const SEED_MAX_AGE_MS = 45 * 60_000

function seedTurnThreshold(threadKey: string) {
  let hash = 0
  for (const char of threadKey) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return SEED_TURNS_MIN + (hash % SEED_TURNS_SPAN)
}

function shouldReseed(entry: ThreadState | undefined, threadKey: string) {
  if (!entry || !entry.seededAt) return true
  if (entry.sent >= seedTurnThreshold(threadKey)) return true
  return Date.now() - entry.seededAt >= SEED_MAX_AGE_MS
}

/** 重发设定时的措辞：提醒它继续，而不是让它以为要重新开始。 */
function composePrompt(system: string, text: string, brandNew: boolean) {
  if (!system) return text
  // 新会话沿用最早验证过的格式：设定 + 这一句，模型会直接接着回话
  if (brandNew) return `${system}\n\n${text}`
  // 中途补设定：先说清“这段不用回应”，最后一句才是要回的话
  return `【提醒：按下面的设定继续聊，不用回应这段提醒，也不要重新自我介绍】\n${system}\n【提醒结束】\n${text}`
}

/** 串行执行：同一时间只允许一个请求操作这个浏览器，避免互相打断。 */
function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task)
  queue = next.catch(() => undefined)
  return next
}

function loadThreads() {
  try {
    const raw = JSON.parse(fs.readFileSync(THREAD_FILE, 'utf8'))
    const next: Record<string, ThreadState> = {}
    if (raw && typeof raw === 'object') {
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        // 兼容旧格式：以前这里只存一个地址字符串
        if (typeof value === 'string') {
          next[key] = { url: value, sent: 0, seededAt: 0 }
          continue
        }
        const item = value as Partial<ThreadState> | null
        if (item && typeof item.url === 'string') {
          next[key] = {
            url: item.url,
            sent: Number(item.sent) || 0,
            seededAt: Number(item.seededAt) || 0,
          }
        }
      }
    }
    threads = next
  } catch {
    threads = {}
  }
}

function saveThreads() {
  try {
    fs.mkdirSync(path.dirname(THREAD_FILE), { recursive: true })
    fs.writeFileSync(THREAD_FILE, JSON.stringify(threads, null, 2), 'utf8')
  } catch {
    // 记住会话地址只是锦上添花，写失败不影响聊天
  }
}

loadThreads()

/** 去掉尾斜杠等无关差异，只比较 origin + pathname。 */
function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '')
  } catch {
    return url
  }
}

function isThreadUrl(url: string) {
  return /\/a\/chat\/s\/[0-9A-Za-z-]+/.test(url)
}

/**
 * 上次开发服务器被直接关掉时，Playwright 启动的浏览器可能变成孤儿进程继续占着配置目录，
 * 再次启动就会报“existing browser session”。这里只在启动失败时清一次我们自己的窗口。
 */
function killStaleBrowsers() {
  if (process.platform !== 'win32') return
  try {
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*browser-data*deepseek*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
      ],
      { stdio: 'ignore', timeout: 25_000 },
    )
  } catch {
    // 清理失败就交给下一次启动重试
  }
}

async function launch(): Promise<Page> {
  if (page && !page.isClosed()) return page
  const startContext = () =>
    chromium.launchPersistentContext(PROFILE_DIR, {
      headless: false,
      // 每次启动的窗口尺寸略有不同，固定尺寸本身就是一种特征
      viewport: { width: randomInt(1180, 1360), height: randomInt(820, 960) },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      args: ['--no-first-run', '--no-default-browser-check'],
    })
  try {
    context = await startContext()
  } catch (firstError) {
    // 配置目录被上一次遗留的窗口占着（Chrome 会提示“正在现有的浏览器会话中打开”），
    // 清掉我们自己启动的那批进程后重试一次。只清命令行里带本配置目录的窗口，不会动用户的浏览器。
    killStaleBrowsers()
    await wait(1500)
    context = await startContext().catch(() => {
      throw firstError
    })
  }
  context.on('close', () => {
    context = null
    page = null
  })
  const pages = context.pages()
  page = pages[0] ?? (await context.newPage())
  await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => undefined)
  return page
}

async function ensurePage(): Promise<Page> {
  if (page && !page.isClosed()) return page
  if (!launching) {
    launching = launch().finally(() => {
      launching = null
    })
  }
  return launching
}

const INPUT_SELECTORS = [
  'textarea[placeholder*="消息"]',
  'textarea[placeholder*="DeepSeek"]',
  'textarea',
  '[contenteditable="true"]',
]

/** 输入框在不同版本里的标签不一样，按优先级找第一个能看见的。 */
async function resolveInput(target: Page) {
  for (const selector of INPUT_SELECTORS) {
    const locator = target.locator(selector).first()
    if (await locator.isVisible().catch(() => false)) return locator
  }
  return null
}

/** 输入框是否存在，用来判断是否已经登录。 */
async function isLoggedIn(target: Page): Promise<boolean> {
  // 未登录时会被重定向到 sign_in，先按地址判断，避免把登录页的元素看错
  if (/sign_?in|\/login/i.test(target.url())) return false
  return Boolean(await resolveInput(target))
}

export async function status(): Promise<WebStatus> {
  if (!page || page.isClosed()) return { running: false, loggedIn: false }
  return { running: true, loggedIn: await isLoggedIn(page) }
}

/** 打开（或前置）浏览器窗口，让用户手动登录。已登录时不会跳走，保住当前会话。 */
export async function openForLogin(): Promise<WebStatus> {
  const target = await ensurePage()
  await target.bringToFront().catch(() => undefined)
  if (!(await isLoggedIn(target))) {
    await target.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => undefined)
  }
  return { running: true, loggedIn: await isLoggedIn(target) }
}

/** 真人感输入：短文本逐字敲；长文本整体粘贴（真人也会粘贴）。 */
async function typeLikeHuman(target: Page, text: string) {
  const input = await resolveInput(target)
  if (!input) throw new Error('找不到网页端输入框（页面结构可能已变化）')
  // 先滑到输入框附近，再像人一样把鼠标移过去点一下
  await scrollLikeHuman(target, 'down', randomInt(1, 3))
  await clickLikeHuman(target, input)
  await target.waitForTimeout(randomInt(150, 400))
  await input.fill('').catch(() => undefined)
  await target.waitForTimeout(randomInt(250, 700))

  if (text.length <= 160) {
    for (const char of text) {
      await target.keyboard.type(char)
      // 人的打字不是匀速的：偶尔停下来想一下
      const slowDown = Math.random() < 0.08 ? randomBetween(300, 700) : 0
      await target.waitForTimeout(randomBetween(55, 160) + slowDown)
    }
  } else {
    await target.keyboard.insertText(text)
    await target.waitForTimeout(randomBetween(400, 900))
  }
  // 打完字到按下发送之间留一点“看一眼再发”的间隔，手也从键盘上挪开
  await target.waitForTimeout(randomBetween(400, 1100))
}

/** 当前会话里助手消息的数量和最后一条内容，用来判断有没有新回复。 */
async function snapshot(target: Page) {
  const blocks = target.locator('.ds-markdown')
  const count = await blocks.count().catch(() => 0)
  const text = count ? ((await blocks.nth(count - 1).innerText().catch(() => '')) || '').trim() : ''
  return { count, text }
}

async function inputText(target: Page) {
  const input = await resolveInput(target)
  if (!input) return ''
  return ((await input.inputValue().catch(() => '')) || '').trim()
}

/** 回车发送；用“输入框是否被清空”确认真的发出去了，没发出去就再按一次。 */
async function submit(target: Page) {
  await target.keyboard.press('Enter')
  for (let i = 0; i < 10; i++) {
    await target.waitForTimeout(250)
    if (!(await inputText(target))) return
  }
  await target.keyboard.press('Enter')
  await target.waitForTimeout(900)
}

/** 等新回复流式输出结束：文本连续 2.2 秒不再变化。 */
async function waitForReply(target: Page, before: { count: number; text: string }, timeoutMs = 120_000) {
  const started = Date.now()
  let sawNew = false
  let last = ''
  let stableSince = 0
  while (Date.now() - started < timeoutMs) {
    await target.waitForTimeout(400)
    const current = await snapshot(target)
    if (!sawNew) {
      // 新回复出现：条数变多，或者最后一条内容不再是发送前那条
      if (current.count > before.count || (current.text && current.text !== before.text)) {
        sawNew = true
      } else {
        continue
      }
    }
    if (!current.text) continue
    if (current.text === last) {
      if (!stableSince) stableSince = Date.now()
      if (Date.now() - stableSince > 2200) return current.text
    } else {
      last = current.text
      stableSince = 0
    }
  }
  if (last) return last
  await target.screenshot({ path: path.join(PROFILE_DIR, 'web-timeout.png') }).catch(() => undefined)
  const info = await snapshot(target)
  throw new Error(`网页端没有返回内容（页面里回复块 ${info.count} 个，截图在 .browser-data/web-timeout.png）`)
}

/**
 * 在网页端说一句话并取回回复。
 * 同一 threadKey 复用同一条会话；只有这条会话的第一句才带上人物设定。
 */
export async function ask({ text, system, threadKey = 'default' }: WebAskParams): Promise<string> {
  const cleanText = String(text || '').trim()
  if (!cleanText) throw new Error('消息为空')

  return runExclusive(async () => {
    if (Date.now() < blockedUntil) {
      const left = Math.ceil((blockedUntil - Date.now()) / 1000)
      throw new Error(`网页端连续失败已暂停，${left} 秒后再试；可以先用「打开浏览器登录」看看窗口状态`)
    }
    const gap = nextRequestAt - Date.now()
    if (gap > 0) await wait(gap)
    scheduleNextGap()

    // 一个小时最多说这么多句，超了就休息，明摆着刷屏才是最容易被风控的
    const now = Date.now()
    while (recentRequests.length && now - recentRequests[0] > HOUR_MS) recentRequests.shift()
    if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
      throw new Error('这一小时网页端发得太多了，先歇一会儿再聊')
    }
    recentRequests.push(now)

    const target = await ensurePage()
    await target.bringToFront().catch(() => undefined)
    if (!(await isLoggedIn(target))) {
      throw new Error('DeepSeek 网页端未登录：点「打开浏览器登录」，登录后重试')
    }
    // 出现人机验证/滑块就停手，把窗口交还给人，不要再往里发东西
    const challenge = await detectChallenge(target)
    if (challenge) {
      throw new Error(`网页端出现「${challenge}」，已停止发送。请在那个浏览器窗口里手动完成验证，然后再试`)
    }

    const known = threads[threadKey]
    let firstMessage = false

    if (known) {
      // 回到这个好友自己的那条会话，网页端会自己恢复上下文
      if (normalizeUrl(target.url()) !== normalizeUrl(known.url)) {
        await target.goto(known.url, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => undefined)
        await target.waitForTimeout(randomBetween(900, 1800))
      }
      // 会话被删/地址失效时会落回首页，这时按新会话处理，补一次设定
      if (!isThreadUrl(target.url())) firstMessage = true
    } else {
      // 这个好友还没有会话：从首页开一条新的，避免串到别人的对话里
      if (normalizeUrl(target.url()) !== normalizeUrl(CHAT_URL)) {
        await target.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
        await target.waitForTimeout(randomBetween(900, 1800))
      }
      firstMessage = true
    }

    // 落地后先像人一样看一眼页面，再开始说话
    await glanceAtPage(target)

    const systemText = String(system || '').trim()
    // 会话被重置/地址失效时 known 已不可信，不能拿旧计数判断
    const resumeEntry = isThreadUrl(target.url()) ? known : undefined
    const needSeed = Boolean(systemText) && (firstMessage || shouldReseed(resumeEntry, threadKey))
    const prompt = needSeed ? composePrompt(systemText, cleanText, firstMessage) : cleanText

    const before = await snapshot(target)
    await typeLikeHuman(target, prompt)
    await submit(target)

    let reply: string
    try {
      reply = await waitForReply(target, before)
    } catch (error) {
      failStreak += 1
      if (failStreak >= MAX_FAIL_STREAK) {
        blockedUntil = Date.now() + FAIL_COOLDOWN_MS
        failStreak = 0
      }
      throw error
    }
    failStreak = 0

    const url = target.url()
    if (isThreadUrl(url)) {
      const normalized = `${new URL(url).origin}${new URL(url).pathname}`
      const prev = threads[threadKey]
      const sameThread = Boolean(prev && normalizeUrl(prev.url) === normalizeUrl(normalized))
      threads[threadKey] = {
        url: normalized,
        // 这一句带设定就重新计数，否则累加（决定下次什么时候再补设定）
        sent: needSeed ? 0 : sameThread ? prev.sent + 1 : 0,
        seededAt: needSeed ? Date.now() : sameThread && prev.seededAt ? prev.seededAt : Date.now(),
      }
      saveThreads()
    }
    return reply
  })
}

export async function shutdown() {
  await context?.close().catch(() => undefined)
  context = null
  page = null
}

/** 让某个好友的下一条消息重新开一条会话（对应“清空聊天记录”）。 */
export async function forgetThread(threadKey: string): Promise<void> {
  const known = threads[threadKey]
  delete threads[threadKey]
  saveThreads()
  const target = page
  if (!known || !target || target.isClosed()) return
  // 浏览器正停在这条旧会话上就退回首页，免得下一条又发进旧对话
  if (normalizeUrl(target.url()) === normalizeUrl(known.url)) {
    await target.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined)
  }
}

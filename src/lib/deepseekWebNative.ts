import { registerPlugin } from '@capacitor/core'

/**
 * Android 版 DeepSeek 网页端桥接。
 *
 * 和电脑上的 Playwright 方案目标一致：用户只登录一次，之后由程序在
 * chat.deepseek.com 的 WebView 里输入、发送、读取回复。
 * 原生插件只负责“隐藏 WebView + 登录窗口 + 执行 JS”，
 * 真正的人性化节奏、会话复用、限速逻辑都在这个文件里。
 */

type StatusResult = { running: boolean; loggedIn: boolean; url: string }
type LoadResult = { url: string }
type EvalResult = { value: string }

type DeepSeekWebPlugin = {
  status(): Promise<StatusResult>
  loadUrl(options: { url: string }): Promise<LoadResult>
  evalPage(options: { script: string }): Promise<EvalResult>
  currentUrl(): Promise<{ url: string }>
  openLogin(): Promise<{ loggedIn: boolean }>
  reload(): Promise<void>
}

const DeepSeekWeb = registerPlugin<DeepSeekWebPlugin>('DeepSeekWeb')

const CHAT_URL = 'https://chat.deepseek.com/'
const THREADS_KEY = 'deepseek-web-threads-v1'

// 两条消息之间的间隔：比电脑端略快一点，但仍然保留随机停顿，避免机器般的等间距
const GAP_MIN_MS = 4500
const GAP_MAX_MS = 11_000
const LONG_PAUSE_CHANCE = 0.1

const MAX_FAIL_STREAK = 3
const FAIL_COOLDOWN_MS = 5 * 60_000
const MAX_REQUESTS_PER_HOUR = 40
const HOUR_MS = 60 * 60_000

const SEED_TURNS_MIN = 12
const SEED_TURNS_SPAN = 5
const SEED_MAX_AGE_MS = 45 * 60_000

type ThreadState = { url: string; sent: number; seededAt: number }

let loadedUrl = ''
let loading: Promise<string> | null = null
let nextRequestAt = 0
let failStreak = 0
let blockedUntil = 0
let queue: Promise<unknown> = Promise.resolve()
let recentRequests: number[] = []
let cache: { at: number; value: StatusResult } | null = null

export type WebStatus = { running: boolean; loggedIn: boolean }

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

function readThreads(): Record<string, ThreadState> {
  try {
    const raw = JSON.parse(localStorage.getItem(THREADS_KEY) || '{}')
    const next: Record<string, ThreadState> = {}
    if (raw && typeof raw === 'object') {
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
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
    return next
  } catch {
    return {}
  }
}

function writeThreads(threads: Record<string, ThreadState>) {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads))
  } catch {
    // 会话地址只是锦上添花，存不下不影响聊天
  }
}

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

function composePrompt(system: string, text: string, brandNew: boolean) {
  if (!system) return text
  if (brandNew) return `${system}\n\n${text}`
  return `【提醒：按下面的设定继续聊，不用回应这段提醒，也不要重新自我介绍】\n${system}\n【提醒结束】\n${text}`
}

function scheduleNextGap() {
  const base = randomBetween(GAP_MIN_MS, GAP_MAX_MS)
  const extra = Math.random() < LONG_PAUSE_CHANCE ? randomBetween(12000, 30000) : 0
  nextRequestAt = Date.now() + base + extra
}

function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task)
  queue = next.catch(() => undefined)
  return next
}

/** evaluateJavascript 返回的是 JSON 值；我们的脚本返回 JSON 字符串，所以最多解两层。 */
function decode<T>(raw: string): T {
  const once = JSON.parse(raw)
  return (typeof once === 'string' ? JSON.parse(once) : once) as T
}

async function evalJson<T>(script: string): Promise<T> {
  const { value } = await DeepSeekWeb.evalPage({ script })
  if (!value || value === 'null') throw new Error('网页端没有返回数据（页面可能还没加载完）')
  return decode<T>(value)
}

async function ensureLoaded(url: string): Promise<string> {
  const target = normalizeUrl(url)
  if (loadedUrl && normalizeUrl(loadedUrl) === target) return loadedUrl
  if (loading) {
    await loading
    if (loadedUrl && normalizeUrl(loadedUrl) === target) return loadedUrl
  }
  const task = DeepSeekWeb.loadUrl({ url })
    .then((result: LoadResult) => {
      loadedUrl = result.url || url
      return loadedUrl
    })
    .finally(() => {
      loading = null
    })
  loading = task
  return task
}

type Probe = {
  url: string
  hasInput: boolean
  count: number
  last: string
  dialogs: string
  body?: string
  busy?: boolean
  error?: string
}

/**
 * 页面里的输入框查找：优先带“消息/输入/发送”标记的，其次选屏幕最底部那个。
 * DeepSeek 侧边栏偶尔也有 textarea，不能盲取第一个。
 */
const FIND_INPUT_JS = `
  function findInput() {
    var list = Array.prototype.slice.call(
      document.querySelectorAll('textarea, [contenteditable="true"]')
    ).filter(function (el) {
      var rect = el.getBoundingClientRect();
      return rect.width > 20 && rect.height > 10;
    });
    if (!list.length) return null;
    var preferred = list.filter(function (el) {
      var label = (el.getAttribute('placeholder') || '') + ' ' +
        (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('data-testid') || '');
      return /消息|输入|发送|message|ask|chat/i.test(label);
    })[0];
    if (preferred) return preferred;
    list.sort(function (a, b) {
      return b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom;
    });
    return list[0];
  }
`

async function probe(): Promise<Probe> {
  return evalJson<Probe>(`(function(){
    try {
      ${FIND_INPUT_JS}
      var input = findInput();
      var blocks = document.querySelectorAll('.ds-markdown');
      var last = blocks.length ? ((blocks[blocks.length - 1].innerText || '').trim()) : '';
      var zones = Array.prototype.slice.call(
        document.querySelectorAll('[role="dialog"],[class*="modal"],[class*="dialog"],[class*="verify"]')
      ).filter(function (el) {
        var rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      var dialogs = Array.prototype.slice.call(zones).map(function (el) { return el.innerText || ''; }).join('\\n').slice(0, 600);
      var bodyText = document.body ? document.body.innerText : '';
      // 生成期间 DeepSeek 会把发送按钮换成“停止生成”。这是判断还在不在写的可靠信号，
      // 不能只看“深度思考”四个字——输入框旁边一直挂着这个开关。
      var stop = Array.prototype.slice.call(document.querySelectorAll('button,[role="button"]')).some(function (el) {
        var label = (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '');
        if (!/stop|停止/i.test(label)) return false;
        var rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      // 只认按钮上的“停止”和独占一行的“思考中”，不认正文里的普通句子，
      // 否则好友说一句“我在思考中”就会一直等
      var busy = stop || /停止生成/.test(bodyText) || /^(?:DeepSeek\\s*)?(?:正在)?(?:思考|生成)中[.…]*$/m.test(bodyText);
      return JSON.stringify({
        url: location.href,
        hasInput: !!input,
        count: blocks.length,
        last: last,
        dialogs: dialogs,
        body: bodyText.slice(0, 1200),
        busy: busy
      });
    } catch (error) {
      return JSON.stringify({ url: location.href, hasInput: false, count: 0, last: '', dialogs: '', error: String(error) });
    }
  })()`)
}

function challengeOf(page: Probe): string | null {
  if (!page.dialogs) return null
  const hit = /人机验证|拖动滑块|滑动验证|请完成验证|安全验证|登录已过期|账号异常|操作频繁/.exec(page.dialogs)
  return hit ? hit[0] : null
}

/** 同域名下的登录弹窗：输入框还在，但其实发不出去。之前的“等半天没回复”很可能就是这个。 */
function loginWallOf(page: Probe): boolean {
  if (!page.dialogs) return false
  return /手机号登录|扫码登录|验证码登录|登录后继续|请先登录|登录\s*DeepSeek/i.test(page.dialogs)
}

/** SPA 页面 onPageFinished 之后还要等 React 把输入框渲染出来。 */
async function waitForPageReady(timeoutMs = 25_000): Promise<Probe> {
  const started = Date.now()
  let page = await probe()
  while (Date.now() - started < timeoutMs) {
    if (page.hasInput) return page
    if (/sign_?in|\/login/i.test(page.url)) return page
    await wait(450)
    page = await probe()
  }
  return page
}

async function typeText(text: string) {
  const result = await evalJson<{ ok: boolean; value?: string; error?: string }>(`(function(){
    try {
      ${FIND_INPUT_JS}
      var el = findInput();
      if (!el) return JSON.stringify({ ok: false, error: 'no-input' });
      if (el.tagName === 'TEXTAREA') {
        var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(el, ${JSON.stringify(text)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return JSON.stringify({ ok: true, value: el.value || '' });
      }
      el.focus();
      var selection = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('insertText', false, ${JSON.stringify(text)});
      return JSON.stringify({ ok: true, value: el.innerText || '' });
    } catch (error) {
      return JSON.stringify({ ok: false, error: String(error) });
    }
  })()`)
  if (!result.ok) throw new Error('找不到网页端输入框（页面结构可能已变化）')
}

async function pressEnter() {
  await evalJson<{ ok: boolean }>(`(function(){
    ${FIND_INPUT_JS}
    var el = findInput();
    if (!el) return JSON.stringify({ ok: false });
    ['keydown', 'keypress', 'keyup'].forEach(function (type) {
      el.dispatchEvent(new KeyboardEvent(type, {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
    });
    return JSON.stringify({ ok: true });
  })()`)
}

/** 回车没发出去时，退而求其次找发送按钮点一下。优先找带发送标记的，再找离输入框最近的按钮。 */
async function clickSendButton() {
  return evalJson<{ ok: boolean }>(`(function(){
    try {
      ${FIND_INPUT_JS}
      var el = findInput();
      if (!el) return JSON.stringify({ ok: false });
      var scope = el.closest('form');
      if (!scope) {
        var node = el;
        for (var i = 0; i < 5 && node.parentElement; i++) node = node.parentElement;
        scope = node;
      }
      var all = Array.prototype.slice.call(scope.querySelectorAll('button,[role="button"]')).filter(function (button) {
        return !button.disabled;
      });
      var labelled = all.filter(function (button) {
        var label = (button.getAttribute('aria-label') || '') + ' ' +
          (button.getAttribute('title') || '') + ' ' + (button.className || '');
        return /send|发送/i.test(label);
      });
      var target = labelled[0];
      if (!target) {
        var box = el.getBoundingClientRect();
        var best = null;
        var bestScore = 1e9;
        all.forEach(function (button) {
          var rect = button.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          var vertical = Math.abs((rect.top + rect.height / 2) - (box.top + box.height / 2));
          if (vertical > 120) return;
          var score = vertical + Math.abs(rect.right - box.right);
          if (score < bestScore) { bestScore = score; best = button; }
        });
        target = best;
      }
      if (!target) return JSON.stringify({ ok: false });
      target.click();
      return JSON.stringify({ ok: true });
    } catch (error) {
      return JSON.stringify({ ok: false });
    }
  })()`)
}

async function inputValue(): Promise<string> {
  const page = await probe()
  if (!page.hasInput) return ''
  return evalJson<string>(`(function(){
    ${FIND_INPUT_JS}
    var el = findInput();
    if (!el) return JSON.stringify('');
    return JSON.stringify((el.value || el.innerText || '').trim());
  })()`)
}

async function submit(): Promise<boolean> {
  await pressEnter()
  for (let i = 0; i < 6; i++) {
    await wait(250)
    if (!(await inputValue())) return true
  }
  await clickSendButton()
  await wait(900)
  return !(await inputValue())
}

async function waitForReply(before: { count: number; last: string }, timeoutMs = 120_000): Promise<string> {
  const started = Date.now()
  // 页面若仍在生成（深度思考 / 长回复），每轮把期限往后顺延，最多等 4 分钟。
  // 以前固定 90 秒，深度思考经常没写完就回退本地模型，看起来像“半天不回”。
  const hardLimit = started + 240_000
  let deadline = started + timeoutMs
  let sawNew = false
  let last = ''
  let stableSince = 0
  let lastPage: Probe | null = null
  while (Date.now() < deadline && Date.now() < hardLimit) {
    await wait(600)
    const page = await probe()
    lastPage = page
    if (/sign_?in|\/login/i.test(page.url)) {
      throw new Error('DeepSeek 网页端未登录：点「登录 DeepSeek」重新登录后再试')
    }
    const challenge = challengeOf(page)
    if (challenge) {
      throw new Error(`网页端出现「${challenge}」，已停止发送。请在登录窗口里手动处理后再试`)
    }
    if (loginWallOf(page)) {
      throw new Error('DeepSeek 网页端登录状态失效：点「登录 DeepSeek」重新登录后再试')
    }
    const failure = /服务器繁忙|网络异常|网络错误|发送失败|请稍后再试|请求过于频繁|内容过长|对话不存在/.exec(`${page.body || ''}
${page.dialogs || ''}`)
    if (failure) throw new Error(`网页端提示「${failure[0]}」，请稍后再试`)
    if (page.busy) deadline = Math.max(deadline, Math.min(hardLimit, Date.now() + 30_000))
    if (!sawNew) {
      if (page.count > before.count || (page.last && page.last !== before.last)) {
        sawNew = true
      } else {
        continue
      }
    }
    if (!page.last) continue
    if (page.last === last) {
      if (!stableSince) stableSince = Date.now()
      // 生成中文字可能停顿好几秒，别把半句话当最终回复
      const need = page.busy ? 12_000 : 2400
      if (Date.now() - stableSince > need) return page.last
    } else {
      last = page.last
      stableSince = 0
    }
  }
  // 等到上限时，有内容就先给用户，别为了“完整”直接回退成本地模型
  if (last) return last
  const seconds = Math.round((Date.now() - started) / 1000)
  const where = lastPage?.busy ? '页面仍在生成（可能开了深度思考）' : '页面已空闲'
  const url = lastPage?.url ? `，地址 ${lastPage.url.replace(/^https:\/\/chat\.deepseek\.com/, '')}` : ''
  throw new Error(`网页端 ${seconds} 秒没有取到回复（回复块 ${lastPage?.count ?? 0} 个，${where}${url}）`)
}

export type WebAskParams = {
  text: string
  system?: string
  threadKey?: string
}

/** 手机端：在隐藏 WebView 里说一句话并取回回复。 */
export async function askNativeWeb({ text, system, threadKey = 'default' }: WebAskParams): Promise<string> {
  const cleanText = String(text || '').trim()
  if (!cleanText) throw new Error('消息为空')

  return runExclusive(async () => {
    if (Date.now() < blockedUntil) {
      const left = Math.ceil((blockedUntil - Date.now()) / 1000)
      throw new Error(`网页端连续失败已暂停，${left} 秒后再试；可以点「登录 DeepSeek」看看窗口状态`)
    }
    const gap = nextRequestAt - Date.now()
    if (gap > 0) await wait(gap)
    scheduleNextGap()

    const now = Date.now()
    recentRequests = recentRequests.filter((at) => now - at <= HOUR_MS)
    if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
      throw new Error('这一小时网页端发得太多了，先歇一会儿再聊')
    }
    recentRequests.push(now)

    const threads = readThreads()
    const original = threads[threadKey]
    // 网页端输入框对超长设定不友好，压缩到 1200 字以内，降低发送失败概率
    const systemText = String(system || '').trim().slice(0, 1200)

    for (let attempt = 0; attempt < 2; attempt++) {
      const known = attempt === 0 ? original : undefined
      let sent = false
      try {
        const target = known && isThreadUrl(known.url) ? known.url : CHAT_URL
        await ensureLoaded(target)
        // 首页可能被上一次会话占着；重新按目标地址确认一次
        const landed = await DeepSeekWeb.currentUrl().catch(() => ({ url: target }))
        if (landed.url) loadedUrl = landed.url

        let page = await waitForPageReady()
        if (/sign_?in|\/login/i.test(page.url)) {
          throw new Error('DeepSeek 网页端未登录：点「登录 DeepSeek」，登录后重试')
        }
        if (!page.hasInput) {
          // 旧会话失效时不要直接报错，清掉记录后从首页重开一次
          if (known) {
            delete threads[threadKey]
            writeThreads(threads)
            continue
          }
          throw new Error('网页端没有找到输入框（页面可能还没加载完，或结构已变化）')
        }
        const challenge = challengeOf(page)
        if (challenge) {
          throw new Error(`网页端出现「${challenge}」，已停止发送。请在登录窗口里手动完成验证，然后再试`)
        }
        if (loginWallOf(page)) {
          throw new Error('DeepSeek 网页端登录状态失效：点「登录 DeepSeek」重新登录后再试')
        }

        let firstMessage = false
        if (!known) {
          firstMessage = true
          // 从首页开新会话，避免串到别人的对话里
          if (normalizeUrl(page.url) !== normalizeUrl(CHAT_URL)) {
            await ensureLoaded(CHAT_URL)
            page = await waitForPageReady()
          }
        } else if (!isThreadUrl(page.url)) {
          firstMessage = true
        }

        await wait(randomBetween(500, 1400))

        const resumeEntry = isThreadUrl(page.url) ? known : undefined
        const needSeed = Boolean(systemText) && (firstMessage || shouldReseed(resumeEntry, threadKey))
        const prompt = needSeed ? composePrompt(systemText, cleanText, firstMessage) : cleanText

        const before = { count: page.count, last: page.last }
        await typeText(prompt)
        await wait(randomBetween(500, 1200))
        sent = await submit()
        if (!sent) {
          if (known) {
            delete threads[threadKey]
            writeThreads(threads)
            continue
          }
          throw new Error('网页端没有把消息发出去，请稍后再试')
        }

        const reply = await waitForReply(before)
        failStreak = 0

        const after = await DeepSeekWeb.currentUrl().catch(() => ({ url: loadedUrl }))
        if (isThreadUrl(after.url)) {
          const normalized = `${new URL(after.url).origin}${new URL(after.url).pathname}`
          const prev = threads[threadKey]
          const sameThread = Boolean(prev && normalizeUrl(prev.url) === normalizeUrl(normalized))
          threads[threadKey] = {
            url: normalized,
            sent: needSeed ? 0 : sameThread ? prev.sent + 1 : 0,
            seededAt: needSeed ? Date.now() : sameThread && prev.seededAt ? prev.seededAt : Date.now(),
          }
          writeThreads(threads)
        }
        return reply
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        // 只有「还没发出去」才换新会话重试；已经发出去但等回复超时不重试，避免重复发送
        const retryable = Boolean(known) && !sent && !/未登录|登录状态|验证|暂停|太多|过于频繁/.test(message)
        if (retryable) {
          delete threads[threadKey]
          writeThreads(threads)
          await wait(1200)
          continue
        }
        if (known) {
          delete threads[threadKey]
          writeThreads(threads)
        }
        failStreak += 1
        if (failStreak >= MAX_FAIL_STREAK) {
          blockedUntil = Date.now() + FAIL_COOLDOWN_MS
          failStreak = 0
        }
        throw error
      }
    }
    throw new Error('网页端暂时没有回复，请稍后再试')
  })
}

/** 手机端状态：第一次查询会顺便把隐藏 WebView 打开。 */
export async function statusNativeWeb(force = false): Promise<WebStatus> {
  if (!force && cache && Date.now() - cache.at < 8000) {
    return { running: cache.value.running, loggedIn: cache.value.loggedIn }
  }
  let value: StatusResult
  try {
    const current = await DeepSeekWeb.status()
    if (!current.running) {
      await ensureLoaded(CHAT_URL)
      value = await DeepSeekWeb.status()
    } else {
      value = current
    }
    loadedUrl = value.url || loadedUrl
  } catch {
    value = { running: false, loggedIn: false, url: '' }
  }
  cache = { at: Date.now(), value }
  return { running: value.running, loggedIn: value.loggedIn }
}

/** 手机端登录：弹出可见的 WebView 窗口，登录一次即可。 */
export async function loginNativeWeb(): Promise<WebStatus> {
  const result = await DeepSeekWeb.openLogin()
  cache = null
  // 原生侧关窗后会自己 reload 隐藏页面；这里只需要让下一次状态查询重新探测
  loadedUrl = ''
  return { running: true, loggedIn: Boolean(result.loggedIn) }
}

/** 清空某个好友的网页端会话：下次说话会新开一条。 */
export async function forgetNativeWeb(threadKey: string): Promise<void> {
  const threads = readThreads()
  const known = threads[threadKey]
  delete threads[threadKey]
  writeThreads(threads)
  if (known && loadedUrl && normalizeUrl(known.url) === normalizeUrl(loadedUrl)) {
    await ensureLoaded(CHAT_URL).catch(() => undefined)
  }
}

/** 主界面启动时提前预热，让第一次网页端回复不用等页面加载。 */
export function warmUpNativeWeb() {
  if (loadedUrl) return
  void ensureLoaded(CHAT_URL).catch(() => undefined)
}

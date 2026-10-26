import { useApp } from '../store'
import { loadEvent } from './events'

const TICK_MS = 40_000
const FIRST_TICK_MS = 20_000
const MIN_SILENCE_MS = 15 * 60_000
const GLOBAL_COOLDOWN_MS = 10 * 60_000
const EVENT_REFRESH_MS = 30 * 60_000

let running = false
let busy = false

function inQuietHours(now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes()
  return minutes >= 23 * 60 + 30 || minutes < 7 * 60 + 30
}

let lastEventDate = new Date().toLocaleDateString('sv-SE')

async function refreshTodayEvent() {
  const key = new Date().toLocaleDateString('sv-SE')
  try {
    const content = (await loadEvent(key)).trim()
    const crossedDay = key !== lastEventDate
    lastEventDate = key
    const current = useApp.getState().todayEvent
    if (content) {
      if (content !== current) useApp.getState().setTodayEvent(content)
    } else if (crossedDay && current) {
      // 跨天且新一天还没写事件：清掉昨天的，免得好友一直聊昨天的事
      useApp.getState().setTodayEvent('')
    }
  } catch {
    // 文件/本地存储都不可用时保持现状
  }
}

async function tick() {
  if (busy) return
  const state = useApp.getState()
  if (!state.settings.ai.proactive) return
  if (inQuietHours()) return

  const friends = state.friends.filter((item) => item.status === 'friend')
  if (!friends.length) return

  const now = Date.now()
  const activity = friends.reduce((latest, friend) => {
    const updatedAt = state.conversations[friend.id]?.updatedAt ?? 0
    return Math.max(latest, updatedAt)
  }, 0)
  if (activity && now - activity < GLOBAL_COOLDOWN_MS) return

  const candidates = friends.filter((friend) => {
    const updatedAt = state.conversations[friend.id]?.updatedAt ?? 0
    return now - updatedAt >= MIN_SILENCE_MS
  })
  if (!candidates.length) return

  const scored = candidates.map((friend) => {
    const updatedAt = state.conversations[friend.id]?.updatedAt ?? 0
    const gapMinutes = (now - updatedAt) / 60000
    const mention = state.todayEvent.includes(friend.name) ? 1.6 : 1
    const score = Math.min(0.55, friend.persona.proactivity * (gapMinutes / 120) * mention)
    return { friend, score }
  })

  // 随机挑一位在线的候选好友，再按性格/沉默时长决定这一轮要不要开口
  const picked = scored[Math.floor(Math.random() * scored.length)]
  if (!picked || Math.random() > picked.score) return

  busy = true
  try {
    await state.triggerProactive(picked.friend.id)
  } finally {
    busy = false
  }
}

/** 打开网页期间：定时刷新今日事件文件，并让好友按真人节奏主动发消息。 */
export function startAIRuntime() {
  if (running) return () => {}
  running = true

  void refreshTodayEvent()
  const first = window.setTimeout(() => void tick(), FIRST_TICK_MS)
  const ticker = window.setInterval(() => void tick(), TICK_MS)
  const events = window.setInterval(() => void refreshTodayEvent(), EVENT_REFRESH_MS)

  return () => {
    running = false
    window.clearTimeout(first)
    window.clearInterval(ticker)
    window.clearInterval(events)
  }
}

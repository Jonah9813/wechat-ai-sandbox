const pad = (n: number) => String(n).padStart(2, '0')
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function formatClock(ts: number) {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatListTime(ts: number) {
  const d = new Date(ts)
  const today = startOfDay(new Date())
  const target = startOfDay(d)
  const diff = Math.round((today - target) / 86_400_000)
  if (diff <= 0) return formatClock(ts)
  if (diff === 1) return '昨天'
  if (diff < 7) return weekdays[d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatChatTime(ts: number) {
  const d = new Date(ts)
  const today = startOfDay(new Date())
  const target = startOfDay(d)
  const diff = Math.round((today - target) / 86_400_000)
  if (diff <= 0) return formatClock(ts)
  if (diff === 1) return `昨天 ${formatClock(ts)}`
  return `${d.getMonth() + 1}月${d.getDate()}日 ${formatClock(ts)}`
}

export function formatMomentTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  if (diff < 2 * 86_400_000) return '昨天'
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatEventDate(date = new Date()) {
  return date.toLocaleDateString('sv-SE')
}

import { CalendarDays, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavBar } from '../components/NavBar'
import { loadEvent, saveEvent } from '../lib/events'
import { isNative } from '../lib/platform'
import { formatEventDate } from '../lib/time'
import { useApp } from '../store'

export function EventsScreen() {
  const todayEvent = useApp((state) => state.todayEvent)
  const setTodayEvent = useApp((state) => state.setTodayEvent)
  const showToast = useApp((state) => state.showToast)
  const [text, setText] = useState(todayEvent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const date = formatEventDate()

  const load = async () => {
    setLoading(true)
    try {
      const content = await loadEvent(date)
      if (content.trim()) {
        setText(content)
        setTodayEvent(content)
        showToast('已读取今天的本地事件')
      } else {
        setText(todayEvent)
      }
    } catch {
      setText(todayEvent)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    setSaving(true)
    setTodayEvent(text)
    try {
      const result = await saveEvent(date, text)
      showToast(result === 'file' ? '已保存到本地事件文件' : '已保存到这台手机')
    } catch {
      showToast('已保存到本地状态')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page page--sub events-page">
      <NavBar
        back
        title="每日事件"
        right={
          <button type="button" className="nav-text-btn nav-text-btn--green" onClick={() => void save()} disabled={saving}>
            {saving ? '保存中' : '保存'}
          </button>
        }
      />
      <div className="scroll settings-scroll">
        <section className="event-hero">
          <div className="event-hero-icon">
            <CalendarDays size={24} strokeWidth={1.8} />
          </div>
          <div>
            <div className="event-hero-title">今天发生了什么</div>
            <div className="event-hero-sub">{date} · 好友会从这里找到话题</div>
          </div>
          <button type="button" className="event-refresh" onClick={() => void load()} aria-label="重新读取">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </section>

        <section className="event-editor">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="event-textarea"
            spellCheck={false}
            placeholder={`2026-10-26\n- 09:00 去牙科复查（小鹿知道）\n- 19:30 和大学同学吃饭\n- 心情：有点累`}
          />
        </section>

        <div className="event-file-line">
          {isNative() ? (
            <>保存位置：<code>手机 App 本地存储</code></>
          ) : (
            <>本地文件：<code>events/{date}.md</code></>
          )}
        </div>
        <p className="settings-footer event-footer">
          写人话就行，不需要学格式。好友会按关系和当天内容决定聊什么、关心什么。
          事件只影响对话话题和主动消息，不会替你做任何现实操作。
        </p>

        <section className="event-example">
          <div className="event-example-title">示例写法</div>
          <pre>{`2026-10-26
- 09:00 牙科复查（小鹿知道，可能会问疼不疼）
- 19:30 和大学同学吃饭
- 心情：有点累，但不想早睡`}</pre>
        </section>
      </div>
    </div>
  )
}

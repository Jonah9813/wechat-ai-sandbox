import { useEffect, useState } from 'react'

function clockText(date: Date) {
  const h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function StatusBar({ theme = 'light' }: { theme?: 'light' | 'dark' | 'green' | 'photo' | 'me' }) {
  const [time, setTime] = useState(() => clockText(new Date()))
  useEffect(() => {
    const timer = window.setInterval(() => setTime(clockText(new Date())), 20_000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className={`statusbar statusbar--${theme}`}>
      <div className="statusbar-time">{time}</div>
      <div className="statusbar-right" aria-hidden="true">
        <span className="statusbar-4g">4G</span>
        <svg width="18" height="12" viewBox="0 0 18 12">
          <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="5" y="6" width="3" height="6" rx="1" fill="currentColor" />
          <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
          <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 10.4c.7 0 1.2.5 1.2 1.1s-.5 1.1-1.2 1.1-1.2-.5-1.2-1.1.5-1.1 1.2-1.1Z" fill="currentColor" />
          <path d="M3.3 6.7c3-2.8 7.4-2.8 10.4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M.8 4.2c4.5-4.1 10.9-4.1 15.4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <div className="battery">
          <div className="battery-fill" />
        </div>
      </div>
    </div>
  )
}

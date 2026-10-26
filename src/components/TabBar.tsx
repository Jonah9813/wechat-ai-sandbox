import { useLocation, useNavigate } from 'react-router-dom'
import { TabIcon } from './TabIcon'
import { useApp } from '../store'

const tabs = [
  { key: 'chats', label: '微信', icon: 'chat' as const, path: '/chats' },
  { key: 'contacts', label: '通讯录', icon: 'contacts' as const, path: '/contacts' },
  { key: 'discover', label: '发现', icon: 'discover' as const, path: '/discover' },
  { key: 'me', label: '我', icon: 'me' as const, path: '/me' },
]

export function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const conversations = useApp((state) => state.conversations)
  const unread = Object.values(conversations).reduce((total, item) => total + item.unread, 0)
  const active =
    tabs.find((tab) => location.pathname.startsWith(tab.path))?.key ?? 'chats'

  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab ${active === tab.key ? 'tab--active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="tab-icon-wrap">
            <TabIcon name={tab.icon} active={active === tab.key} />
            {tab.key === 'chats' && unread > 0 ? (
              <span className="tab-badge">{unread > 99 ? '99+' : unread}</span>
            ) : null}
          </span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
      <div className="home-indicator" />
    </nav>
  )
}

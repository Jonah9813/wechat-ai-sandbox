import { useMemo, useState } from 'react'
import { BellOff, CirclePlus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Avatar } from '../components/Avatar'
import { NavBar } from '../components/NavBar'
import { TabBar } from '../components/TabBar'
import { formatListTime } from '../lib/time'
import { FileAssistantGlyph } from '../components/WxIcons'
import type { Message } from '../types'

function previewOf(message?: Message) {
  if (!message) return ''
  switch (message.type) {
    case 'image':
      return '[图片]'
    case 'voice':
      return `[语音] ${message.duration ?? 1}″`
    case 'sticker':
      return '[表情]'
    case 'redpacket':
      return '[微信红包]'
    case 'transfer':
      return '[转账]'
    case 'system':
      return message.content
    default:
      return message.content
  }
}

export function ChatsScreen() {
  const navigate = useNavigate()
  const friends = useApp((state) => state.friends)
  const conversations = useApp((state) => state.conversations)
  const messages = useApp((state) => state.messages)
  const showToast = useApp((state) => state.showToast)
  const [showPlus, setShowPlus] = useState(false)
  const incomingCount = friends.filter((friend) => friend.status === 'incoming').length

  const rows = useMemo(() => {
    return friends
      .filter((friend) => friend.status === 'friend' && conversations[friend.id])
      .map((friend) => {
        const list = messages.filter((message) => message.friendId === friend.id)
        const last = list[list.length - 1]
        const conversation = conversations[friend.id]
        return {
          friend,
          last,
          conversation,
          sortTime: conversation?.updatedAt ?? last?.createdAt ?? friend.createdAt,
        }
      })
      .sort((a, b) => {
        if (Boolean(a.conversation?.pinned) !== Boolean(b.conversation?.pinned)) {
          return a.conversation?.pinned ? -1 : 1
        }
        return b.sortTime - a.sortTime
      })
  }, [friends, conversations, messages])

  return (
    <div className="page page--tab">
      <NavBar
        title="微信"
        right={
          <>
            <button type="button" className="nav-icon-btn" aria-label="搜索" onClick={() => navigate('/search')}>
              <Search size={24} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className={`nav-icon-btn ${incomingCount > 0 ? 'nav-icon-btn--dot' : ''}`}
              aria-label="更多"
              onClick={() => setShowPlus(true)}
            >
              <CirclePlus size={25} strokeWidth={1.6} />
            </button>
          </>
        }
      />
      <div className="scroll chat-list">
        <button type="button" className="chat-row chat-row--system" onClick={() => showToast('文件传输助手为演示项')}>
          <div className="system-avatar system-avatar--file">
            <FileAssistantGlyph />
          </div>
          <div className="chat-body">
            <div className="chat-line">
              <span className="chat-name">文件传输助手</span>
              <span className="chat-time">10月6日</span>
            </div>
            <div className="chat-line chat-line--preview">
              <span className="chat-preview">[动画表情] 棒</span>
            </div>
          </div>
        </button>
        {rows.map(({ friend, last, conversation }) => {
          const unread = conversation?.unread ?? 0
          return (
            <button
              key={friend.id}
              type="button"
              className={`chat-row ${conversation?.pinned ? 'chat-row--pinned' : ''}`}
              onClick={() => navigate(`/chat/${friend.id}`)}
            >
              <div className="chat-avatar">
                <Avatar src={friend.avatar} name={friend.name} size={40} />
                {unread > 0 ? <span className="badge">{unread > 99 ? '99+' : unread}</span> : null}
              </div>
              <div className="chat-body">
                <div className="chat-line">
                  <span className="chat-name">{friend.name}</span>
                  <span className="chat-time">{formatListTime(conversation?.updatedAt ?? last?.createdAt ?? friend.createdAt)}</span>
                </div>
                <div className="chat-line chat-line--preview">
                  <span className="chat-preview">
                    {previewOf(last)}
                  </span>
                  {conversation?.muted ? <BellOff className="muted-mark" size={14} strokeWidth={1.8} /> : null}
                </div>
              </div>
            </button>
          )
        })}
        {rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">还没有聊天</div>
            <div className="empty-subtitle">去通讯录添加一个朋友吧</div>
          </div>
        ) : null}
      </div>
      <TabBar />
      {showPlus ? (
        <div className="sheet-mask" onClick={() => setShowPlus(false)}>
          <div className="action-sheet" onClick={(event) => event.stopPropagation()}>
            {[
              { label: '发起群聊', icon: '💬', action: () => showToast('群聊功能暂未开放') },
              { label: '添加朋友', icon: '👤', action: () => navigate('/add-friend') },
              { label: '扫一扫', icon: '▦', action: () => navigate('/scan') },
              { label: '收付款', icon: '💳', action: () => navigate('/pay') },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className="action-sheet-row"
                onClick={() => {
                  setShowPlus(false)
                  item.action()
                }}
              >
                <span className="action-sheet-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button type="button" className="action-sheet-cancel" onClick={() => setShowPlus(false)}>
              取消
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

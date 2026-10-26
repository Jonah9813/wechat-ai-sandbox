import {
  BellOff,
  Camera,
  CreditCard,
  Folder,
  Gift,
  Image as ImageIcon,
  Keyboard,
  MapPin,
  Mic,
  MoreHorizontal,
  Phone,
  Pin,
  Plus,
  Search,
  Smile,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { NavBar } from '../components/NavBar'
import { compressImage } from '../lib/image'
import { formatChatTime } from '../lib/time'
import { useApp } from '../store'
import type { Message } from '../types'

const emojis = ['😀', '😄', '😁', '😆', '😅', '😂', '🙂', '😉', '😊', '😍', '🥰', '😘', '😜', '🤪', '😎', '🤔', '😴', '😭', '😤', '🥺', '😳', '🙃', '😇', '🤗', '🤭', '🫠', '🌙', '☀️', '🌧️', '🍜', '☕', '🐱', '🌿', '✨', '❤️', '👍', '👋', '🎉', '📷', '🎧']

function messagePreview(message?: Message) {
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
    default:
      return message.content
  }
}

export function ChatScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const friend = useApp((state) => state.friends.find((item) => item.id === id))
  const allMessages = useApp((state) => state.messages)
  const conversation = useApp((state) => state.conversations[id])
  const setActiveChat = useApp((state) => state.setActiveChat)
  const markRead = useApp((state) => state.markRead)
  const sendText = useApp((state) => state.sendText)
  const sendVoice = useApp((state) => state.sendVoice)
  const sendImage = useApp((state) => state.sendImage)
  const sendSpecial = useApp((state) => state.sendSpecial)
  const toggleConversationFlag = useApp((state) => state.toggleConversationFlag)
  const clearChat = useApp((state) => state.clearChat)
  const showToast = useApp((state) => state.showToast)

  const messages = useMemo(
    () => allMessages.filter((message) => message.friendId === id),
    [allMessages, id],
  )
  const [draft, setDraft] = useState('')
  const [mode, setMode] = useState<'text' | 'voice' | 'emoji' | 'plus'>('text')
  const [showMore, setShowMore] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const recordStart = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActiveChat(id)
    return () => setActiveChat(null)
  }, [id, setActiveChat])

  useEffect(() => {
    markRead(id)
  }, [id, messages.length, markRead])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    const stick = () => {
      node.scrollTop = node.scrollHeight
    }
    stick()
    const timers = [60, 160, 320, 640, 1000].map((delay) => window.setTimeout(stick, delay))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [messages.length, mode])

  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = '0px'
    node.style.height = `${Math.min(node.scrollHeight, 96)}px`
  }, [draft, mode])

  if (!friend) {
    return (
      <div className="page page--sub">
        <NavBar back title="聊天" />
        <div className="empty-state">
          <div className="empty-title">聊天不存在</div>
        </div>
      </div>
    )
  }

  const send = () => {
    const clean = draft.trim()
    if (!clean) return
    void sendText(friend.id, clean)
    setDraft('')
    setMode('text')
    if (textareaRef.current) textareaRef.current.style.height = '0px'
  }

  const startVoice = () => {
    recordStart.current = Date.now()
    setRecording(true)
  }

  const finishVoice = () => {
    if (!recording) return
    setRecording(false)
    const elapsed = Date.now() - recordStart.current
    if (elapsed < 700) {
      showToast('说话时间太短')
      return
    }
    const seconds = Math.min(60, Math.max(1, Math.round(elapsed / 1000)))
    sendVoice(friend.id, seconds)
    setMode('text')
  }

  const pickImage = async (file?: File) => {
    if (!file) return
    try {
      const dataUrl = await compressImage(file, 1400, 0.82)
      sendImage(friend.id, dataUrl)
      setMode('text')
    } catch {
      showToast('图片处理失败')
    }
  }

  return (
    <div className="page page--sub chat-page">
      <NavBar
        back
        title={friend.name}
        right={
          <button type="button" className="nav-icon-btn" aria-label="更多" onClick={() => setShowMore(true)}>
            <MoreHorizontal size={24} strokeWidth={1.9} />
          </button>
        }
      />

      <div className="chat-scroll scroll" ref={scrollRef}>
        <div className="chat-date">{formatChatTime(messages[0]?.createdAt ?? Date.now())}</div>
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const showTime =
            index > 0 &&
            message.type !== 'system' &&
            previous &&
            message.createdAt - previous.createdAt > 5 * 60_000
          return (
            <div key={message.id}>
              {showTime ? <div className="chat-date chat-date--inline">{formatChatTime(message.createdAt)}</div> : null}
              {message.from === 'system' ? (
                <div className="system-line">{message.content}</div>
              ) : (
                <div className={`message-row ${message.from === 'me' ? 'message-row--me' : ''}`}>
                  <Avatar
                    src={message.from === 'me' ? '/avatars/me.avif' : friend.avatar}
                    name={message.from === 'me' ? '我' : friend.name}
                    size={36}
                    radius={5}
                    onClick={() => {
                      if (message.from !== 'me') navigate(`/friend/${friend.id}`)
                    }}
                  />
                  {message.type === 'text' ? (
                    <div className={`bubble ${message.from === 'me' ? 'bubble--me' : 'bubble--friend'}`}>
                      {message.content}
                    </div>
                  ) : null}
                  {message.type === 'voice' ? (
                    <button
                      type="button"
                      className={`bubble bubble--voice ${message.from === 'me' ? 'bubble--me' : 'bubble--friend'}`}
                      style={{ width: Math.min(190, 74 + (message.duration ?? 1) * 7) }}
                      onClick={() => showToast('语音播放为演示效果')}
                    >
                      <span className="voice-icon">
                        {message.from === 'me' ? '◉' : '◉'}
                      </span>
                      <span className="voice-wave" aria-hidden="true">
                        {[6, 12, 9, 15, 7, 11].map((height, i) => (
                          <span key={i} style={{ height }} />
                        ))}
                      </span>
                      <span className="voice-duration">{message.duration ?? 1}″</span>
                    </button>
                  ) : null}
                  {message.type === 'image' ? (
                    <button type="button" className="message-image-btn" onClick={() => setPreview(message.content)}>
                      <img
                        className="message-image"
                        src={message.content}
                        alt="图片消息"
                        loading="lazy"
                        onLoad={() => {
                          const node = scrollRef.current
                          if (node) node.scrollTop = node.scrollHeight
                        }}
                      />
                    </button>
                  ) : null}
                  {message.type === 'sticker' ? <div className="message-sticker">{message.content}</div> : null}
                  {message.type === 'redpacket' || message.type === 'transfer' ? (
                    <button
                      type="button"
                      className={`pay-message ${message.from === 'me' ? 'pay-message--me' : ''}`}
                      onClick={() => showToast('支付功能为演示壳')}
                    >
                      <span className="pay-message-icon">
                        {message.type === 'redpacket' ? <Gift size={20} /> : <CreditCard size={20} />}
                      </span>
                      <span className="pay-message-body">
                        <span className="pay-message-title">{message.content}</span>
                        <span className="pay-message-sub">
                          {message.type === 'redpacket' ? '微信红包' : '转账'}
                        </span>
                      </span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
        <div className="chat-bottom-space" />
      </div>

      <div className="composer">
        <div className="composer-row">
          <button
            type="button"
            className="composer-icon"
            aria-label="语音"
            onClick={() => {
              setMode(mode === 'voice' ? 'text' : 'voice')
              setTimeout(() => textareaRef.current?.focus(), 0)
            }}
          >
            {mode === 'voice' ? <Keyboard size={25} strokeWidth={1.8} /> : <Mic size={25} strokeWidth={1.8} />}
          </button>

          {mode === 'voice' ? (
            <button
              type="button"
              className={`voice-hold ${recording ? 'voice-hold--active' : ''}`}
              onPointerDown={startVoice}
              onPointerUp={finishVoice}
              onPointerCancel={finishVoice}
              onPointerLeave={() => {
                if (recording) finishVoice()
              }}
            >
              {recording ? '松开 结束' : '按住 说话'}
            </button>
          ) : (
            <div className="composer-input-wrap">
              <textarea
                ref={textareaRef}
                rows={1}
                value={draft}
                className="composer-input"
                placeholder=""
                onChange={(event) => setDraft(event.target.value)}
                onFocus={() => setMode('text')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send()
                  }
                }}
              />
              {!draft.trim() ? (
                <button
                  type="button"
                  className="composer-inner-mic"
                  aria-label="语音输入"
                  onClick={() => setMode('voice')}
                >
                  <Mic size={19} strokeWidth={1.8} />
                </button>
              ) : null}
            </div>
          )}

          {mode !== 'voice' ? (
            <button
              type="button"
              className="composer-emoji"
              aria-label="表情"
              onClick={() => setMode(mode === 'emoji' ? 'text' : 'emoji')}
            >
              <Smile size={24} strokeWidth={1.8} />
            </button>
          ) : null}

          {draft.trim() && mode !== 'voice' ? (
            <button type="button" className="send-btn" onClick={send}>
              发送
            </button>
          ) : (
            <button
              type="button"
              className={`composer-icon ${mode === 'plus' ? 'composer-icon--active' : ''}`}
              aria-label="更多功能"
              onClick={() => setMode(mode === 'plus' ? 'text' : 'plus')}
            >
              <Plus size={26} strokeWidth={1.8} />
            </button>
          )}
        </div>

        {mode === 'emoji' ? (
          <div className="emoji-panel">
            <div className="emoji-grid">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="emoji-btn"
                  onClick={() => {
                    setDraft((current) => current + emoji)
                    textareaRef.current?.focus()
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="emoji-delete"
              onClick={() => setDraft((current) => current.slice(0, -2))}
            >
              删除
            </button>
          </div>
        ) : null}

        {mode === 'plus' ? (
          <div className="plus-panel">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                void pickImage(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            {[
              { label: '相册', icon: <ImageIcon size={25} strokeWidth={1.7} />, action: () => fileRef.current?.click() },
              { label: '拍摄', icon: <Camera size={25} strokeWidth={1.7} />, action: () => showToast('拍摄为演示功能') },
              { label: '视频通话', icon: <Video size={25} strokeWidth={1.7} />, action: () => showToast('视频通话为演示壳') },
              { label: '位置', icon: <MapPin size={25} strokeWidth={1.7} />, action: () => showToast('位置为演示功能') },
              {
                label: '红包',
                icon: <Gift size={25} strokeWidth={1.7} />,
                action: () => {
                  sendSpecial(friend.id, 'redpacket', '恭喜发财，大吉大利')
                  setMode('text')
                },
              },
              {
                label: '转账',
                icon: <CreditCard size={25} strokeWidth={1.7} />,
                action: () => {
                  sendSpecial(friend.id, 'transfer', '¥ 88.88')
                  setMode('text')
                },
              },
              { label: '语音输入', icon: <Phone size={25} strokeWidth={1.7} />, action: () => showToast('语音输入为演示功能') },
              { label: '收藏', icon: <Folder size={25} strokeWidth={1.7} />, action: () => showToast('收藏为演示功能') },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className="plus-item"
                onClick={item.action}
              >
                <span className="plus-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {showMore ? (
        <div className="sheet-mask" onClick={() => setShowMore(false)}>
          <div className="action-sheet" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="action-sheet-row"
              onClick={() => {
                toggleConversationFlag(friend.id, 'muted')
                setShowMore(false)
                showToast(conversation?.muted ? '已开启消息免打扰' : '已关闭消息免打扰')
              }}
            >
              <BellOff size={19} /> {conversation?.muted ? '关闭消息免打扰' : '消息免打扰'}
            </button>
            <button
              type="button"
              className="action-sheet-row"
              onClick={() => {
                toggleConversationFlag(friend.id, 'pinned')
                setShowMore(false)
                showToast(conversation?.pinned ? '已取消置顶' : '已置顶聊天')
              }}
            >
              <Pin size={19} /> {conversation?.pinned ? '取消置顶' : '置顶聊天'}
            </button>
            <button
              type="button"
              className="action-sheet-row"
              onClick={() => {
                setShowMore(false)
                showToast('聊天记录搜索暂未开放')
              }}
            >
              <Search size={19} /> 查找聊天记录
            </button>
            <button
              type="button"
              className="action-sheet-row action-sheet-row--danger"
              onClick={() => {
                clearChat(friend.id)
                setShowMore(false)
                navigate('/chats')
              }}
            >
              <Trash2 size={19} /> 清空聊天记录
            </button>
            <button type="button" className="action-sheet-cancel" onClick={() => setShowMore(false)}>
              取消
            </button>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="image-preview" onClick={() => setPreview(null)}>
          <button type="button" className="image-preview-close" aria-label="关闭">
            <X size={26} />
          </button>
          <img src={preview} alt="图片预览" />
        </div>
      ) : null}
    </div>
  )
}

import { ChevronLeft, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useApp } from '../store'

export function SearchScreen() {
  const navigate = useNavigate()
  const friends = useApp((state) => state.friends)
  const messages = useApp((state) => state.messages)
  const moments = useApp((state) => state.moments)
  const showToast = useApp((state) => state.showToast)
  const [query, setQuery] = useState('')
  const keyword = query.trim()

  const contactResults = useMemo(() => {
    if (!keyword) return []
    return friends.filter((friend) =>
      [friend.name, friend.wechatId].join(' ').toLowerCase().includes(keyword.toLowerCase()),
    )
  }, [friends, keyword])

  const chatResults = useMemo(() => {
    if (!keyword) return []
    const seen = new Set<string>()
    return messages
      .filter((message) => message.type === 'text' && message.content.includes(keyword))
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((message) => {
        if (seen.has(message.friendId)) return false
        seen.add(message.friendId)
        return true
      })
      .slice(0, 6)
      .map((message) => ({
        message,
        friend: friends.find((friend) => friend.id === message.friendId),
      }))
      .filter((item) => item.friend)
  }, [friends, keyword, messages])

  const momentResults = useMemo(() => {
    if (!keyword) return []
    return moments.filter((moment) => moment.content.includes(keyword)).slice(0, 5)
  }, [keyword, moments])

  const hasResults = contactResults.length + chatResults.length + momentResults.length > 0

  return (
    <div className="page page--sub search-page">
      <div className="search-header">
        <button type="button" className="search-back" aria-label="返回" onClick={() => navigate(-1)}>
          <ChevronLeft size={27} strokeWidth={1.7} />
        </button>
        <div className="search-header-input">
          <Search size={17} strokeWidth={1.8} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索"
          />
        </div>
        <button type="button" className="search-cancel" onClick={() => navigate(-1)}>
          取消
        </button>
      </div>

      <div className="scroll search-scroll">
        {!keyword ? (
          <>
            <div className="search-section-label">搜索指定内容</div>
            <div className="search-suggest-grid">
              {['朋友圈', '文章', '公众号', '小程序', '音乐', '表情'].map((item) => (
                <button key={item} type="button" onClick={() => showToast(`${item}搜索暂未接入`)}>
                  {item}
                </button>
              ))}
            </div>
            <div className="search-section-label">最近搜索</div>
            <div className="search-recent">
              {['小鹿', '冒菜', '照片'].map((item) => (
                <button key={item} type="button" onClick={() => setQuery(item)}>
                  {item}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {contactResults.length > 0 ? (
              <section className="search-result-group">
                <div className="search-section-label">联系人</div>
                {contactResults.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    className="search-contact-row"
                    onClick={() => navigate(`/friend/${friend.id}`)}
                  >
                    <Avatar src={friend.avatar} name={friend.name} size={40} radius={5} />
                    <span className="search-contact-name">{friend.name}</span>
                    <span className="search-contact-id">{friend.wechatId}</span>
                  </button>
                ))}
              </section>
            ) : null}

            {chatResults.length > 0 ? (
              <section className="search-result-group">
                <div className="search-section-label">聊天记录</div>
                {chatResults.map(({ message, friend }) => (
                  <button
                    key={message.id}
                    type="button"
                    className="search-chat-row"
                    onClick={() => navigate(`/chat/${friend!.id}`)}
                  >
                    <Avatar src={friend!.avatar} name={friend!.name} size={40} radius={5} />
                    <span className="search-chat-body">
                      <span className="search-chat-name">{friend!.name}</span>
                      <span className="search-chat-snippet">{message.content}</span>
                    </span>
                  </button>
                ))}
              </section>
            ) : null}

            {momentResults.length > 0 ? (
              <section className="search-result-group">
                <div className="search-section-label">朋友圈</div>
                {momentResults.map((moment) => (
                  <button
                    key={moment.id}
                    type="button"
                    className="search-moment-row"
                    onClick={() => navigate('/moments')}
                  >
                    <span className="search-moment-content">{moment.content}</span>
                    <span className="search-moment-meta">
                      {friends.find((friend) => friend.id === moment.authorId)?.name ?? '我'}
                    </span>
                  </button>
                ))}
              </section>
            ) : null}

            {!hasResults ? (
              <div className="empty-state">
                <div className="empty-title">没有找到“{keyword}”</div>
                <div className="empty-subtitle">换个关键词试试</div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

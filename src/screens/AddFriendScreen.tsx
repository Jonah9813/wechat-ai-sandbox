import { useMemo, useState } from 'react'
import { QrCode, ScanLine, Search, Smartphone, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { NavBar } from '../components/NavBar'
import { useApp } from '../store'

export function AddFriendScreen() {
  const navigate = useNavigate()
  const friends = useApp((state) => state.friends)
  const me = useApp((state) => state.me)
  const sendFriendRequest = useApp((state) => state.sendFriendRequest)
  const acceptRequest = useApp((state) => state.acceptRequest)
  const showToast = useApp((state) => state.showToast)
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const incomingCount = friends.filter((friend) => friend.status === 'incoming').length

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return []
    return friends.filter((friend) =>
      [friend.name, friend.wechatId, friend.region]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [friends, query])

  const doSearch = () => {
    if (!query.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="page page--sub add-friend-page">
      <NavBar back title="添加朋友" />
      <div className="scroll">
        <div className="add-search-wrap">
          <div className="add-search">
            <Search size={18} strokeWidth={1.8} />
            <input
              value={query}
              autoFocus
              onChange={(event) => {
                setQuery(event.target.value)
                setSubmitted(false)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') doSearch()
              }}
              placeholder="微信号/手机号"
            />
          </div>
          <button type="button" className="add-search-btn" onClick={doSearch}>
            搜索
          </button>
        </div>

        {!submitted || !query.trim() ? (
          <>
            <section className="add-block">
              <button type="button" className="add-row" onClick={() => navigate('/my-qr')}>
                <span className="add-row-icon add-row-icon--green"><QrCode size={19} strokeWidth={1.8} /></span>
                <span className="add-row-body">
                  <span className="add-row-title">我的微信号</span>
                  <span className="add-row-sub">{me.wechatId}</span>
                </span>
                <span className="add-row-arrow">›</span>
              </button>
              <button type="button" className="add-row" onClick={() => navigate('/scan')}>
                <span className="add-row-icon add-row-icon--blue"><ScanLine size={19} strokeWidth={1.8} /></span>
                <span className="add-row-body">
                  <span className="add-row-title">扫一扫</span>
                  <span className="add-row-sub">扫描二维码名片</span>
                </span>
                <span className="add-row-arrow">›</span>
              </button>
              <button type="button" className="add-row" onClick={() => showToast('手机联系人暂未接入')}>
                <span className="add-row-icon add-row-icon--green"><Smartphone size={19} strokeWidth={1.8} /></span>
                <span className="add-row-body">
                  <span className="add-row-title">手机联系人</span>
                  <span className="add-row-sub">添加通讯录中的朋友</span>
                </span>
                <span className="add-row-arrow">›</span>
              </button>
              <button type="button" className="add-row" onClick={() => navigate('/new-friends')}>
                <span className="add-row-icon add-row-icon--orange"><UserPlus size={19} strokeWidth={1.8} /></span>
                <span className="add-row-body">
                  <span className="add-row-title">新的朋友</span>
                  <span className="add-row-sub">查看好友申请</span>
                </span>
                {incomingCount > 0 ? <span className="mini-badge">{incomingCount}</span> : null}
                <span className="add-row-arrow">›</span>
              </button>
            </section>
            <p className="add-tip">账号搜索支持姓名、微信号和地区。好友均为本地演示角色。</p>
          </>
        ) : (
          <section className="search-results">
            {results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">该用户不存在</div>
                <div className="empty-subtitle">试试搜索“小满”或“guyan_88”</div>
              </div>
            ) : (
              results.map((friend) => (
                <div key={friend.id} className="search-result-card">
                  <Avatar src={friend.avatar} name={friend.name} size={52} radius={6} />
                  <div className="search-result-body">
                    <div className="search-result-name">{friend.name}</div>
                    <div className="search-result-id">微信号：{friend.wechatId}</div>
                    <div className="search-result-region">地区：{friend.region}</div>
                  </div>
                  {friend.status === 'friend' ? (
                    <button type="button" className="add-action add-action--ghost" onClick={() => navigate(`/chat/${friend.id}`)}>
                      发消息
                    </button>
                  ) : friend.status === 'outgoing' ? (
                    <button type="button" className="add-action add-action--disabled" disabled>
                      等待验证
                    </button>
                  ) : friend.status === 'incoming' ? (
                    <button
                      type="button"
                      className="add-action"
                      onClick={() => {
                        acceptRequest(friend.id)
                        navigate(`/chat/${friend.id}`)
                      }}
                    >
                      接受
                    </button>
                  ) : (
                    <button type="button" className="add-action" onClick={() => sendFriendRequest(friend.id)}>
                      添加
                    </button>
                  )}
                </div>
              ))
            )}
          </section>
        )}
      </div>
    </div>
  )
}

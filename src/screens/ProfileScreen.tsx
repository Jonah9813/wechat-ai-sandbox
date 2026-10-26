import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { NavBar } from '../components/NavBar'
import { useApp } from '../store'

export function ProfileScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const friend = useApp((state) => state.friends.find((item) => item.id === id))
  const moments = useApp((state) => state.moments)
  const acceptRequest = useApp((state) => state.acceptRequest)
  const sendFriendRequest = useApp((state) => state.sendFriendRequest)
  const clearChat = useApp((state) => state.clearChat)
  const showToast = useApp((state) => state.showToast)
  const [confirmClear, setConfirmClear] = useState(false)

  if (!friend) {
    return (
      <div className="page page--sub">
        <NavBar back title="详细资料" />
        <div className="empty-state">
          <div className="empty-title">用户不存在</div>
        </div>
      </div>
    )
  }

  const friendMoments = moments.filter((moment) => moment.authorId === friend.id).slice(0, 3)

  return (
    <div className="page page--sub profile-page">
      <NavBar
        back
        title="详细资料"
        right={
          <button
            type="button"
            className="nav-icon-btn"
            aria-label="更多"
            onClick={() => showToast('更多资料暂未开放')}
          >
            <MoreHorizontal size={24} strokeWidth={1.9} />
          </button>
        }
      />
      <div className="scroll">
        <section className="profile-hero">
          <Avatar src={friend.avatar} name={friend.name} size={64} radius={7} />
          <div className="profile-hero-info">
            <div className="profile-name">{friend.name}</div>
            <div className="profile-line">微信号：{friend.wechatId}</div>
            <div className="profile-line">地区：{friend.region}</div>
          </div>
        </section>

        <section className="profile-actions">
          {friend.status === 'friend' ? (
            <button type="button" className="profile-main-btn" onClick={() => navigate(`/chat/${friend.id}`)}>
              发消息
            </button>
          ) : friend.status === 'incoming' ? (
            <button
              type="button"
              className="profile-main-btn"
              onClick={() => {
                acceptRequest(friend.id)
                navigate(`/chat/${friend.id}`)
              }}
            >
              接受好友申请
            </button>
          ) : friend.status === 'outgoing' ? (
            <button type="button" className="profile-main-btn profile-main-btn--ghost" disabled>
              等待验证
            </button>
          ) : (
            <button type="button" className="profile-main-btn" onClick={() => sendFriendRequest(friend.id)}>
              添加到通讯录
            </button>
          )}
        </section>

        {friend.requestMessage ? (
          <section className="profile-request-card">
            <span className="profile-request-label">验证消息</span>
            <p>{friend.requestMessage}</p>
          </section>
        ) : null}

        <section className="profile-section">
          <div className="profile-section-head">
            <span>朋友圈</span>
            {friendMoments.length > 0 ? (
              <button type="button" className="profile-section-more" onClick={() => navigate('/moments')}>
                查看全部 ›
              </button>
            ) : null}
          </div>
          {friendMoments.length > 0 ? (
            <div className="profile-moments">
              {friendMoments.map((moment) =>
                moment.images[0] ? (
                  <button type="button" key={moment.id} onClick={() => navigate('/moments')}>
                    <img src={moment.images[0]} alt="" />
                  </button>
                ) : (
                  <button type="button" key={moment.id} className="profile-moment-text" onClick={() => navigate('/moments')}>
                    {moment.content}
                  </button>
                ),
              )}
            </div>
          ) : (
            <button type="button" className="profile-empty-moment" onClick={() => navigate('/moments')}>
              还没有朋友圈动态
            </button>
          )}
        </section>

        <section className="profile-section profile-links">
          <button type="button" onClick={() => showToast('备注与标签暂未开放')}>
            <span>备注与标签</span>
            <span>{friend.name} ›</span>
          </button>
          <button type="button" onClick={() => showToast('朋友权限暂未开放')}>
            <span>朋友权限</span>
            <span>聊天、朋友圈、微信运动 ›</span>
          </button>
          <button type="button" onClick={() => showToast('更多信息暂未开放')}>
            <span>更多信息</span>
            <span>›</span>
          </button>
          <button type="button" onClick={() => setConfirmClear(true)} disabled={friend.status !== 'friend'}>
            <span>清空聊天记录</span>
            <span>›</span>
          </button>
        </section>
      </div>

      {confirmClear ? (
        <div className="sheet-mask" onClick={() => setConfirmClear(false)}>
          <div className="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="dialog-title">清空和「{friend.name}」的聊天记录？</div>
            <div className="dialog-text">记录会从本机删除，之后的聊天从头开始，不会带上之前的对话。</div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setConfirmClear(false)}>取消</button>
              <button
                type="button"
                className="dialog-danger"
                onClick={() => {
                  clearChat(friend.id)
                  setConfirmClear(false)
                  showToast('已清空聊天记录')
                }}
              >
                清空
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

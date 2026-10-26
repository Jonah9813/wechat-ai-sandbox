import { UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { NavBar } from '../components/NavBar'
import { useApp } from '../store'

export function NewFriendsScreen() {
  const navigate = useNavigate()
  const friends = useApp((state) => state.friends)
  const acceptRequest = useApp((state) => state.acceptRequest)
  const requests = friends.filter((friend) => friend.status === 'incoming' || friend.status === 'outgoing')

  return (
    <div className="page page--sub">
      <NavBar
        back
        title="新的朋友"
        right={
          <button type="button" className="nav-text-btn" onClick={() => navigate('/add-friend')}>
            添加朋友
          </button>
        }
      />
      <div className="scroll new-friends-scroll">
        <button type="button" className="new-friend-add" onClick={() => navigate('/add-friend')}>
          <span className="new-friend-add-icon">
            <UserPlus size={24} strokeWidth={1.7} />
          </span>
          <span>添加朋友</span>
        </button>

        {requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">暂无新的朋友</div>
            <div className="empty-subtitle">点击上方“添加朋友”去找一个人</div>
          </div>
        ) : (
          requests.map((friend) => (
            <div key={friend.id} className="request-row">
              <Avatar src={friend.avatar} name={friend.name} size={48} radius={6} />
              <div className="request-body">
                <div className="request-name">{friend.name}</div>
                <div className="request-message">{friend.requestMessage ?? '请求添加你为朋友'}</div>
              </div>
              {friend.status === 'incoming' ? (
                <button
                  type="button"
                  className="request-btn"
                  onClick={() => {
                    acceptRequest(friend.id)
                    navigate(`/chat/${friend.id}`)
                  }}
                >
                  接受
                </button>
              ) : (
                <span className="request-pending">等待验证</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

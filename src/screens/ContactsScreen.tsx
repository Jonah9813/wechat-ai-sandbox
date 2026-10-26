import { useMemo } from 'react'
import { CirclePlus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Avatar } from '../components/Avatar'
import { NavBar } from '../components/NavBar'
import { TabBar } from '../components/TabBar'
import { ContactTile } from '../components/WxIcons'

export function ContactsScreen() {
  const navigate = useNavigate()
  const friends = useApp((state) => state.friends)
  const showToast = useApp((state) => state.showToast)
  const incomingCount = friends.filter((friend) => friend.status === 'incoming').length

  const groups = useMemo(() => {
    const list = friends.filter((friend) => friend.status === 'friend')
    const map = new Map<string, typeof list>()
    list
      .slice()
      .sort((a, b) => a.initial.localeCompare(b.initial) || a.name.localeCompare(b.name, 'zh-Hans-CN'))
      .forEach((friend) => {
        const key = friend.initial || '#'
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(friend)
      })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [friends])

  return (
    <div className="page page--tab contacts-page">
      <NavBar
        title="通讯录"
        right={
          <>
            <button type="button" className="nav-icon-btn" aria-label="搜索" onClick={() => navigate('/search')}>
              <Search size={24} strokeWidth={1.8} />
            </button>
            <button type="button" className="nav-icon-btn" aria-label="添加朋友" onClick={() => navigate('/add-friend')}>
              <CirclePlus size={25} strokeWidth={1.6} />
            </button>
          </>
        }
      />
      <div className="scroll contacts-scroll">
        <div className="contacts-group contacts-group--first">
          <button type="button" className="contact-func" onClick={() => navigate('/new-friends')}>
            <ContactTile kind="new" />
            <span className="contact-func-name">新的朋友</span>
            {incomingCount > 0 ? <span className="mini-badge">{incomingCount}</span> : null}
          </button>
          <button type="button" className="contact-func" onClick={() => showToast('仅聊天的朋友暂未接入')}>
            <ContactTile kind="chatOnly" />
            <span className="contact-func-name">仅聊天的朋友</span>
          </button>
          <button type="button" className="contact-func" onClick={() => showToast('群聊功能暂未开放')}>
            <ContactTile kind="group" />
            <span className="contact-func-name">群聊</span>
          </button>
          <button type="button" className="contact-func" onClick={() => showToast('标签功能暂未开放')}>
            <ContactTile kind="tag" />
            <span className="contact-func-name">标签</span>
          </button>
          <button type="button" className="contact-func" onClick={() => showToast('公众号暂未接入')}>
            <ContactTile kind="official" />
            <span className="contact-func-name">公众号</span>
          </button>
          <button type="button" className="contact-func" onClick={() => showToast('服务号暂未接入')}>
            <ContactTile kind="service" />
            <span className="contact-func-name">服务号</span>
          </button>
        </div>

        <div className="contacts-enterprise-label">我的企业及企业联系人</div>
        <div className="contacts-group contacts-group--enterprise">
          <button type="button" className="contact-func" onClick={() => showToast('企业微信联系人暂未接入')}>
            <ContactTile kind="enterprise" />
            <span className="contact-func-name">企业微信联系人</span>
          </button>
        </div>

        {groups.map(([initial, list]) => (
          <section key={initial} className="contact-section">
            <div className="section-letter">{initial}</div>
            {list.map((friend) => (
              <button
                key={friend.id}
                type="button"
                className="contact-row"
                onClick={() => navigate(`/friend/${friend.id}`)}
              >
                <Avatar src={friend.avatar} name={friend.name} size={40} radius={5} />
                <span className="contact-name">{friend.name}</span>
              </button>
            ))}
          </section>
        ))}
      </div>
      <div className="contact-index" aria-hidden="true">
        {['↑', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'].map((letter) => (
          <span key={letter}>{letter}</span>
        ))}
      </div>
      <TabBar />
    </div>
  )
}

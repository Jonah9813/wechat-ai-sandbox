import { ChevronRight, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Avatar } from '../components/Avatar'
import { TabBar } from '../components/TabBar'
import {
  CubeGlyph,
  EmojiGlyph,
  PhotoGlyph,
  ServiceGlyph,
  SettingsGlyph,
  StoreGlyph,
  WorksGlyph,
} from '../components/WxIcons'

export function MeScreen() {
  const navigate = useNavigate()
  const me = useApp((state) => state.me)
  const friends = useApp((state) => state.friends)
  const showToast = useApp((state) => state.showToast)
  const friendCount = friends.filter((friend) => friend.status === 'friend').length
  const miniAvatar = friends.find((friend) => friend.status === 'friend')?.avatar

  return (
    <div className="page page--tab me-page">
      <div className="scroll me-scroll">
        <section className="me-profile">
          <div className="me-profile-main">
            <Avatar src={me.avatar} name={me.name} size={64} radius={8} />
            <div className="me-profile-info">
              <div className="me-name">{me.name}</div>
              <button type="button" className="me-id-row" onClick={() => showToast('个人资料为演示项')}>
                <span>微信号：{me.wechatId}</span>
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
              <div className="me-pills">
                <button type="button" className="me-pill" onClick={() => showToast('状态功能暂未接入')}>
                  ＋ 状态
                </button>
                <button type="button" className="me-pill me-pill--friends" onClick={() => navigate('/contacts')}>
                  <span className="me-pill-avatar">
                    {miniAvatar ? <img src={miniAvatar} alt="" /> : null}
                  </span>
                  {friendCount}个朋友
                  <span className="red-dot" />
                </button>
              </div>
            </div>
          </div>
          <button type="button" className="me-qr" aria-label="我的二维码" onClick={() => navigate('/my-qr')}>
            <QrCode size={22} strokeWidth={1.7} />
          </button>
        </section>

        <section className="me-card me-service" onClick={() => navigate('/services')} role="button" tabIndex={0}>
          <div className="me-service-left">
            <ServiceGlyph size={22} />
            <span>服务</span>
          </div>
          <ChevronRight size={19} strokeWidth={1.5} color="var(--wx-tertiary)" />
        </section>

        <section className="me-card">
          <button type="button" className="me-row" onClick={() => showToast('收藏功能暂未接入')}>
            <CubeGlyph size={22} className="me-row-icon" />
            <span className="me-row-label">收藏</span>
            <ChevronRight size={18} strokeWidth={1.5} className="me-arrow" />
          </button>
          <button type="button" className="me-row" onClick={() => navigate('/moments')}>
            <PhotoGlyph size={22} className="me-row-icon" />
            <span className="me-row-label">朋友圈</span>
            <ChevronRight size={18} strokeWidth={1.5} className="me-arrow" />
          </button>
          <button type="button" className="me-row" onClick={() => showToast('作品功能暂未接入')}>
            <WorksGlyph size={22} className="me-row-icon" />
            <span className="me-row-label">作品</span>
            <ChevronRight size={18} strokeWidth={1.5} className="me-arrow" />
          </button>
          <button type="button" className="me-row" onClick={() => navigate('/services')}>
            <StoreGlyph size={22} className="me-row-icon" />
            <span className="me-row-label">小店与卡包</span>
            <span className="me-row-preview">[热卖5000+]东鹏特饮秋冬运动饮料</span>
            <span className="red-dot" />
            <ChevronRight size={18} strokeWidth={1.5} className="me-arrow" />
          </button>
          <button type="button" className="me-row me-row--last" onClick={() => showToast('表情商店暂未接入')}>
            <EmojiGlyph className="me-row-icon" />
            <span className="me-row-label">表情</span>
            <ChevronRight size={18} strokeWidth={1.5} className="me-arrow" />
          </button>
        </section>

        <section className="me-card">
          <button type="button" className="me-row me-row--last" onClick={() => navigate('/settings')}>
            <SettingsGlyph className="me-row-icon" />
            <span className="me-row-label">设置</span>
            <ChevronRight size={18} strokeWidth={1.5} className="me-arrow" />
          </button>
        </section>
      </div>
      <TabBar />
    </div>
  )
}

import { CirclePlus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { NavBar } from '../components/NavBar'
import { TabBar } from '../components/TabBar'
import {
  ChannelsGlyph,
  ListenGlyph,
  MiniGlyph,
  MomentsGlyph,
  NearbyGlyph,
  ScanGlyph,
  SearchGlyph,
} from '../components/WxIcons'

function DiscoverRow({
  glyph,
  label,
  onClick,
  badge,
  last,
}: {
  glyph: React.ReactNode
  label: string
  onClick: () => void
  badge?: boolean
  last?: boolean
}) {
  return (
    <button type="button" className={`discover-row ${last ? 'discover-row--last' : ''}`} onClick={onClick}>
      <span className="discover-glyph">{glyph}</span>
      <span className="discover-label">{label}</span>
      {badge ? <span className="red-dot" /> : null}
      <span className="discover-arrow">›</span>
    </button>
  )
}

export function DiscoverScreen() {
  const navigate = useNavigate()
  const showToast = useApp((state) => state.showToast)

  return (
    <div className="page page--tab">
      <NavBar
        title="发现"
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
      <div className="scroll discover-scroll">
        <div className="discover-group">
          <DiscoverRow
            glyph={<MomentsGlyph />}
            label="朋友圈"
            last
            onClick={() => navigate('/moments')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<ChannelsGlyph />}
            label="视频号"
            last
            onClick={() => showToast('视频号暂未接入')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<ScanGlyph />}
            label="扫一扫"
            onClick={() => navigate('/scan')}
          />
          <DiscoverRow
            glyph={<ListenGlyph />}
            label="听一听"
            last
            onClick={() => showToast('听一听暂未接入')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<SearchGlyph />}
            label="搜一搜"
            last
            onClick={() => navigate('/search')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<NearbyGlyph />}
            label="附近"
            last
            onClick={() => showToast('附近暂未接入')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<MiniGlyph />}
            label="小程序"
            last
            onClick={() => showToast('小程序暂未接入')}
          />
        </div>
      </div>
      <TabBar />
    </div>
  )
}

import {
  Bell,
  CalendarDays,
  ChevronRight,
  HelpCircle,
  Info,
  Lock,
  MessageCircle,
  Moon,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, CellGroup, IconTile, Switch } from '../components/Cell'
import { NavBar } from '../components/NavBar'
import { aiReady, providerConfig, PROVIDER_LABELS } from '../lib/ai'
import { useApp } from '../store'

export function SettingsScreen() {
  const navigate = useNavigate()
  const settings = useApp((state) => state.settings)
  const me = useApp((state) => state.me)
  const todayEvent = useApp((state) => state.todayEvent)
  const updateSettings = useApp((state) => state.updateSettings)
  const resetDemo = useApp((state) => state.resetDemo)
  const showToast = useApp((state) => state.showToast)
  const [confirmReset, setConfirmReset] = useState(false)

  const aiConnected = aiReady(settings.ai)
  const aiProvider = settings.ai.provider ?? 'deepseek'
  const aiConfig = providerConfig(settings.ai, aiProvider)

  return (
    <div className="page page--sub settings-page">
      <NavBar back title="设置" />
      <div className="scroll settings-scroll">
        <CellGroup>
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #ffd15c, #ff9d1a)"><UserRound size={16} strokeWidth={2} /></IconTile>}
            title="个人信息"
            subtitle={`名字、头像、地区 · 当前：${me.name}`}
            onClick={() => navigate('/me/profile')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #7bd88f, #07a83f)"><Sparkles size={16} strokeWidth={2} /></IconTile>}
            title="AI 连接"
            subtitle={
              aiConnected
                ? `已连接 · ${PROVIDER_LABELS[aiProvider]} · ${aiConfig.model}`
                : '未连接，点击配置 DeepSeek / Gemini'
            }
            value={aiConnected ? <span className="status-pill status-pill--on">已连接</span> : <span className="status-pill">未连接</span>}
            onClick={() => navigate('/settings/ai')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #6bb9ff, #3a7cff)"><CalendarDays size={16} strokeWidth={2} /></IconTile>}
            title="每日事件"
            subtitle={todayEvent ? '今天已经有安排了' : '还没有写入今天的事件'}
            onClick={() => navigate('/settings/events')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #ffd15c, #ff9d1a)"><MessageCircle size={16} strokeWidth={2} /></IconTile>}
            title="对话行为"
            subtitle={`${settings.ai.replyPace === 'fast' ? '回复较快' : settings.ai.replyPace === 'slow' ? '回复较慢' : '自然节奏'} · ${settings.ai.proactive ? '允许主动找你' : '不主动打扰'}`}
            onClick={() => navigate('/settings/ai')}
          />
        </CellGroup>

        <CellGroup>
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #6bb9ff, #3a7cff)"><ShieldCheck size={16} strokeWidth={2} /></IconTile>}
            title="账号与安全"
            onClick={() => showToast('账号与安全为演示项')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #ffd15c, #ff9d1a)"><UserRound size={16} strokeWidth={2} /></IconTile>}
            title="青少年模式"
            onClick={() => showToast('青少年模式为演示项')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #7bd88f, #07a83f)"><Moon size={16} strokeWidth={2} /></IconTile>}
            title="关怀模式"
            onClick={() => showToast('关怀模式为演示项')}
          />
        </CellGroup>

        <CellGroup>
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #ff8f8f, #f05252)"><Bell size={16} strokeWidth={2} /></IconTile>}
            title="消息通知"
            extra={<Switch checked={settings.momentsNotify} onChange={(value) => updateSettings({ momentsNotify: value })} />}
            arrow={false}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #6bb9ff, #3a7cff)"><MessageCircle size={16} strokeWidth={2} /></IconTile>}
            title="聊天"
            onClick={() => showToast('聊天设置为演示项')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #8f9bb3, #5c6982)"><Lock size={16} strokeWidth={2} /></IconTile>}
            title="隐私"
            onClick={() => showToast('隐私设置为演示项')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #8f9bb3, #5c6982)"><Settings2 size={16} strokeWidth={2} /></IconTile>}
            title="通用"
            onClick={() => showToast('通用设置为演示项')}
          />
        </CellGroup>

        <CellGroup>
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #6bb9ff, #3a7cff)"><HelpCircle size={16} strokeWidth={2} /></IconTile>}
            title="帮助与反馈"
            onClick={() => showToast('帮助与反馈为演示项')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #8f9bb3, #5c6982)"><Info size={16} strokeWidth={2} /></IconTile>}
            title="关于微信"
            subtitle="版本信息 · 检查更新"
            onClick={() => navigate('/settings/about')}
          />
        </CellGroup>

        <CellGroup>
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #ff8f8f, #f05252)"><RotateCcw size={16} strokeWidth={2} /></IconTile>}
            title="恢复演示数据"
            danger
            onClick={() => setConfirmReset(true)}
          />
        </CellGroup>

        <p className="settings-footer">本应用是本地 AI 社交沙盒，仅保存本机数据。界面用于个人体验，不代表腾讯官方。</p>
      </div>

      {confirmReset ? (
        <div className="sheet-mask" onClick={() => setConfirmReset(false)}>
          <div className="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="dialog-title">恢复演示数据？</div>
            <div className="dialog-text">当前聊天、朋友圈和设置会被重置，操作不可撤销。</div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setConfirmReset(false)}>取消</button>
              <button
                type="button"
                className="dialog-danger"
                onClick={() => {
                  resetDemo()
                  setConfirmReset(false)
                }}
              >
                恢复
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

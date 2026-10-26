import { MessageCircle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { Cell, CellGroup } from '../components/Cell'
import { NavBar } from '../components/NavBar'
import { isNative } from '../lib/platform'
import { UPDATE_CHANNEL_LABEL, useUpdater } from '../lib/updater'
import { useApp } from '../store'

export function AboutScreen() {
  const showToast = useApp((state) => state.showToast)
  const status = useUpdater((state) => state.status)
  const error = useUpdater((state) => state.error)
  const currentVersion = useUpdater((state) => state.currentVersion)
  const currentBuild = useUpdater((state) => state.currentBuild)
  const loadVersion = useUpdater((state) => state.loadVersion)
  const check = useUpdater((state) => state.check)

  useEffect(() => {
    void loadVersion()
  }, [loadVersion])

  const statusText =
    status === 'checking'
      ? '检查中…'
      : status === 'available'
        ? '有新版本'
        : status === 'latest'
          ? '已是最新'
          : status === 'error'
            ? '检查失败'
            : status === 'downloading'
              ? '下载中'
              : ''

  const runCheck = async () => {
    await check(true)
    const next = useUpdater.getState()
    if (next.status === 'latest') showToast('已经是最新版本')
    else if (next.status === 'error') showToast(next.error || '检查更新失败')
    else if (next.status === 'available') showToast(`发现新版本 ${next.info?.version || ''}`)
  }

  return (
    <div className="page page--sub about-page">
      <NavBar back title="关于微信" />
      <div className="scroll settings-scroll">
        <section className="about-hero">
          <div className="about-logo">
            <MessageCircle size={42} strokeWidth={1.6} />
          </div>
          <div className="about-name">微信沙盒</div>
          <div className="about-version">
            {currentVersion ? `版本 ${currentVersion}${currentBuild ? `（${currentBuild}）` : ''}` : '开发版'}
          </div>
          <div className="about-hint">本地 AI 社交沙盒 · 非腾讯官方客户端</div>
        </section>

        <CellGroup>
          <Cell
            title="检查更新"
            subtitle={isNative() ? `更新源：${UPDATE_CHANNEL_LABEL}` : '自动更新仅在手机 App 内生效'}
            value={
              status === 'checking' ? (
                <RefreshCw size={16} className="spin" />
              ) : statusText ? (
                <span className={status === 'error' ? 'status-pill status-pill--warn' : 'status-pill'}>{statusText}</span>
              ) : undefined
            }
            onClick={() => void runCheck()}
          />
        </CellGroup>

        {error ? <p className="settings-footer about-error">上次检查：{error}</p> : null}

        <p className="settings-footer">
          App 会每隔几小时在后台静默检查一次 GitHub 上的新版本；发现更新后提示你下载安装。
          安装新版本需要允许本应用「安装未知应用」，数据（聊天、朋友圈、设置、API Key）都会保留。
        </p>
        <p className="settings-footer about-build">更新源：{UPDATE_CHANNEL_LABEL}</p>
      </div>
    </div>
  )
}

import { formatDate, formatSize, useUpdater } from '../lib/updater'

/** 发现新版本时的更新弹窗（微信风格对话框）。 */
export function UpdateDialog() {
  const open = useUpdater((state) => state.dialogOpen)
  const status = useUpdater((state) => state.status)
  const info = useUpdater((state) => state.info)
  const progress = useUpdater((state) => state.progress)
  const error = useUpdater((state) => state.error)
  const currentVersion = useUpdater((state) => state.currentVersion)
  const install = useUpdater((state) => state.install)
  const dismiss = useUpdater((state) => state.dismiss)

  if (!open || !info) return null

  const busy = status === 'downloading' || status === 'installing'
  const notes = info.notes.length > 900 ? `${info.notes.slice(0, 900)}…` : info.notes

  return (
    <div className="sheet-mask" onClick={() => (busy ? undefined : dismiss())}>
      <div className="dialog update-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-title">发现新版本 {info.version}</div>
        <div className="update-meta">
          当前 {currentVersion || '未知版本'}
          {info.size ? ` · 安装包 ${formatSize(info.size)}` : ''}
          {info.publishedAt ? ` · ${formatDate(info.publishedAt)}` : ''}
        </div>
        {notes ? <pre className="update-notes">{notes}</pre> : null}
        {status === 'downloading' ? (
          <div className="update-progress">
            <div className="update-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="update-percent">正在下载 {progress}%</span>
          </div>
        ) : null}
        {status === 'installing' ? (
          <div className="update-percent">已开始安装，请按系统提示完成</div>
        ) : null}
        {error ? <div className="update-error">{error}</div> : null}
        <div className="dialog-actions">
          <button type="button" onClick={dismiss} disabled={busy}>
            {status === 'installing' ? '完成' : '以后再说'}
          </button>
          <button type="button" onClick={() => void install()} disabled={busy}>
            {status === 'downloading'
              ? '下载中…'
              : status === 'installing'
                ? '安装中…'
                : error
                  ? '重试'
                  : '立即更新'}
          </button>
        </div>
      </div>
    </div>
  )
}

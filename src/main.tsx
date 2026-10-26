import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import App from './App'
import { useUpdater } from './lib/updater'
import './styles.css'

// 手机 App：使用系统状态栏（不再画模拟栏），接管返回键
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native')

  const applySystemBars = () => {
    // 内容排在状态栏下方，避免刘海/挖孔压住标题；深色底 + 浅色图标
    void StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined)
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined)
    void StatusBar.setBackgroundColor({ color: '#111111' }).catch(() => undefined)
  }
  applySystemBars()
  // 从登录窗口/安装器/键盘回来时，重新确认状态栏样式
  void CapApp.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
    if (isActive) applySystemBars()
  })

  void CapApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
    // 更新弹窗打开时，返回键先关弹窗，不要直接退出
    const updater = useUpdater.getState()
    if (updater.dialogOpen) {
      updater.dismiss()
      return
    }
    if (canGoBack) window.history.back()
    else void CapApp.exitApp()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

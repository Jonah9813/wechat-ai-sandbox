import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import App from './App'
import { useUpdater } from './lib/updater'
import './styles.css'

// 手机 App：隐藏系统状态栏（界面里自带状态栏）、接管返回键、标记原生环境
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native')

  void StatusBar.hide().catch(() => undefined)
  // 从登录窗口/安装器/键盘回来时，系统状态栏可能又冒出来，重新隐藏
  void CapApp.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
    if (isActive) void StatusBar.hide().catch(() => undefined)
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

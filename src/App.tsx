import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StatusBar } from './components/StatusBar'
import { Toast } from './components/Toast'
import { UpdateDialog } from './components/UpdateDialog'
import { AboutScreen } from './screens/AboutScreen'
import { AISettingsScreen } from './screens/AISettingsScreen'
import { AddFriendScreen } from './screens/AddFriendScreen'
import { ChatScreen } from './screens/ChatScreen'
import { ChatsScreen } from './screens/ChatsScreen'
import { ComposeMomentScreen } from './screens/ComposeMomentScreen'
import { ContactsScreen } from './screens/ContactsScreen'
import { DiscoverScreen } from './screens/DiscoverScreen'
import { EventsScreen } from './screens/EventsScreen'
import { MeScreen } from './screens/MeScreen'
import { MomentsScreen } from './screens/MomentsScreen'
import { MyQRCodeScreen } from './screens/MyQRCodeScreen'
import { NewFriendsScreen } from './screens/NewFriendsScreen'
import { PayScreen } from './screens/PayScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ScanScreen } from './screens/ScanScreen'
import { SearchScreen } from './screens/SearchScreen'
import { ServicesScreen } from './screens/ServicesScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { WalletScreen } from './screens/WalletScreen'
import { startAIRuntime } from './lib/proactive'
import { useUpdater } from './lib/updater'
import { warmUpWebBridge } from './lib/webBridge'
import { useApp } from './store'

export default function App() {
  const location = useLocation()
  const statusTheme =
    location.pathname === '/pay'
      ? 'green'
      : location.pathname === '/scan'
        ? 'dark'
        : location.pathname === '/moments'
          ? 'photo'
          : location.pathname === '/me'
            ? 'me'
            : 'dark'

  useEffect(() => {
    const stopRuntime = startAIRuntime()
    // 只有正在用网页端时才提前加载 WebView，避免白占内存和流量
    const ai = useApp.getState().settings.ai
    if (ai.enabled && (ai.provider ?? 'deepseek') === 'web') warmUpWebBridge()
    // 启动 5 秒后静默检查更新；6 小时最多查一次，失败不打扰
    const updateTimer = window.setTimeout(() => void useUpdater.getState().autoCheck(), 5000)
    return () => {
      stopRuntime()
      window.clearTimeout(updateTimer)
    }
  }, [])

  return (
    <div className="stage">
      <div className="device">
        <div className="screen">
          <StatusBar theme={statusTheme} />
          <div className="viewport">
            <Routes>
              <Route path="/" element={<Navigate to="/chats" replace />} />
              <Route path="/chats" element={<ChatsScreen />} />
              <Route path="/chat/:id" element={<ChatScreen />} />
              <Route path="/contacts" element={<ContactsScreen />} />
              <Route path="/discover" element={<DiscoverScreen />} />
              <Route path="/me" element={<MeScreen />} />
              <Route path="/moments" element={<MomentsScreen />} />
              <Route path="/moments/compose" element={<ComposeMomentScreen />} />
              <Route path="/add-friend" element={<AddFriendScreen />} />
              <Route path="/new-friends" element={<NewFriendsScreen />} />
              <Route path="/friend/:id" element={<ProfileScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/settings/ai" element={<AISettingsScreen />} />
              <Route path="/settings/about" element={<AboutScreen />} />
              <Route path="/settings/events" element={<EventsScreen />} />
              <Route path="/services" element={<ServicesScreen />} />
              <Route path="/wallet" element={<WalletScreen />} />
              <Route path="/pay" element={<PayScreen />} />
              <Route path="/my-qr" element={<MyQRCodeScreen />} />
              <Route path="/scan" element={<ScanScreen />} />
              <Route path="*" element={<Navigate to="/chats" replace />} />
            </Routes>
          </div>
          <Toast />
          <UpdateDialog />
        </div>
      </div>
    </div>
  )
}

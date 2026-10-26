import { WxIconImage } from './WxIcons'

type TabName = 'chat' | 'contacts' | 'discover' | 'me'

const tabSize: Record<TabName, { width: number; height: number }> = {
  chat: { width: 25, height: 22 },
  contacts: { width: 27, height: 22 },
  discover: { width: 25, height: 25 },
  me: { width: 23.5, height: 22 },
}

export function TabIcon({ name, active }: { name: TabName; active: boolean }) {
  const { width, height } = tabSize[name]
  return (
    <WxIconImage name={`tab-${name}${active ? '-active' : ''}`} width={width} height={height} />
  )
}

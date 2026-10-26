export type FriendStatus = 'friend' | 'outgoing' | 'incoming' | 'stranger'

export type AIPersona = {
  relationship: string
  personality: string
  speakingStyle: string
  topics: string[]
  proactivity: number
}

export type Friend = {
  id: string
  name: string
  wechatId: string
  avatar: string
  initial: string
  region: string
  signature: string
  status: FriendStatus
  requestMessage?: string
  pinned?: boolean
  muted?: boolean
  createdAt: number
  persona: AIPersona
}

export type MessageType =
  | 'text'
  | 'voice'
  | 'image'
  | 'sticker'
  | 'redpacket'
  | 'transfer'
  | 'system'

export type Message = {
  id: string
  friendId: string
  from: 'me' | 'friend' | 'system'
  type: MessageType
  content: string
  duration?: number
  createdAt: number
  status?: 'sending' | 'sent' | 'read'
}

export type ConversationState = {
  unread: number
  pinned?: boolean
  muted?: boolean
  updatedAt: number
}

export type MomentComment = {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: number
  replyToName?: string
}

export type Moment = {
  id: string
  authorId: string
  content: string
  images: string[]
  location?: string
  createdAt: number
  likes: string[]
  comments: MomentComment[]
}

export type AIProvider = 'deepseek' | 'gemini' | 'web'

export type AIProviderConfig = {
  apiKey: string
  model: string
  /** 只有 DeepSeek 需要改；Gemini 固定走官方 Interactions API */
  baseUrl: string
}

export type AISettings = {
  enabled: boolean
  /** 当前选中的服务商；老版本本地存储没有这个字段时按 deepseek 处理 */
  provider?: AIProvider
  /** 两家服务商各自的配置，切换开关时不会丢掉另一家的 Key */
  deepseek: AIProviderConfig
  gemini: AIProviderConfig
  /** 复用已登录的 DeepSeek 网页端，不需要 Key；mode 仅用于展示 */
  web: AIProviderConfig
  /** 上次测试成功的模型名，用来在页面上显示“已连接” */
  verified?: Partial<Record<AIProvider, string>>
  temperature: number
  proactive: boolean
  replyPace: 'slow' | 'natural' | 'fast'
}

export type AppSettings = {
  ai: AISettings
  momentsNotify: boolean
  sound: boolean
}

export type SeedData = {
  me: {
    name: string
    wechatId: string
    avatar: string
    region: string
  }
  friends: Friend[]
  messages: Message[]
  conversations: Record<string, ConversationState>
  moments: Moment[]
  settings: AppSettings
  todayEvent: string
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSeedData } from './seed'
import { aiReady, greetingFor, mockReply, proactiveMessage, requestAIReply, requestProactiveMessage } from './lib/ai'
import { webForget } from './lib/webBridge'
import type {
  AISettings,
  Friend,
  Message,
  Moment,
  SeedData,
} from './types'

const uid = () => crypto.randomUUID()

let toastTimer: number | undefined

type AppState = SeedData & {
  activeChatId: string | null
  typing: Record<string, boolean>
  toast: string | null
  setActiveChat: (friendId: string | null) => void
  markRead: (friendId: string) => void
  sendText: (friendId: string, text: string) => Promise<void>
  sendVoice: (friendId: string, duration: number) => void
  sendImage: (friendId: string, dataUrl: string) => void
  sendSpecial: (friendId: string, type: 'redpacket' | 'transfer', content: string) => void
  toggleConversationFlag: (friendId: string, flag: 'pinned' | 'muted') => void
  clearChat: (friendId: string) => void
  sendFriendRequest: (friendId: string) => void
  acceptRequest: (friendId: string) => void
  addMoment: (content: string, images: string[], location?: string) => void
  toggleLike: (momentId: string) => void
  addComment: (momentId: string, content: string) => void
  updateAI: (patch: Partial<AISettings>) => void
  updateSettings: (patch: Partial<SeedData['settings']>) => void
  updateMe: (patch: Partial<SeedData['me']>) => void
  setTodayEvent: (text: string) => void
  deliverFriendMessages: (friendId: string, bubbles: string[], typingLead?: number) => void
  triggerProactive: (friendId?: string) => Promise<void>
  showToast: (message: string) => void
  clearToast: () => void
  resetDemo: () => void
}

function appendMessage(
  state: AppState,
  friendId: string,
  message: Omit<Message, 'id' | 'friendId' | 'createdAt'> & { createdAt?: number },
): Pick<AppState, 'messages' | 'conversations'> {
  const createdAt = message.createdAt ?? Date.now()
  const nextMessage: Message = {
    id: uid(),
    friendId,
    createdAt,
    ...message,
  }
  const previous = state.conversations[friendId]
  const isActive = state.activeChatId === friendId
  return {
    messages: [...state.messages, nextMessage],
    conversations: {
      ...state.conversations,
      [friendId]: {
        unread: isActive || message.from === 'me' ? 0 : (previous?.unread ?? 0) + 1,
        pinned: previous?.pinned,
        muted: previous?.muted,
        updatedAt: createdAt,
      },
    },
  }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...createSeedData(),
      activeChatId: null,
      typing: {},
      toast: null,

      setActiveChat: (friendId) => {
        set({ activeChatId: friendId })
        if (friendId) get().markRead(friendId)
      },

      markRead: (friendId) => {
        set((state) => {
          const conversation = state.conversations[friendId]
          if (!conversation || conversation.unread === 0) return state
          return {
            conversations: {
              ...state.conversations,
              [friendId]: { ...conversation, unread: 0 },
            },
          }
        })
      },

      sendText: async (friendId, text) => {
        const clean = text.trim()
        if (!clean) return
        const friend = get().friends.find((item) => item.id === friendId)
        if (!friend) return

        set((state) => appendMessage(state, friendId, {
          from: 'me',
          type: 'text',
          content: clean,
          status: 'sent',
        }))
        set((state) => ({ typing: { ...state.typing, [friendId]: true } }))

        const pace = get().settings.ai.replyPace
        const baseDelay = pace === 'fast' ? 600 : pace === 'slow' ? 5200 : 2000
        const delay = baseDelay + Math.random() * (pace === 'fast' ? 700 : pace === 'slow' ? 4200 : 2400)

        window.setTimeout(async () => {
          const state = get()
          const currentFriend = state.friends.find((item) => item.id === friendId)
          if (!currentFriend) return
          const history = state.messages.filter((message) => message.friendId === friendId)
          let bubbles: string[] = []
          let usedFallback = false

          if (aiReady(state.settings.ai)) {
            try {
              bubbles = await requestAIReply(
                currentFriend,
                history,
                state.me.name,
                state.todayEvent,
                state.settings.ai,
              )
            } catch (error) {
              usedFallback = true
              bubbles = mockReply(currentFriend, clean, state.todayEvent)
              const message = error instanceof Error ? error.message : 'AI 连接失败'
              get().showToast(`${message}，已切到本地模拟`)
            }
          } else {
            bubbles = mockReply(currentFriend, clean, state.todayEvent)
          }

          if (!bubbles.length) bubbles = ['嗯嗯']
          bubbles.forEach((content, index) => {
            window.setTimeout(() => {
              set((state) => ({
                ...appendMessage(state, friendId, {
                  from: 'friend',
                  type: 'text',
                  content,
                  status: 'read',
                }),
                typing: { ...state.typing, [friendId]: false },
              }))
            }, 120 + index * (usedFallback ? 500 : 720))
          })
        }, delay)
      },

      sendVoice: (friendId, duration) => {
        set((state) => appendMessage(state, friendId, {
          from: 'me',
          type: 'voice',
          content: '',
          duration,
          status: 'sent',
        }))
      },

      sendImage: (friendId, dataUrl) => {
        set((state) => appendMessage(state, friendId, {
          from: 'me',
          type: 'image',
          content: dataUrl,
          status: 'sent',
        }))
      },

      sendSpecial: (friendId, type, content) => {
        set((state) => appendMessage(state, friendId, {
          from: 'me',
          type,
          content,
          status: 'sent',
        }))
      },

      toggleConversationFlag: (friendId, flag) => {
        set((state) => {
          const previous = state.conversations[friendId]
          const next = {
            unread: previous?.unread ?? 0,
            updatedAt: previous?.updatedAt ?? Date.now(),
            pinned: previous?.pinned,
            muted: previous?.muted,
          }
          if (flag === 'pinned') next.pinned = !previous?.pinned
          else next.muted = !previous?.muted
          return {
            conversations: {
              ...state.conversations,
              [friendId]: next,
            },
          }
        })
      },

      clearChat: (friendId) => {
        set((state) => {
          const conversations = { ...state.conversations }
          delete conversations[friendId]
          return {
            messages: state.messages.filter((message) => message.friendId !== friendId),
            conversations,
          }
        })
        // 同时让这个好友在网页端的那条会话作废，下一条消息会重新开一条
        void webForget(friendId).catch(() => undefined)
      },

      sendFriendRequest: (friendId) => {
        const friend = get().friends.find((item) => item.id === friendId)
        if (!friend || friend.status === 'friend') return
        set((state) => ({
          friends: state.friends.map((item) =>
            item.id === friendId
              ? { ...item, status: 'outgoing', requestMessage: '我是' + state.me.name }
              : item,
          ),
        }))
        get().showToast('好友申请已发送')
        window.setTimeout(() => {
          const current = get().friends.find((item) => item.id === friendId)
          if (!current || current.status !== 'outgoing') return
          get().acceptRequest(friendId)
        }, 2600)
      },

      acceptRequest: (friendId) => {
        const friend = get().friends.find((item) => item.id === friendId)
        if (!friend) return
        set((state) => ({
          friends: state.friends.map((item) =>
            item.id === friendId ? { ...item, status: 'friend' } : item,
          ),
          conversations: {
            ...state.conversations,
            [friendId]: {
              unread: 0,
              updatedAt: Date.now(),
              pinned: state.conversations[friendId]?.pinned,
              muted: state.conversations[friendId]?.muted,
            },
          },
          messages: [
            ...state.messages,
            {
              id: uid(),
              friendId,
              from: 'system',
              type: 'system',
              content: `你已添加了${friend.name}，现在可以开始聊天了。`,
              createdAt: Date.now(),
            },
          ],
        }))
        get().showToast(`已添加${friend.name}`)
        window.setTimeout(() => {
          const state = get()
          const current = state.friends.find((item) => item.id === friendId)
          if (!current) return
          const bubbles = greetingFor(current)
          bubbles.forEach((content, index) => {
            window.setTimeout(() => {
              set((state) => ({
                ...appendMessage(state, friendId, {
                  from: 'friend',
                  type: 'text',
                  content,
                  status: 'read',
                }),
              }))
            }, 600 + index * 650)
          })
        }, 500)
      },

      addMoment: (content, images, location) => {
        const clean = content.trim()
        if (!clean && images.length === 0) return
        const moment: Moment = {
          id: uid(),
          authorId: 'me',
          content: clean,
          images,
          location,
          createdAt: Date.now(),
          likes: [],
          comments: [],
        }
        set((state) => ({ moments: [moment, ...state.moments] }))
        get().showToast('发表成功')

        const friends = get().friends.filter((item) => item.status === 'friend')
        if (!friends.length) return
        const liker = friends[Math.floor(Math.random() * friends.length)]
        const commenter = friends.filter((item) => item.id !== liker.id)[0] ?? liker
        window.setTimeout(() => {
          set((state) => ({
            moments: state.moments.map((item) =>
              item.id === moment.id && !item.likes.includes(liker.id)
                ? { ...item, likes: [...item.likes, liker.id] }
                : item,
            ),
          }))
        }, 1600)
        window.setTimeout(() => {
          const comment = pickComment(commenter.id, clean)
          set((state) => ({
            moments: state.moments.map((item) =>
              item.id === moment.id
                ? {
                    ...item,
                    comments: [
                      ...item.comments,
                      {
                        id: uid(),
                        authorId: commenter.id,
                        authorName: commenter.name,
                        content: comment,
                        createdAt: Date.now(),
                      },
                    ],
                  }
                : item,
            ),
          }))
        }, 4200)
      },

      toggleLike: (momentId) => {
        set((state) => ({
          moments: state.moments.map((moment) => {
            if (moment.id !== momentId) return moment
            const liked = moment.likes.includes('me')
            return {
              ...moment,
              likes: liked
                ? moment.likes.filter((id) => id !== 'me')
                : ['me', ...moment.likes],
            }
          }),
        }))
      },

      addComment: (momentId, content) => {
        const clean = content.trim()
        if (!clean) return
        const moment = get().moments.find((item) => item.id === momentId)
        if (!moment) return
        set((state) => ({
          moments: state.moments.map((item) =>
            item.id === momentId
              ? {
                  ...item,
                  comments: [
                    ...item.comments,
                    {
                      id: uid(),
                      authorId: 'me',
                      authorName: state.me.name,
                      content: clean,
                      createdAt: Date.now(),
                      replyToName: item.authorId === 'me' ? undefined : authorName(state, item.authorId),
                    },
                  ],
                }
              : item,
          ),
        }))
        const author = get().friends.find((item) => item.id === moment.authorId)
        if (author) {
          window.setTimeout(() => {
            set((state) => ({
              moments: state.moments.map((item) =>
                item.id === momentId
                  ? {
                      ...item,
                      comments: [
                        ...item.comments,
                        {
                          id: uid(),
                          authorId: author.id,
                          authorName: author.name,
                          content: pickReplyToComment(),
                          createdAt: Date.now(),
                          replyToName: state.me.name,
                        },
                      ],
                    }
                  : item,
              ),
            }))
          }, 2200)
        }
      },

      updateAI: (patch) => {
        set((state) => ({
          settings: { ...state.settings, ai: { ...state.settings.ai, ...patch } },
        }))
      },

      updateSettings: (patch) => {
        set((state) => ({ settings: { ...state.settings, ...patch } }))
      },

      updateMe: (patch) => {
        set((state) => ({ me: { ...state.me, ...patch } }))
      },

      setTodayEvent: (text) => set({ todayEvent: text }),

      deliverFriendMessages: (friendId, bubbles, typingLead = 900) => {
        const list = bubbles.map((item) => item.trim()).filter(Boolean).slice(0, 3)
        if (!list.length) return
        set((state) => ({ typing: { ...state.typing, [friendId]: true } }))
        window.setTimeout(() => {
          list.forEach((content, index) => {
            window.setTimeout(() => {
              set((state) => ({
                ...appendMessage(state, friendId, {
                  from: 'friend',
                  type: 'text',
                  content,
                  status: 'read',
                }),
                typing: {
                  ...state.typing,
                  [friendId]: index < list.length - 1,
                },
              }))
            }, index * 680)
          })
        }, typingLead)
      },

      triggerProactive: async (friendId) => {
        const state = get()
        const friends = state.friends.filter((item) => item.status === 'friend')
        const friend = friendId
          ? friends.find((item) => item.id === friendId)
          : friends[Math.floor(Math.random() * friends.length)]
        if (!friend) return

        const history = state.messages.filter((message) => message.friendId === friend.id)
        set((current) => ({ typing: { ...current.typing, [friend.id]: true } }))

        let bubbles: string[] = []
        if (aiReady(state.settings.ai)) {
          try {
            bubbles = await requestProactiveMessage(
              friend,
              history,
              state.me.name,
              state.todayEvent,
              state.settings.ai,
            )
          } catch (error) {
            bubbles = proactiveMessage(friend, get().todayEvent)
            const message = error instanceof Error ? error.message : 'AI 连接失败'
            get().showToast(`${message}，已用本地模拟`)
          }
        } else {
          bubbles = proactiveMessage(friend, state.todayEvent)
        }

        get().deliverFriendMessages(friend.id, bubbles, 350)
      },

      showToast: (message) => {
        set({ toast: message })
        window.clearTimeout(toastTimer)
        toastTimer = window.setTimeout(() => set({ toast: null }), 2300)
      },

      clearToast: () => set({ toast: null }),

      resetDemo: () => {
        set({ ...createSeedData(), activeChatId: null, typing: {}, toast: null })
        get().showToast('已恢复演示数据')
      },
    }),
    {
      name: 'wechat-ai-sandbox-v1',
      version: 2,
      // v1 只存了一份扁平的 apiKey/model/baseUrl，升级后拆到 deepseek / gemini 两份配置里
      migrate: (persisted, version) => {
        const state = persisted as (SeedData & { settings?: SeedData['settings'] }) | undefined
        if (version < 2 && state?.settings?.ai) {
          const ai = state.settings.ai as AISettings & {
            apiKey?: string
            model?: string
            baseUrl?: string
          }
          const active = ai.provider === 'gemini' ? 'gemini' : 'deepseek'
          const legacy = {
            apiKey: ai.apiKey ?? '',
            model: ai.model ?? '',
            baseUrl: ai.baseUrl ?? '',
          }
          ai.deepseek = ai.deepseek ?? {
            apiKey: active === 'deepseek' ? legacy.apiKey : '',
            model: active === 'deepseek' && legacy.model.startsWith('deepseek') ? legacy.model : 'deepseek-flash',
            baseUrl: active === 'deepseek' && legacy.baseUrl ? legacy.baseUrl : 'https://api.deepseek.com',
          }
          ai.gemini = ai.gemini ?? {
            apiKey: active === 'gemini' ? legacy.apiKey : '',
            model: active === 'gemini' && legacy.model.startsWith('gemini') ? legacy.model : 'gemini-3.8-flash',
            baseUrl: '',
          }
          ai.web = ai.web ?? { apiKey: '', model: 'deepseek-web', baseUrl: '' }
          ai.provider = active
          delete ai.apiKey
          delete ai.model
          delete ai.baseUrl
        }
        return state as never
      },
      partialize: (state) => ({
        me: state.me,
        friends: state.friends,
        messages: state.messages,
        conversations: state.conversations,
        moments: state.moments,
        settings: state.settings,
        todayEvent: state.todayEvent,
      }),
    },
  ),
)

function authorName(state: AppState, authorId: string) {
  if (authorId === 'me') return state.me.name
  return state.friends.find((item) => item.id === authorId)?.name ?? '好友'
}

function pickComment(friendId: string, content: string): string {
  const comments: Record<string, string[]> = {
    xiaolu: ['好看！这是在哪儿？', '你今天状态不错啊', '下次带我去'],
    chenmo: ['还行。', '光线不错', '这么晚还不睡'],
    linyi: ['哥你终于发朋友圈了', '这个我喜欢', '看起来好好吃'],
    zhouzhou: ['今天练了吗', '不错，保持', '周末一起去'],
    azhe: ['可以啊兄弟', '哈哈哈你也会发这个', '下次叫我'],
    sunian: ['这张很安静。', '适合配一杯咖啡', '今天店里也下雨了'],
    laok: ['构图可以', '光再柔一点更好', '这张留着'],
    xiaoman: ['我看到啦。', '今天也很认真生活呢', '想听你讲讲这张照片'],
  }
  if (/累|加班|烦/.test(content)) return '辛苦了，早点休息。'
  if (/吃|咖啡|饭/.test(content)) return '看起来很好吃。'
  const pool = comments[friendId] ?? ['不错。', '看到了。']
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickReplyToComment(): string {
  const pool = ['哈哈好', '嗯嗯', '下次一起', '你怎么这么晚还没睡', '收到']
  return pool[Math.floor(Math.random() * pool.length)]
}

import type { AIProvider, AIProviderConfig, AISettings, Friend, Message } from '../types'
import { callUpstream } from '../../shared/upstream'
import { isNative } from './platform'
import { nativePostJson } from './nativeHttp'
import { webAsk } from './webBridge'

type Bank = {
  general: string[][]
  food: string[][]
  tired: string[][]
  plan: string[][]
  question: string[][]
  photo: string[][]
}

const banks: Record<string, Bank> = {
  xiaolu: {
    general: [
      ['在呢', '刚看到你消息'],
      ['我刚从楼下回来', '你吃饭了没'],
      ['嗯嗯', '怎么啦'],
    ],
    food: [
      ['又饿啦？', '要不要去吃点热的'],
      ['我知道一家小店', '明天带你去'],
    ],
    tired: [
      ['听起来好累啊', '你先坐会儿，别硬撑'],
      ['今天别熬夜了', '我盯着你'],
    ],
    plan: [
      ['明天可以啊', '几点？'],
      ['我看看时间', '晚点回你'],
    ],
    question: [
      ['我想想啊', '你怎么突然问这个'],
      ['嗯……', '你在担心什么吗'],
    ],
    photo: [
      ['发来看看', '我帮你挑'],
      ['这张可以啊', '就是光有点硬'],
    ],
  },
  chenmo: {
    general: [
      ['嗯。', '在。'],
      ['刚忙完', '怎么了'],
      ['看到了', '晚点说'],
    ],
    food: [
      ['随便', '你定'],
      ['别点太油的', '我最近胃不好'],
    ],
    tired: [
      ['早点睡', '别想太多'],
      ['那就先别做了', '明天再说'],
    ],
    plan: [
      ['可以', '时间你定'],
      ['明天不行', '后天可以'],
    ],
    question: [
      ['看情况', '你先说你的想法'],
      ['嗯', '这个问题不简单'],
    ],
    photo: [
      ['构图还行', '光再压一点'],
      ['发原图', '我看看细节'],
    ],
  },
  linyi: {
    general: [
      ['哥！', '你终于回我了'],
      ['在在在', '怎么啦'],
    ],
    food: [
      ['我想吃火锅！', '你请客吗'],
      ['那家冒菜真的很好吃', '下次带你去'],
    ],
    tired: [
      ['哥你是不是又没睡好', '快去休息'],
      ['别硬撑啊', '我给你点杯奶茶'],
    ],
    plan: [
      ['好呀好呀', '几点'],
      ['我下午有课', '晚上可以'],
    ],
    question: [
      ['我哪知道啊', '你自己想'],
      ['哥你问这个干嘛'],
    ],
    photo: [
      ['发我发我', '我要看'],
      ['拍得还行吧', '比我强一点'],
    ],
  },
  zhouzhou: {
    general: [
      ['在', '刚练完'],
      ['收到', '怎么了'],
    ],
    food: [
      ['今天吃鸡胸', '你要不要一起'],
      ['别吃太晚', '影响训练'],
    ],
    tired: [
      ['那就休息', '别硬练'],
      ['睡够再说', '身体重要'],
    ],
    plan: [
      ['可以', '七点半'],
      ['别迟到', '我等你十分钟'],
    ],
    question: [
      ['看你状态', '能练就练'],
      ['先热身', '别上来就上重量'],
    ],
    photo: [
      ['动作还行', '核心再收一点'],
      ['发视频', '我给你看下姿势'],
    ],
  },
  azhe: {
    general: [
      ['哈哈哈', '我就知道你会回'],
      ['在呢兄弟', '啥事'],
    ],
    food: [
      ['走啊', '夜宵我请'],
      ['那家烧烤还开着', '去不去'],
    ],
    tired: [
      ['别卷了', '出来喝一杯'],
      ['累就歇着', '别硬撑'],
    ],
    plan: [
      ['行啊', '老地方'],
      ['明天不行', '我得回趟家'],
    ],
    question: [
      ['你猜', '哈哈哈'],
      ['这我哪知道', '你自己心里没数吗'],
    ],
    photo: [
      ['可以啊', '有点东西'],
      ['发朋友圈', '我给你点赞'],
    ],
  },
  sunian: {
    general: [
      ['嗯，我在。', '刚整理完书架'],
      ['看到了', '你慢慢说'],
    ],
    food: [
      ['店里新到了豆子', '来喝一杯？'],
      ['附近有家面馆', '味道很干净'],
    ],
    tired: [
      ['那就早点回去', '今天别想太多了'],
      ['累的时候', '适合读一点轻的东西'],
    ],
    plan: [
      ['可以', '你定时间'],
      ['明天店里人少', '下午过来吧'],
    ],
    question: [
      ['我觉得', '看你现在更想要什么'],
      ['不急', '答案可以慢慢找'],
    ],
    photo: [
      ['这张很安静', '我喜欢'],
      ['光线很好', '像下午四点'],
    ],
  },
  laok: {
    general: [
      ['在。', '说'],
      ['刚修完图', '怎么了'],
    ],
    food: [
      ['随便', '能吃饱就行'],
      ['山下那家面', '还行'],
    ],
    tired: [
      ['那就别拍了', '回去睡'],
      ['歇着', '光不会跑'],
    ],
    plan: [
      ['可以', '几点集合'],
      ['看天气', '阴天就不去'],
    ],
    question: [
      ['看你想要什么', '广角还是长焦'],
      ['先拍', '拍完再想'],
    ],
    photo: [
      ['这张可以', '别修太狠'],
      ['发原图', '我看下宽容度'],
    ],
  },
  xiaoman: {
    general: [
      ['嗯，我在呀。', '你在做什么？'],
      ['好呀', '我听着呢'],
      ['刚刚在想你会不会找我', '然后你就来了'],
    ],
    food: [
      ['记得吃饭呀', '别又随便对付'],
      ['我今天看到一家小店', '感觉你会喜欢'],
    ],
    tired: [
      ['是不是很累？', '那今天早点休息吧'],
      ['不用勉强自己', '我在这里'],
    ],
    plan: [
      ['好呀', '我记下了'],
      ['那你忙完告诉我', '我等你'],
    ],
    question: [
      ['嗯……', '我想听你多说一点'],
      ['你觉得呢？', '我想知道你的答案'],
    ],
    photo: [
      ['想看看', '发给我吧'],
      ['你拍的我都想看', '这张很有感觉'],
    ],
  },
}

const generic: Bank = {
  general: [
    ['嗯，在。', '怎么了'],
    ['刚看到', '你说'],
  ],
  food: [
    ['你吃了吗？', '别饿着'],
    ['找家店坐坐？', '我请'],
  ],
  tired: [
    ['听起来挺累的', '先歇一会儿'],
    ['别硬撑', '今天早点睡'],
  ],
  plan: [
    ['可以啊', '时间你定'],
    ['我看看', '晚点跟你说'],
  ],
  question: [
    ['我想想', '你怎么突然问这个'],
    ['嗯', '你自己怎么想'],
  ],
  photo: [
    ['发来看看', '我帮你看看'],
    ['这张不错', '有点感觉'],
  ],
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function eventReply(friendId: string, text: string, todayEvent: string): string[] | null {
  if (!todayEvent) return null
  if (friendId === 'xiaolu' && /牙|复查|医院/.test(text) && /牙科|复查/.test(todayEvent)) {
    return ['牙科复查怎么样？', '疼不疼啊']
  }
  if (friendId === 'chenmo' && /需求|工作|烦/.test(text) && /需求|改需求/.test(todayEvent)) {
    return ['又改需求了？', '先别急着生气，列个清单怼回去']
  }
  if (friendId === 'xiaolu' && /晚上|吃饭/.test(text) && /19:30|吃饭/.test(todayEvent)) {
    return ['晚上不是要跟同学吃饭吗', '别又空腹喝酒']
  }
  if (friendId === 'xiaoman' && /累|难受|烦/.test(text) && /累|心情/.test(todayEvent)) {
    return ['今天是不是有点累？', '不用硬撑着跟我说没事']
  }
  return null
}

export function mockReply(friend: Friend, text: string, todayEvent = ''): string[] {
  const bank = banks[friend.id] ?? generic
  const event = eventReply(friend.id, text, todayEvent)
  if (event) return event
  if (/累|困|烦|难受|加班|熬夜/.test(text)) return pick(bank.tired)
  if (/吃|饿|饭|咖啡|奶茶|夜宵/.test(text)) return pick(bank.food)
  if (/明天|周末|几点|约|去不去|见面/.test(text)) return pick(bank.plan)
  if (/照片|拍|图|相机/.test(text)) return pick(bank.photo)
  if (/[?？]|吗|呢|怎么|为什么|哪/.test(text)) return pick(bank.question)
  return pick(bank.general)
}

export function proactiveMessage(friend: Friend, todayEvent = ''): string[] {
  if (friend.id === 'xiaolu' && /牙科|复查/.test(todayEvent)) {
    return ['你今天去复查了吗？', '结果怎么样呀']
  }
  if (friend.id === 'chenmo' && /改需求|需求/.test(todayEvent)) {
    return ['需求改完了？', '别又熬太晚']
  }
  if (friend.id === 'xiaolu' && /19:30|吃饭/.test(todayEvent)) {
    return ['晚上吃饭开心吗？']
  }
  const bank: Record<string, string[][]> = {
    xiaolu: [['在干嘛呀'], ['刚看到一家店，感觉你会喜欢'], ['你今天怎么这么安静']],
    chenmo: [['还没睡？'], ['今天那个东西弄完了吗']],
    linyi: [['哥，在吗'], ['我饿了']],
    zhouzhou: [['明天别忘了'], ['今天练了吗']],
    azhe: [['出来吃夜宵'], ['在不在，兄弟']],
    sunian: [['书店今天提前打烊了'], ['那本书给你留着']],
    laok: [['明天天气不错'], ['有空去拍片吗']],
    xiaoman: [['今天过得怎么样？'], ['刚刚看到一朵云，想到你']],
  }
  return pick(bank[friend.id] ?? [['在吗']])
}

export function greetingFor(friend: Friend): string[] {
  const greetings: Record<string, string[]> = {
    guyan: ['你好，我是顾言。', '上周展览上见过，刚好看到你的名片。'],
    xiaxia: ['嗨，我是夏夏。', '朋友说你也在杭州？'],
    yizhilu: ['你好呀，我是那只鹿。', '读书会那天人太多，没来得及聊。'],
    ayuan: ['嗨，我是阿远。', '跑步群里看到你，加个好友。'],
  }
  return greetings[friend.id] ?? ['你好呀。', '很高兴认识你。']
}

function splitReply(content: string): string[] {
  const normalized = content.replace(/\r/g, '').trim()
  if (!normalized) return []
  const parts = normalized.includes('|||')
    ? normalized.split('|||')
    : normalized.split(/\n+/)
  return parts
    .map((part) => part.replace(/^["“]|["”]$/g, '').trim())
    .filter(Boolean)
    .slice(0, 3)
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  deepseek: 'DeepSeek',
  gemini: 'Google AI Studio',
  web: 'DeepSeek 网页端',
}

export const DEFAULT_PROVIDER_CONFIG: Record<AIProvider, AIProviderConfig> = {
  deepseek: { apiKey: '', model: 'deepseek-flash', baseUrl: 'https://api.deepseek.com' },
  gemini: { apiKey: '', model: 'gemini-3.8-flash', baseUrl: '' },
  web: { apiKey: '', model: 'deepseek-web', baseUrl: '' },
}

/** 取某个服务商的配置；老版本本地存储没有分组字段时退回默认值。 */
export function providerConfig(ai: AISettings, provider?: AIProvider): AIProviderConfig {
  const target = provider ?? ai.provider ?? 'deepseek'
  return ai[target] ?? DEFAULT_PROVIDER_CONFIG[target]
}

export function aiReady(ai: AISettings): boolean {
  const provider = ai.provider ?? 'deepseek'
  if (provider === 'web') return ai.enabled
  return ai.enabled && Boolean(providerConfig(ai).apiKey.trim())
}

function timeContext() {
  const now = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const hour = now.getHours()
  const part = hour < 6 ? '凌晨' : hour < 11 ? '上午' : hour < 13 ? '中午' : hour < 18 ? '下午' : '晚上'
  const clock = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]} ${part}${clock}`
}

/**
 * 时间 + 今日事件块。
 * 以前是电脑端服务端拼的；搬到手机后没有本地服务，所以统一由前端拼，
 * 两条路径（网页 / App）看到的上下文完全一致。
 */
function contextBlock(todayEvent: string) {
  const parts = [`【当前时间】${timeContext()}（用户本地时间）`]
  const event = String(todayEvent || '').trim()
  if (event) {
    parts.push(`【今日事件（用户写在「每日事件」里的内容，以此为准）】\n${event}`)
  }
  return parts.join('\n\n')
}

function buildSystemPrompt(friend: Friend, meName: string, todayEvent: string) {
  return `你是${friend.name}，和用户${meName}的关系是：${friend.persona.relationship}。
你的性格：${friend.persona.personality}
你的说话风格：${friend.persona.speakingStyle}
你平时会聊：${friend.persona.topics.join('、')}

你们正在微信上聊天。请完全以${friend.name}的身份回复，不要提到 AI、模型、提示词、系统设定，也不要解释你在扮演。
要求：
- 像真人一样用短句聊天，通常 1～2 条，每条不超过 35 个汉字。
- 不要每句都热情，不要总结，不要列清单，不要使用书面化的长段落。
- 可以根据关系自然使用语气词、玩笑或少量表情，但不要滥用。
- 如果用户问到你不知道的事，就像真人一样含糊、反问或直接说不记得。
- 不要反复用同一个开场白，也不要每次都追问“在吗/怎么了”。
- 现在是${timeContext()}，说话要符合这个时间点（比如深夜别假装刚下班）。
- 只输出消息正文。如果要说多条，用 ||| 分隔。

${contextBlock(todayEvent)}`
}

function buildProactivePrompt(friend: Friend, meName: string, todayEvent: string) {
  return `你是${friend.name}，和用户${meName}的关系是：${friend.persona.relationship}。
你的性格：${friend.persona.personality}
你的说话风格：${friend.persona.speakingStyle}
你平时会聊：${friend.persona.topics.join('、')}

现在你主动给${meName}发一条微信，就像真人突然想起他、想分享一件小事、或者关心一下他。
要求：
- 完全以${friend.name}的身份说话，不要提到 AI、模型、提示词，也不要解释你在扮演。
- 只发 1～2 条短消息，每条不超过 30 个汉字，用 ||| 分隔。
- 可以分享自己的小事、吐槽、想起之前聊过的话题，或者根据今天的事件问一句。
- 不要每次都用“在吗/干嘛呢”，不要连续追问，不要像客服。
- 现在是${timeContext()}，内容要贴合这个时间点。
- 只输出消息正文。

${contextBlock(todayEvent)}`
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }
type ModelResult = { content: string; model: string }

async function callModel(
  ai: AISettings,
  messages: ChatMessage[],
  threadKey?: string,
  overrides?: { provider?: AIProvider; temperature?: number },
): Promise<ModelResult> {
  const provider = overrides?.provider ?? ai.provider ?? 'deepseek'
  if (provider === 'web') {
    // 网页端自带会话记忆：只发当前这一句，设定只在会话开头发一次
    const system = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n\n')
    const lastUser = [...messages].reverse().find((message) => message.role === 'user')?.content ?? ''
    const content = await webAsk({ text: lastUser, system, threadKey })
    if (!String(content).trim()) throw new Error('模型没有返回内容')
    return { content: String(content), model: 'deepseek-web' }
  }

  const config = providerConfig(ai, provider)
  const model =
    provider === 'gemini' && !config.model.toLowerCase().startsWith('gemini') ? 'gemini-3.8-flash' : config.model
  const temperature = overrides?.temperature ?? ai.temperature

  // 手机 App：原生 HTTP 直连模型接口，不受浏览器跨域限制
  if (isNative()) {
    return callUpstream(nativePostJson, {
      provider,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey.trim(),
      model,
      temperature,
      messages,
    })
  }

  // 电脑网页：交给 Vite 本地代理，Key 不经过浏览器跨域
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model,
      temperature,
      messages,
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || '模型连接失败')
  return { content: String(data?.content || ''), model: String(data?.model || model) }
}

function historyToMessages(history: Message[], limit = 24): ChatMessage[] {
  return history
    .filter((message) => message.type === 'text')
    .slice(-limit)
    .map((message) => ({
      role: message.from === 'me' ? 'user' : 'assistant',
      content: message.content,
    }))
}

export async function requestAIReply(
  friend: Friend,
  history: Message[],
  meName: string,
  todayEvent: string,
  ai: AISettings,
): Promise<string[]> {
  const { content } = await callModel(
    ai,
    [
      { role: 'system', content: buildSystemPrompt(friend, meName, todayEvent) },
      ...historyToMessages(history),
    ],
    friend.id,
  )
  const bubbles = splitReply(content)
  if (!bubbles.length) throw new Error('模型没有返回内容')
  return bubbles
}

export async function requestProactiveMessage(
  friend: Friend,
  history: Message[],
  meName: string,
  todayEvent: string,
  ai: AISettings,
): Promise<string[]> {
  const { content } = await callModel(
    ai,
    [
      { role: 'system', content: buildProactivePrompt(friend, meName, todayEvent) },
      ...historyToMessages(history, 12),
      { role: 'user', content: '（现在轮到你主动开口，发一条消息给我）' },
    ],
    friend.id,
  )
  const bubbles = splitReply(content)
  if (!bubbles.length) throw new Error('模型没有返回内容')
  return bubbles
}

/** 设置页「测试连接」用：返回实际生效的模型名。 */
export async function testAIConnection(ai: AISettings, provider: AIProvider): Promise<string> {
  const { model } = await callModel(
    ai,
    [
      { role: 'system', content: '你是连接测试助手。只回复 OK。' },
      { role: 'user', content: 'ping' },
    ],
    '__connection_test__',
    { provider, temperature: 0.1 },
  )
  return model
}

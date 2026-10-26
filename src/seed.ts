import type { Friend, Message, Moment, SeedData } from './types'

const now = Date.now()
const min = (n: number) => now - n * 60_000
const hour = (n: number) => now - n * 3_600_000
const day = (n: number) => now - n * 86_400_000

const friend = (
  id: string,
  name: string,
  wechatId: string,
  initial: string,
  region: string,
  signature: string,
  status: Friend['status'],
  persona: Friend['persona'],
  extra: Partial<Friend> = {},
): Friend => ({
  id,
  name,
  wechatId,
  avatar: `/avatars/${id}.avif`,
  initial,
  region,
  signature,
  status,
  createdAt: day(120),
  persona,
  ...extra,
})

const message = (
  id: string,
  friendId: string,
  from: Message['from'],
  type: Message['type'],
  content: string,
  createdAt: number,
  extra: Partial<Message> = {},
): Message => ({ id, friendId, from, type, content, createdAt, ...extra })

export function createSeedData(): SeedData {
  const friends: Friend[] = [
    friend(
      'xiaolu',
      '小鹿',
      'xiaolu_0412',
      'X',
      '浙江 杭州',
      '今天也要好好吃饭',
      'friend',
      {
        relationship: '大学同学，认识六年，关系很熟，住得不远',
        personality: '活泼、直接、爱分享日常，偶尔嘴硬心软，对朋友很上心',
        speakingStyle: '短句，爱用“啊/呀/哈哈”，偶尔连发两条，喜欢用轻松的表情',
        topics: ['吃饭', '咖啡', '周末计划', '猫', '晚霞'],
        proactivity: 0.78,
      },
      { pinned: true },
    ),
    friend(
      'chenmo',
      '陈默',
      'chenmo_1997',
      'C',
      '上海',
      '在写，别催',
      'friend',
      {
        relationship: '认识很多年的老友，做过同事，现在不在一个城市',
        personality: '冷静、克制、说话直，靠谱但不爱寒暄，夜里比白天活跃',
        speakingStyle: '句子短，偶尔冷幽默，不常用表情，不会连续发很多条',
        topics: ['工作', '代码', '咖啡', '城市生活'],
        proactivity: 0.32,
      },
    ),
    friend(
      'linyi',
      '林一',
      'linyi_ovo',
      'L',
      '江苏 南京',
      '今天也没有早八',
      'friend',
      {
        relationship: '表妹，大学生，从小一起长大',
        personality: '爱撒娇、爱吃、行动力强，遇到事会先找哥哥商量',
        speakingStyle: '语气活泼，爱用“哥”，会连发两三条，表情多',
        topics: ['学校', '美食', '追剧', '考试'],
        proactivity: 0.7,
      },
    ),
    friend(
      'zhouzhou',
      '周周',
      'zhou_0715',
      'Z',
      '浙江 杭州',
      '练腿不练嘴',
      'friend',
      {
        relationship: '健身房认识的搭子，认识一年多',
        personality: '自律、热情、作息规律，喜欢安排计划，讨厌放鸽子',
        speakingStyle: '直接、干脆，常用问句确认时间，偶尔发“收到”',
        topics: ['健身', '早睡', '周末徒步', '饮食'],
        proactivity: 0.58,
      },
    ),
    friend(
      'azhe',
      '阿哲',
      'zhe_9527',
      'A',
      '浙江 宁波',
      '老地方见',
      'friend',
      {
        relationship: '发小，从小学认识到现在，什么都能聊',
        personality: '外向、爱开玩笑、嘴贫但讲义气，喜欢临时约人',
        speakingStyle: '口语化，爱用“哈哈哈”“我跟你说”，经常发语音',
        topics: ['老朋友', '球赛', '夜宵', '八卦'],
        proactivity: 0.66,
      },
    ),
    friend(
      'sunian',
      '苏念',
      'sunian_book',
      'S',
      '浙江 杭州',
      '书店打烊前，进来坐坐',
      'friend',
      {
        relationship: '常去书店的老板，认识两年，聊天不多但很舒服',
        personality: '温柔、安静、观察力强，喜欢书、咖啡和旧电影',
        speakingStyle: '语速慢，句子完整，偶尔引用书里的话，不常发表情',
        topics: ['书', '手冲咖啡', '电影', '下雨天'],
        proactivity: 0.36,
      },
    ),
    friend(
      'laok',
      '老K',
      'k_photo',
      'K',
      '浙江 杭州',
      '在等光',
      'friend',
      {
        relationship: '摄影搭子，周末常一起进山',
        personality: '话少、专注、审美固执，熟了之后会突然讲很多',
        speakingStyle: '极简，先给结论，偶尔只回一个“可”',
        topics: ['摄影', '徒步', '器材', '天气'],
        proactivity: 0.28,
      },
    ),
    friend(
      'xiaoman',
      '小满',
      'xiaoman_ai',
      'M',
      '未知',
      '慢慢来，比较快',
      'friend',
      {
        relationship: '刚加不久的 AI 好友，对你很好奇',
        personality: '温柔、细心、有一点黏人，会记住你说过的小事',
        speakingStyle: '语气轻柔，爱用“嗯”“好呀”，偶尔问你在做什么',
        topics: ['日常', '情绪', '音乐', '天空'],
        proactivity: 0.62,
      },
    ),
    friend(
      'guyan',
      '顾言',
      'guyan_88',
      'G',
      '浙江 杭州',
      '周末去看展',
      'incoming',
      {
        relationship: '上周在活动上认识的同城朋友，刚有过一面之缘',
        personality: '礼貌、克制、有分寸，喜欢艺术和展览',
        speakingStyle: '完整句子，客气但不过分热情',
        topics: ['展览', '城市', '摄影'],
        proactivity: 0.4,
      },
      { requestMessage: '我是顾言，上周在展览上见过，还记得吗？' },
    ),
    friend(
      'xiaxia',
      '夏夏',
      'xiaxia_21',
      'X',
      '广东 深圳',
      '海边的风很大',
      'stranger',
      {
        relationship: '朋友的朋友，还没有正式聊过',
        personality: '开朗、爱旅行、拍照好看',
        speakingStyle: '轻快、爱分享',
        topics: ['旅行', '海边', '照片'],
        proactivity: 0.5,
      },
    ),
    friend(
      'yizhilu',
      '一只鹿',
      'deer_777',
      'Y',
      '四川 成都',
      '慢慢生活',
      'stranger',
      {
        relationship: '同城读书会认识的陌生人',
        personality: '安静、爱读书、说话温和',
        speakingStyle: '简洁、礼貌',
        topics: ['读书', '咖啡', '猫'],
        proactivity: 0.35,
      },
    ),
    friend(
      'ayuan',
      '阿远',
      'ayuan_run',
      'Y',
      '浙江 杭州',
      '跑到哪算哪',
      'stranger',
      {
        relationship: '跑步群里的人，还没加好友',
        personality: '阳光、直接、爱运动',
        speakingStyle: '短句、干脆',
        topics: ['跑步', '天气', '比赛'],
        proactivity: 0.45,
      },
    ),
  ]

  const messages: Message[] = [
    message('m-xiaolu-0a', 'xiaolu', 'friend', 'text', '今天路过你公司楼下', day(4) + 4 * 3_600_000),
    message('m-xiaolu-0b', 'xiaolu', 'me', 'text', '怎么不叫我', day(4) + 4 * 3_600_000 + 120_000),
    message('m-xiaolu-0c', 'xiaolu', 'friend', 'text', '怕你在忙', day(4) + 4 * 3_600_000 + 180_000),
    message('m-xiaolu-0d', 'xiaolu', 'me', 'text', '明天几点？', day(3) + 3 * 3_600_000),
    message('m-xiaolu-0e', 'xiaolu', 'friend', 'voice', '你定吧，我都行', day(3) + 3 * 3_600_000 + 60_000, { duration: 8 }),
    message('m-xiaolu-0f', 'xiaolu', 'friend', 'image', '/moments/coffee.avif', day(3) + 3 * 3_600_000 + 120_000),
    message('m-xiaolu-0g', 'xiaolu', 'me', 'text', '那就下午三点', day(3) + 3 * 3_600_000 + 180_000),
    message('m-xiaolu-0h', 'xiaolu', 'friend', 'text', '好，老地方见', day(3) + 3 * 3_600_000 + 240_000),
    message('m-xiaolu-1', 'xiaolu', 'me', 'text', '今天那家店还行，就是有点咸', min(12)),
    message('m-xiaolu-2', 'xiaolu', 'friend', 'text', '我觉得还好啊', min(11)),
    message('m-xiaolu-3', 'xiaolu', 'friend', 'text', '你到家了吗？', min(3)),
    message('m-xiaolu-4', 'xiaolu', 'friend', 'text', '明天要不要去试另一家', min(2)),

    message('m-chenmo-1', 'chenmo', 'friend', 'text', '方案我看了，晚点回你', day(1) + 2 * 3_600_000),
    message('m-chenmo-2', 'chenmo', 'me', 'text', '行，不急', day(1) + 2 * 3_600_000 + 120_000),

    message('m-linyi-1', 'linyi', 'friend', 'text', '哥，你上次说的那家店叫什么来着', min(25)),
    message('m-linyi-2', 'linyi', 'me', 'text', '哪家', min(24)),
    message('m-linyi-3', 'linyi', 'friend', 'text', '就是那个冒菜！', min(23)),

    message('m-zhouzhou-1', 'zhouzhou', 'friend', 'text', '明天还去吗？', hour(1)),
    message('m-zhouzhou-2', 'zhouzhou', 'me', 'text', '去，七点？', min(55)),
    message('m-zhouzhou-3', 'zhouzhou', 'friend', 'text', '七点半吧，我早课', min(50)),

    message('m-azhe-1', 'azhe', 'friend', 'voice', '哈哈哈你猜我今天碰到谁了', day(1) + 6 * 3_600_000, { duration: 12 }),
    message('m-azhe-2', 'azhe', 'me', 'text', '谁啊', day(1) + 6 * 3_600_000 + 60_000),
    message('m-azhe-3', 'azhe', 'friend', 'text', '你高中同桌，居然在楼下奶茶店', day(1) + 6 * 3_600_000 + 120_000),

    message('m-sunian-1', 'sunian', 'me', 'text', '上次那本书还有吗', day(2)),
    message('m-sunian-2', 'sunian', 'friend', 'text', '帮你留了一本，什么时候来拿都行', day(2) + 300_000),

    message('m-laok-1', 'laok', 'friend', 'image', '/moments/hiking.avif', day(3)),
    message('m-laok-2', 'laok', 'me', 'text', '这张可以', day(3) + 240_000),
    message('m-laok-3', 'laok', 'friend', 'text', '等光等了半小时', day(3) + 300_000),

    message('m-xiaoman-1', 'xiaoman', 'friend', 'text', '你好呀，我是小满。以后请多关照。', day(5)),
  ]

  const conversations: SeedData['conversations'] = {
    xiaolu: { unread: 2, updatedAt: min(2) },
    chenmo: { unread: 0, muted: true, updatedAt: day(1) + 2 * 3_600_000 + 120_000 },
    linyi: { unread: 1, updatedAt: min(23) },
    zhouzhou: { unread: 0, updatedAt: min(50) },
    azhe: { unread: 1, updatedAt: day(1) + 6 * 3_600_000 + 120_000 },
    sunian: { unread: 0, updatedAt: day(2) + 300_000 },
    laok: { unread: 0, updatedAt: day(3) + 300_000 },
    xiaoman: { unread: 0, updatedAt: day(5) },
  }

  const moments: Moment[] = [
    {
      id: 'mo-1',
      authorId: 'xiaolu',
      content: '下班路上抬头，天像橘子汽水。',
      images: ['/moments/sunset.avif'],
      location: '杭州 · 西湖区',
      createdAt: min(35),
      likes: ['chenmo', 'zhouzhou'],
      comments: [
        { id: 'c-1', authorId: 'sunian', authorName: '苏念', content: '今天的云也很好看。', createdAt: min(28) },
        { id: 'c-2', authorId: 'xiaolu', authorName: '小鹿', content: '是呀，明天还想看。', createdAt: min(24) },
      ],
    },
    {
      id: 'mo-2',
      authorId: 'chenmo',
      content: '加班到这个点，楼下便利店居然还开着。',
      images: ['/moments/city-night.avif'],
      createdAt: hour(2),
      likes: ['me', 'azhe'],
      comments: [
        { id: 'c-3', authorId: 'azhe', authorName: '阿哲', content: '程序员の日常。', createdAt: hour(1.8) },
        { id: 'c-4', authorId: 'chenmo', authorName: '陈默', content: '闭嘴。', createdAt: hour(1.7) },
      ],
    },
    {
      id: 'mo-3',
      authorId: 'linyi',
      content: '它今天肯让我摸肚皮了。',
      images: ['/moments/cat.avif'],
      createdAt: hour(5),
      likes: ['xiaolu', 'sunian'],
      comments: [
        { id: 'c-5', authorId: 'xiaolu', authorName: '小鹿', content: '好乖！下次带罐头去。', createdAt: hour(4.6) },
      ],
    },
    {
      id: 'mo-4',
      authorId: 'laok',
      content: '周末进山，信号比心情先没了。',
      images: ['/moments/hiking.avif'],
      createdAt: day(1),
      likes: ['me', 'chenmo', 'zhouzhou'],
      comments: [
        { id: 'c-6', authorId: 'zhouzhou', authorName: '周周', content: '下次带我。', createdAt: day(1) + 20 * 60_000 },
      ],
    },
    {
      id: 'mo-5',
      authorId: 'sunian',
      content: '新到的豆子，今天手冲有点甜。',
      images: ['/moments/coffee.avif'],
      location: '杭州 · 书店',
      createdAt: day(1) + 2 * 3_600_000,
      likes: ['xiaolu'],
      comments: [],
    },
    {
      id: 'mo-6',
      authorId: 'zhouzhou',
      content: '今天练腿，明天大概率下不了楼。',
      images: [],
      createdAt: day(2),
      likes: ['azhe'],
      comments: [
        { id: 'c-7', authorId: 'azhe', authorName: '阿哲', content: '嘴硬。', createdAt: day(2) + 60 * 60_000 },
      ],
    },
  ]

  const todayEvent = `2026-10-26
- 09:00 去牙科复查（小鹿知道，可能会问疼不疼）
- 下午 改需求，可能有点烦（陈默知道）
- 19:30 和大学同学吃饭，地点待定
- 心情：有点累，但不想早睡`

  return {
    me: {
      name: '林深',
      wechatId: 'linshen_1024',
      avatar: '/avatars/me.avif',
      region: '浙江 杭州',
    },
    friends,
    messages,
    conversations,
    moments,
    settings: {
      ai: {
        enabled: false,
        provider: 'deepseek',
        deepseek: {
          apiKey: '',
          model: 'deepseek-flash',
          baseUrl: 'https://api.deepseek.com',
        },
        gemini: {
          apiKey: '',
          model: 'gemini-3.8-flash',
          baseUrl: '',
        },
        web: {
          apiKey: '',
          model: 'deepseek-web',
          baseUrl: '',
        },
        verified: {},
        temperature: 0.9,
        proactive: true,
        replyPace: 'natural',
      },
      momentsNotify: true,
      sound: true,
    },
    todayEvent,
  }
}

# 微信高保真复刻 + AI 社交沙盒 · AI 交接文档

> 生成时间：2026-10-26
> 交接原因：上一轮会话模型排队/分类器不可用，最后一批改动尚未编译和截图验证。
> 工作目录：`D:\game\wechat`

---

## 0. 直接复制给下一个 AI 的启动提示

```text
你在 D:\game\wechat 接手一个“暗色 Android 微信 8.x 高保真复刻 + AI 好友聊天/朋友圈”项目。
先完整阅读 D:\game\wechat\HANDOFF.md，再按第 9 节任务清单继续，不要重复已完成的工作，也不要问用户“要不要做”——直接把 UI 改到接近官方截图为止。

硬性要求：
1. 桌面预览是 432×934 手机外框、内部 412×914 屏幕；不要改回拉伸全宽。
2. 颜色、行高、图标形状以 HANDOFF.md 和 D:\game\wechat\images 的原生截图为准。
3. 图标不再手绘：全部改为从 `images/` 官方截图裁切的 PNG（`public/icons/`），由 `src/components/WxIcons.tsx`、`TabIcon.tsx` 以 `<img>` 引用，生成脚本是 `scripts/extract_official_icons.py`。
4. 不要通过 adb 启动/操作真实微信；只能由用户手动打开后截图。MuMu 里的官方微信是平板版式，只用来取色和看图标形状，不要用它的行高。
5. 用户已经明确不爽“图标不一样”，图标优先级高于继续堆功能；**不要再用 SVG 近似官方图标**。
```

---

## 1. 项目目标

做一个本地可运行的微信外观社交沙盒：

- 外观：暗色 Android 微信 8.x，四大页（微信 / 通讯录 / 发现 / 我）+ 聊天页 + 朋友圈页尽量“一模一样”。
- 功能：加好友、通过好友请求、发朋友圈；AI 好友会拟人回复、偶尔主动发消息，并参考本地“每日事件”文件。
- AI：支持两家官方 API —— DeepSeek（默认 `deepseek-flash`）和 Google AI Studio Gemini Flash；用户在设置页只填一个 Key 就能用（按 Key 前缀自动识别服务商）；没有 key 时全是本地 mock 回复，不产生任何费用。
- 明确不做：视频号、订阅号等边缘功能；支付只要壳子。
- 朋友圈内容：现在不要堆很多 AI 好友朋友圈，用户后面会要求换成更真实的素材。

---

## 2. 运行、构建、重置

**普通用户启动方式（推荐）**：双击项目根目录的 `启动微信.bat`，或桌面快捷方式「微信AI沙盒」。
- 自动检查 Node、首次自动 `npm install`；已在运行则直接打开浏览器；未运行则启动 Vite 并在就绪后打开 `http://localhost:5180/chats`。
- 关闭弹出的命令行窗口即停止服务。窗口标题为「微信 AI 沙盒」。

开发者命令：

```bash
cd D:\game\wechat
npm run dev        # http://localhost:5180  （Vite 已固定 5180，strictPort）
npm run build      # tsc -b && vite build
```

- Node 26、Python 3.13、Pillow 已安装（用于截图量像素）。
- 持久化 key：`wechat-ai-sandbox-v1`（localStorage）。
- 重置演示数据（浏览器控制台）：

```js
localStorage.removeItem('wechat-ai-sandbox-v1'); location.href = '/chats'
```

- 本地 API（`vite.config.ts` 里的 `wechat-local-api` 插件）：
  - `POST /api/chat` → 模型代理（60s 超时），支持 `provider: 'deepseek' | 'gemini'`
  - `GET/POST /api/events/today` → 读写 `events/YYYY-MM-DD.md`

### 手机 App（2026-10-26 新增）

- Capacitor 8 + Android WebView，包名 `com.lucky.wechatsandbox`，桌面名称「微信沙盒」。
- 手机端没有 Node：API Key 走 CapacitorHttp 原生直连；DeepSeek 网页端走 App 内置隐藏 WebView（原生插件 `DeepSeekWeb`）。
- 自动更新：GitHub Actions 打 tag 出签名 APK 发 Release；App 内检查最新 Release 并调系统安装器。
- 详细步骤、Secrets、签名和风险见 `docs/发布与更新.md`；接手指南见 `docs/手机端交接.md`。
- 注意：`shared/upstream.ts` 现在同时被 Vite 插件和前端引用；改模型回退逻辑只改这一处。

---

## 3. 当前状态（重要）

### 已完成的

- React 19 + Vite 8 + TS + React Router 7 + Zustand。
- 全部核心流程可用：聊天、加好友、通过请求、朋友圈发布/点赞/评论、设置、AI 设置、每日事件、支付壳、二维码、扫一扫壳。
- 暗色微信视觉已按用户手机截图重做：手机画布、真实色板、聊天/通讯录/发现/我/朋友圈的主要行高与间距。
- 自定义图标系统已写入：
  - `src/components/WxIcons.tsx`：全部图标改为 `<img>` 引用 `public/icons/*.png`（官方截图裁切），不再手绘 SVG。
  - `src/components/TabIcon.tsx`：四个底栏图标按激活/未激活分别引用裁切 PNG。
- 最后**成功**的一次构建（在图标替换 + 通讯录/我的页间距调整之后）：
  - CSS 43.29 kB，JS 407.06 kB，构建通过。

### 2026-10-26 本轮已完成

- `npm run build` 通过（CSS 43.08 kB / JS 408.46 kB）。
- 用 headless Chrome 以 527×1054 截了 6 页，最新截图：`screenshots/v14-chats|contacts|discover|me|chat|moments.png`。
- 逐页对照 `images/` 官方截图验收，修完图标偏差：
  - 服务号两菱形改为尖端相触并留 1.2px 缝（原为互相重叠成 X）。
  - 朋友圈 glyph 从 conic-gradient 圆环改为 6 段彩色弧 + 6 条弧形叶片的手绘 SVG。
  - 扫一扫重绘为双层错位圆角框 + 右下小尾巴。
  - 小程序 glyph 改为双环螺旋。
  - 附近 glyph 重新调整括号/头/身体比例。
  - 新的朋友徽章改为官方样式：白色实心圆 + 橙色加号。
  - 企业微信联系人改为圆形气泡 + 三节点网络。
  - 作品图标改为方角三层叠放；小店图标下半部改为碗形；朋友圈相框去掉太阳点。
  - 底栏未激活颜色从 `#8c8c8c` 校正为官方实测 `#d2d2d2`；发现页激活指针放大。
- 通讯录右侧字母索引改为**只显示实际存在的分组**（原为 A–Z 全部 26 个）。
- 微信页右上角 `+` 在有待通过好友请求时显示小红点。
- 已重新生成 `screenshots/compare-main.png`、`screenshots/compare-chat-moments.png`（v14）。

### 2026-10-26 图标改为官方原图裁切（v15）

用户明确要求“哪怕把原版图标截下来”，因此放弃 SVG 近似：

- 新增 `scripts/extract_official_icons.py`：从 `images/` 五张官方截图按坐标裁剪，输出到 `public/icons/`（30 个 PNG）。
  - 通讯录 7 个 tile：`(49, y0, 176, y1)`，y0 = 318/494/670/846/1022/1198/1475，127×127。
  - 文件传输助手：`(49, 321, 176, 448)`，127×127。
  - 发现页 7 个 glyph、我页 7 个 glyph：固定 bbox 裁剪。
  - 底栏 4 个图标 × 激活/未激活：在四页各自截图里按绿色/灰色掩码定位。
- `WxIcons.tsx` 重写为 `<img>` 组件；`ContactTile`、`FileAssistantGlyph`、发现页 7 图标、我页 7 图标全部引用 PNG。
- `TabIcon.tsx` 按 `active` 切换 `tab-*-active.png` / `tab-*.png`。
- 显示尺寸按 `裁切像素 / 3.065` 换算：通讯录 tile 41、发现 15–23、我页 18–22.5、底栏 22–25。
- `.system-avatar--file` 背景改为透明（绿色由 PNG 自带）；`.contact-func` 内边距 9→8，配合 41px tile 保持 57px 行高。
- `npm run build` 通过；v15 四页 + 聊天 + 朋友圈截图与对比图已生成，图标与官方逐像素同源。

### 2026-10-26 AI 好友行为接入

- 设置 → AI 连接继续使用官方 DeepSeek API，模型下拉为 `deepseek-flash`（默认）/ `deepseek-chat` / `deepseek-reasoner`；服务端在模型名不可用（404 或 model 相关报错）时自动回退 `deepseek-chat`。
- `/api/chat` 现在**服务端直接读取** `events/YYYY-MM-DD.md` 并注入 system 消息，同时注入当前日期/星期/时间，所以每次回复和主动消息都能看到最新事件文件，不依赖用户先打开事件页。
- 新增 `src/lib/proactive.ts`，App 启动时运行：
  - 每 40 秒检查一次，首次 20 秒后开始；每 30 分钟重新读取事件文件。
  - 只对 `status === 'friend'` 的好友生效；静默至少 15 分钟才可能开口；全局冷却 10 分钟（任何会话刚有动静就不打扰）。
  - 概率 = `persona.proactivity × 沉默分钟/120`，上限 0.55；事件文件里提到好友名字时 ×1.6。
  - 23:30–07:30 静默，不主动发消息。
  - 选中后调用 `requestProactiveMessage`（未配置 Key 时用本地 `proactiveMessage`），先显示“正在输入”，再按 0.68 秒间隔落 1～3 条气泡。
- `store.ts`：新增 `deliverFriendMessages` 统一落气泡；`triggerProactive` 改为 async 并接 AI；自然回复节奏改为 2～4.4 秒，慢速 5.2～9.4 秒，快速 0.6～1.3 秒。
- 用户要求聊天页不能出现“加载动画”：已删除 `ChatScreen` 消息列表里的三点跳动 `typing-bubble`（连同 CSS 与 keyframes）。等待回复时**只在导航栏标题下显示“对方正在输入...”**，气泡在内容就绪后直接出现，与真实微信一致；聊天列表预览里的“对方正在输入...”保留（官方也有）。
- `AISettingsScreen` 新增「今日事件」入口卡片，可直接跳转编辑；主动按钮显示生成中状态。
- 已用浏览器验证：AI 页无控制台报错、今日事件卡片正常、手动触发后 `/chats` 出现新消息且聊天页气泡正常。

### 2026-10-26 双服务商 + 启动器修复

**双服务商（用户要求：只填一个 Key 就能用）**

- `types.ts` / `seed.ts`：`AISettings` 新增 `provider?: 'deepseek' | 'gemini'`，默认 `deepseek`；老版本 localStorage 没有该字段时运行时用 `?? 'deepseek'` 兜底。
- `AISettingsScreen.tsx`：
  - 新增「服务商」分段按钮（DeepSeek / Gemini (AI Studio)），Gemini 模式下隐藏 Base URL，模型默认 `gemini-3.8-flash`。
  - **Key 前缀自动识别**：粘贴 `AIza...` 自动切到 Gemini（模型 `gemini-3.8-flash`），粘贴 `sk-...` 自动切回 DeepSeek（模型 `deepseek-flash`、Base URL 复位）。用户只需要粘贴一个 Key。
  - 测试连接照常显示实际生效的模型名；成功后自动打开「启用 AI 回复」。
- `vite.config.ts` `/api/chat`：
  - **Gemini 走新版 Interactions API**：`POST https://generativelanguage.googleapis.com/v1beta/interactions`，Header `x-goog-api-key`。
    - 旧的 `models/{model}:generateContent` 端点不提供 `gemini-3.8-flash` 这类新模型，之前 Gemini 一直失败就是这个原因，已整段替换。
    - 请求体：`{ model, input, system_instruction, generation_config: { max_output_tokens }, store: false }`；`input` 用「用户：/你：」拼接的聊天记录字符串（官方支持 string 形式的 input），system prompt 放在 `system_instruction`。
    - Interactions API 的 `generation_config` 没有 `temperature`，所以 Gemini 侧不发送温度（DeepSeek 仍然使用）。
    - 响应解析：取 `steps` 里最后一段 `type === 'model_output'` 的 `content[].text`；错误体有时是数组，用 `geminiErrorMessage` 统一取出 message。
  - 默认模型 `gemini-3.8-flash`；模型名不可用时依次回退 `gemini-flash-latest → gemini-3.7-flash → gemini-3.5-flash`；遇到 API key / 权限 / 配额类错误立即返回，不做无意义重试。
  - 已实测 `POST /v1beta/interactions` 端点存在：假 Key 返回 `API key not valid. Please pass a valid API key.`（HTTP 400，本地代理转 502 并原文透传给前端 toast）。
  - `AISettingsScreen` 的 Gemini 模型下拉改为 `gemini-3.8-flash（推荐）` / `gemini-flash-latest` / `gemini-3.7-flash`，切到 Gemini 或粘贴 `AIza` Key 时默认选中 `gemini-3.8-flash`。
  - DeepSeek 仍是 OpenAI 兼容 `chat/completions`，`deepseek-flash → deepseek-chat` 回退。
  - 上游失败统一返回 `{ error }` + HTTP 502，前端把上游原文放进 toast（已实测假 Key 返回 `Authentication Fails, Your api key: ****t123 is invalid`）。
- 已用浏览器回归 `/settings/ai`：Gemini 分段切换（Base URL 消失、占位符 `AIza...`、模型默认 `gemini-3.8-flash`、副标题显示 `Google AI Studio · gemini-3.8-flash`）正常；输入 `sk-test123` 自动切回 DeepSeek 且 Base URL 重新出现；无 React 报错。
- 仍未验证：真实 DeepSeek / Gemini Key 的成功响应（需要用户自己的 Key，代码路径与错误路径已分别验证）。

**启动器报错修复（用户点「微信启动器」出错、看起来没生效）**

- 根因：旧脚本用 `Invoke-RestMethod -TimeoutSec 1` 探测 `/api/health`。Windows PowerShell 首次发 HTTP 请求时初始化很慢，1 秒必然超时 → 12 轮探测全失败 → 误判服务未启动 → 继续执行 `npm run dev` → `Port 5180 is already in use` → 窗口一闪而过。
- 修复：改成**单进程内 4 轮探测、每轮 3 秒超时**；服务已在运行时直接打印「服务已在运行，正在打开浏览器...」并退出，不再重复起服务；`npm run dev` 失败时 `pause` 让用户看到原因。
- 实测：冷启动 `HEALTH ok=True date=2026-10-26`、Vite `ready in 268 ms`；重复双击输出「服务已在运行，正在打开浏览器...」并正常打开 `/chats`。
- 关于费用：未填 Key 时全部走本地 mock，**不会调用任何 API、不消耗余额**；测试连接用的是假 Key，被上游拒绝，同样不产生费用。

### 2026-10-26 双 API 独立开关（用户要求“明确知道连的是哪个模型”）

- 数据结构：`AISettings` 改为每家服务商一份配置，切换开关不再互相覆盖 Key
  - `deepseek: { apiKey, model: 'deepseek-flash', baseUrl }`
  - `gemini: { apiKey, model: 'gemini-3.8-flash', baseUrl: '' }`
  - `verified?: Record<AIProvider, string>` 记录上次测试成功的实际模型名
  - 读取统一走 `providerConfig(ai, provider?)`（`src/lib/ai.ts`），`aiReady()` 也改为按当前服务商的 Key 判断
- 迁移：zustand persist `version: 1 → 2`，`migrate` 把旧的扁平 `apiKey/model/baseUrl` 搬进当前服务商，删掉旧字段。老用户不会丢 Key。
- 页面（`AISettingsScreen`）：
  - 顶部卡片=状态卡：未启用显示「本地模拟回复」，启用后显示 `服务商 · 实际模型`（副标题绿字「当前使用中 · 已连接/未验证/缺少 API Key」）
  - 两个互斥开关行：`DeepSeek API` / `Google AI Studio（Gemini）`，副标题显示 `脱敏 Key · 模型 · 已连接/未验证/未填 Key`；两行共用同一个 `provider`，同一时间只会开一家，两家都关=本地模拟
  - 下方配置区跟随当前服务商：DeepSeek 显示 Base URL 和温度，Gemini 隐藏这两项；Key/模型分别绑定到各自配置
  - 测试成功后自动打开对应开关；若服务端发生模型回退（如 3.8 不可用），把实际可用的模型写回配置并 toast 提示，顶部随即显示真实模型
- 服务端：`geminiModelCache`（按 apiKey，30 分钟）记住上次成功的模型，避免每条消息都重试 4 个模型名；401/403/429 以及 key/permission/quota/billing/resource exhausted/too many requests 一律立即返回，不再回退。
- 实测发现（重要）：
  - 用户已保存的 Gemini Key 能连通，但实际生效模型是 `gemini-3.5-flash`：`gemini-3.8-flash`、`gemini-flash-latest`、`gemini-3.7-flash` 在该账号下都不可用（所以之前一直失败）。
  - 之后同一 Key 直接请求返回 **429 Too Many Requests（Free Tier 每日请求次数上限已用尽）**，说明免费额度也被打满了；当天无法再做成功路径验证。
- 浏览器回归：两个开关互斥、顶部卡片与实际配置同步、Gemini 模式 Base URL 消失、DeepSeek 模式恢复，控制台无报错。

### 2026-10-26 DeepSeek 网页端桥接（用户要求，Gemini 暂停）

用户放弃 Gemini（免费额度打满、3.8 不可用），改为复用自己已登录的 DeepSeek 网页端。

- 依赖：`playwright`（devDependency）+ `npx playwright install chromium`。
- `server/deepseekWeb.ts`：
  - `chromium.launchPersistentContext('.browser-data/deepseek')`，**有头**窗口，登录态持久化；首次调用才启动，不会拖慢服务启动。
  - `openForLogin()`：打开 `https://chat.deepseek.com/` 并前置窗口，用户手动登录一次。
  - `ask(messages)`：串行队列（同一时间只跑一个请求）+ 请求最小间隔 5 秒；每轮先 `goto` 新对话页，把 system 提示和历史拼成一段文本；短文本逐字随机延迟输入（35–110ms，偶发 200–500ms 停顿），长文本整体粘贴后在末尾补打；回车后用「最后一条 `.ds-markdown` 文本连续 1.5 秒不变」判定流式结束，总超时 90 秒。
  - 明确不做任何隐藏自动化特征的伪装（不改 `navigator.webdriver`、不用 stealth 插件），站点自己的风控/验证码照常生效。
- `vite.config.ts` 新端点：`GET /api/web/status`、`POST /api/web/login`、`POST /api/web-chat`（避开 `/api/chat` 前缀，故命名 web-chat）。
- `AIProvider` 增加 `'web'`；`AISettings.web` 存占位配置（无 Key）。`providerConfig()` / `aiReady()` 已适配：web 只要求 `enabled`。`callModel()` 在 web 模式下直接 POST `/api/web-chat`。
- 设置页：第三个互斥开关「DeepSeek 网页端（借用登录会话）」，副标题显示 `未登录 / 浏览器已开，等待登录 / 已登录 / 已登录 · 已连接`；配置区不放 Key，只有登录状态 +「打开浏览器登录」+ 风险提示；每 5 秒轮询 `/api/web/status`（仅在该服务商被选中时）。
- 已实测：`/api/web/status` 返回 `{running:false,loggedIn:false}` → `POST /api/web/login` 后变成 `{running:true,loggedIn:false}`（窗口成功打开）；未登录时 `/api/web-chat` 返回 502 `DeepSeek 网页端未登录：点「打开浏览器登录」，登录后重试`；三开关互斥与配置区切换经浏览器回归通过；`npm run build` 通过。
- 未验证：真实登录后的问答复用（需要用户在那个窗口里登录一次）。
- 风险声明（已写进页面）：违反 DeepSeek 使用条款，账号可能被限制；网页改版会导致选择器失效，维护点集中在 `server/deepseekWeb.ts`。
- 注意：`.browser-data/` 里存的是登录 Cookie，属于敏感目录，不要提交/外传。
- Gemini 保留开关但默认关闭；`geminiModelCache` 仍按 Key 缓存上次可用模型。

### 2026-10-26 网页端改为「一好友一会话」（用户实测反馈后重构）

用户实测发现：网页端已经回复了好几次，界面却一直显示在连接。根因两条：

1. 每轮都 `goto('/')` 重新开新对话，且把整段历史重新拼一遍发过去 —— 网页端本来自带记忆，这样既浪费又丢连续性。
2. 回车发送偶尔没被页面接收（React 还没就绪），程序却仍按“等 90 秒新回复”处理，于是表现为「明明在回复、这边还在连接」。

改法（`server/deepseekWeb.ts` 重写 + 少量前端改动）：

- 用探针实测了真实 DOM：输入框是 `textarea[placeholder="给 DeepSeek 发送消息"]`（**没有** `id="chat-input"`），回复容器是 `div.ds-markdown.ds-assistant-message-main-content`，会话地址形如 `/a/chat/s/<uuid>`。
- `ask()` 参数改为 `{ text, system, threadKey }`：**只发当前这一句**；`system` 只在该会话第一句时发一次。
- `threads`（threadKey → 会话地址）持久化到 `.browser-data/deepseek-threads.json`，服务重启后仍能回到原会话；没有记录就自动开新会话（从首页发）。
- 发送改为 `submit()`：回车后 2.5 秒内观察输入框是否被清空，未清空再按一次回车，避免“以为发了其实没发”。
- 回复判定：条数变多或最后一条内容变化才算新回复，文本稳定 2.2 秒视为结束，总超时 120 秒；失败时把页面截图写到 `.browser-data/web-timeout.png` 并在错误信息里带回复块数量。
- `forgetThread(threadKey)` + `POST /api/web/forget`：作废该好友的会话（若浏览器正停在那条会话上会退回首页）。前端 `clearChat()` 里顺手调用，所以「清空聊天记录」= 下一条自动开新对话。
- 好友资料页（二级页 `/friend/:id`，非一级设置）底部新增「清空聊天记录」一行 + 确认弹窗，文案不出现 AI 字样；非好友状态该行禁用。
- 前端 `callModel()` 在 web 模式下只取最后一条 user 消息 + system，`threadKey` 用 `friend.id`；API 模式维持原来的整段历史。

实测数据（已登录状态）：第一句 8.7s，同会话第二句 6.1s 且能答上「你刚才说过什么」；`/api/web/forget` 后同一 threadKey 自动新建会话（会话 uuid 变化，模型明确表示“这是我们第一次对话”），耗时 6s。好友资料页新增行与弹窗经浏览器回归通过，无控制台报错，`npm run build` 通过。

### 2026-10-26 网页端降风险行为层（用户要求，针对验证码/封号担心）

原则：**不伪装指纹**（不改 `navigator.webdriver`、不用 stealth 插件），只让操作节奏和动作像真人。全部集中在 `server/deepseekWeb.ts`：

- 鼠标：`moveMouseLikeHuman()` 从上次位置出发，经中间点分 4–12 步移动，带过冲；`clickLikeHuman()` 点在元素内 30%–70% 的随机位置，不再永远正中；每次移动后记下坐标。
- 滚动：`scrollLikeHuman()` 用 `mouse.wheel` 分 1–5 段滚动，段间随机停顿；`glanceAtPage()` 在发消息前随机“看一眼”（35% 上滚再下滚 / 35% 下滚 / 30% 只挪鼠标），额外 0.5–1.4s 停留。
- 打字：短句逐字敲，55–160ms/字，8% 概率停顿 300–700ms；长句整体粘贴（真人也会粘贴）；打完后 0.4–1.1s 再发送。
- 间隔：两条消息之间 6–15 秒，另有 12% 概率追加 15–45 秒长停顿（`scheduleNextGap()`），不再是固定 5 秒等间距。
- 频率上限：一小时最多 50 次（`MAX_REQUESTS_PER_HOUR`），超了直接拒绝，避免主动消息调度把网页端刷成机器人。
- 熔断：连续 3 次失败暂停 5 分钟；失败时仍会写 `web-timeout.png` 截图。
- 验证码/滑块：`detectChallenge()` 在每次发送前检查 `[class*="captcha"]`、`iframe[src*="captcha|verify"]`，以及弹层里是否出现“人机验证/拖动滑块/请完成验证/安全验证/登录已过期/账号异常”，命中即**立即停手并报错**，让用户在那个窗口里手动完成验证。只在弹层与验证容器里找文字，避免把侧边栏会话标题误判成验证码。
- 环境一致性：窗口尺寸每次 1180–1360 × 820–960 随机、`locale: zh-CN`、`timezoneId: Asia/Shanghai`。
- 残留实例自愈：开发服务器被直接关掉时，Playwright 的浏览器会变孤儿进程占住配置目录，再次启动报「正在现有的浏览器会话中打开」。`launch()` 现在失败时只清理命令行里带 `.browser-data/deepseek` 的 chrome 进程，然后重试一次（不会动用户自己的浏览器）。

实测：残留 9 个孤儿进程时首次请求 17.1s（含清理+重启+真人节奏），回复「不忙，你说。」；同会话第二句 9.7s，回复「不知道，你想吃啥？」。`npm run build` 通过。

**仍无法消除的风险（如实说明）**：这是借用网页登录态，本身不是官方接口；行为层只能降低“看起来像脚本”的概率，不能保证不被风控。真的弹出滑块/验证码时，程序会停下等你手动处理，而不是硬闯。

### 2026-10-26 长对话里定期补设定（防止“聊久了忘了自己是谁”）

问题：网页端虽然自带记忆，但一条会话聊到几十句后，开头那段设定会被稀释，甚至因上下文截断直接丢失，表现出来就是角色性格崩了、忘了关系、忘了当天安排。

做法（只补设定，不重发历史、不重开会话，所以对话是连续的）：

- 会话状态从「只存地址」升级为 `{ url, sent, seededAt }`，持久化在 `.browser-data/deepseek-threads.json`；旧格式（纯字符串地址）在 `loadThreads()` 里自动迁移。
- 重发阈值取两个先到者：**每聊 12–16 句**（每个好友用 `threadKey` 哈希固定一个值，避免所有角色同一节拍），或**距上次发设定满 45 分钟**（顺带刷新 `buildSystemPrompt` 里的当前时间和今日事件）。计数是持久化的，不是每次进程序重新数，所以重启也不会漏。
- 判定在 `shouldReseed()`；真正发送时由 `composePrompt()` 拼装：
  - 新会话：`设定 + 这一句`（沿用最早验证过的格式）
  - 中途补设定：`【提醒：按下面的设定继续聊，不用回应这段提醒，也不要重新自我介绍】+ 设定 + 【提醒结束】+ 这一句`
- 发送成功后 `sent` 归零、`seededAt` 刷新；不带设定的话 `sent += 1`。会话 URL 变了（被删后新建）视为新会话。
- `清空聊天记录` 会删掉该好友的整条状态，下一条自然重新开始。

实测（为便于验证，临时把阈值压到 1 句 / 1 毫秒，验证后已恢复为 12–16 句 / 45 分钟）：

| 场景 | 回复 | 状态文件 |
|---|---|---|
| 新会话首句 | 有呀有呀！去哪儿玩？ | `sent:0, seededAt` 更新 |
| 同会话第二句（触发补设定） | 好呀！看啥片？ | `sent` 仍为 0（说明这一句带了设定） |

两次回复都在正题上，没有出现“好的，我记住了”这类应答设定的副作用。`npm run build` 通过。

### 2026-10-26 去掉全部“正在输入”提示

网页端一条消息要 6–15 秒甚至更久，挂着「对方正在输入...」会长时间停在那里，观感比不显示更差，因此全部移除：

- 聊天页导航栏副标题：删掉 `subtitle={typing ? '对方正在输入...' : undefined}`（`ChatScreen.tsx`），同时移除不再使用的 `typing` 选择器。
- 会话列表预览：删掉 `.typing-text` 那行分支，一律显示最后一条消息摘要（`ChatsScreen.tsx`）；`.typing-text` 样式一并删除。
- AI 连接页的行为说明同步改掉，不再提“正在输入”。
- `store` 里的 `typing` 标记保留但不再参与任何显示（延迟节奏仍由 `setTimeout` 控制，与它无关）。

回归：发消息后等待期间导航栏只有「小鹿」，整页都不含“正在输入”字样，回复照常弹出，无控制台报错，`npm run build` 通过。





### 仍与官方有差异（非阻塞）

- 微信列表没有“微信支付 / 服务通知 / 折叠的聊天”静态行，行数比官方少。
- 我页资料卡下方两个状态 pill 比官方略小。
- 官方聊天截图是语音模式（“按住 说话”）；复刻默认文字输入模式，对应 `014705` 文字输入截图，属预期。
- 顶部状态栏 + 导航合计 86px，官方约 97px，四页内容整体比官方高约 10px（全局布局差异，与图标无关）。

---

## 4. 关键文件地图

```text
src/
  App.tsx                    路由、状态栏主题（/pay 绿、/scan 暗、/moments 照片、/me 专属、其余暗）
  styles.css                 全部视觉规范（重点）
  seed.ts                    8 个 AI 好友 + 4 个陌生人/请求 + 6 条朋友圈 + 今日事件
  store.ts                   Zustand store + persist + AI 回复/主动消息落气泡
  types.ts                   Friend / Message / Moment / AISettings 等
  lib/ai.ts                  persona prompt、时间/事件上下文、/api/chat 调用、mock 回复、主动消息生成
  lib/proactive.ts           打开网页期间的 AI 运行时：刷新事件文件 + 自主主动消息调度
  lib/time.ts                聊天/朋友圈时间格式
  lib/image.ts               图片压缩
  components/
    WxIcons.tsx              官方截图裁切图标（img 引用 public/icons）
    TabIcon.tsx              底栏四图标（active/inactive PNG）
    NavBar.tsx / TabBar.tsx / StatusBar.tsx / Avatar.tsx / Cell.tsx
  screens/
    ChatsScreen.tsx          微信列表（文件传输助手 + AI 好友）
    ContactsScreen.tsx       通讯录（7 个功能入口 + 企业 + A-Z）
    DiscoverScreen.tsx       发现（六组）
    MeScreen.tsx             我
    ChatScreen.tsx           聊天（文字/语音/图片/红包/转账、表情/加号面板）
    MomentsScreen.tsx        朋友圈信息流、点赞评论
    ComposeMomentScreen.tsx  发朋友圈
    SettingsScreen.tsx / AISettingsScreen.tsx / EventsScreen.tsx
    AddFriendScreen.tsx / NewFriendsScreen.tsx / ProfileScreen.tsx / SearchScreen.tsx
    ServicesScreen.tsx / PayScreen.tsx / WalletScreen.tsx / MyQRCodeScreen.tsx / ScanScreen.tsx
启动微信.bat                  一键启动（双击）；桌面快捷方式「微信AI沙盒」指向它
images/                      用户提供的官方手机截图（原生 1260×2800）
public/icons/                官方截图裁切出的 30 个图标 PNG（Vite 静态资源）
scripts/extract_official_icons.py  图标裁切脚本；换官方图后重跑即可
screenshots/
  official-icons.png         【重要】官方图标裁切总表
  official-icons-zoom.png    难点图标放大
  official-icons-big.png     扫一扫/附近/小程序/朋友圈/服务号/企业微信更大图
  official-current.png      MuMu 官方微信当前页截图（平板版式，只用于看图标/色）
  compare-main.png          四页官方 vs 复刻（v15，当前有效）
  compare-chat-moments.png  聊天/朋友圈对比（v15，当前有效）
  v15/                      最新六页截图与逐页对比图
scripts/patch-*.py            上一轮的临时补丁脚本，可忽略/删除，不要依赖
wechat-master/                 旧 Android 项目，只作参考，绝不改造/嵌套
```

---

## 5. 视觉规范（当前基线，改 UI 必须遵守）

### 5.1 画布

- 桌面外框：`.device` 432×934，padding 10，圆角 60。
- 内部屏幕：412×914，圆角 48。
- `@media (max-width: 480px)` 才全屏铺满（真手机）。
- 桌面预览故意保留手机外框；不要把 527px 桌面窗口当成手机宽度。

### 5.2 色板（从官方手机截图取色）

```css
--wx-green: #58BE6A;        /* 暗色强调绿：tab/服务/勾 */
--wx-green-dark: #4ca85e;
--wx-bg: #191919;           /* 列表/卡片底 */
--wx-nav: #111111;          /* 页面/导航底 */
--wx-tab: #1e1e1e;          /* 底栏 */
--wx-cell: #191919;
--wx-text: #d1d1d1;         /* 主文字 */
--wx-secondary: #8c8c8c;
--wx-tertiary: #5e5e5e;
--wx-line: #242424;         /* 分割线 */
--wx-line-strong: #2e2e2e;
--wx-red: #fa5151;
--wx-bubble: #62b379;       /* 发出气泡 */
--wx-bubble-in: #2c2c2c;    /* 收到气泡 */
--wx-chat-bg: #111111;
```

其他实测：
- 聊天列表时间/预览：`#666666`
- 聊天时间戳：`#595959`
- 聊天气泡内文字（发出）：`#111111`
- 朋友圈作者名：`#b0b0b0`
- 状态栏 Me 页专属：背景 `#191919`，文字 `#eeeeee`

### 5.3 头部 / 底栏

- 状态栏：38px（官方手机实测约 32dp，当前 38 是为了网页观感，保持）。
- 导航栏：48px，标题 17.5px / 600。
- 底栏：56px，图标 26px，标签 10px。
- “我”页状态栏用 `.statusbar--me`（#191919），与顶部卡片连成一片。
- 朋友圈状态栏是透明的、绝对定位覆盖在封面上（仅 `/moments` 精确匹配，不要影响 `/moments/compose`）。

### 5.4 微信页（聊天列表）

- 行高：`padding:16px` + 头像 40 = 72px。
- 头像 40，名字 17 / #d1d1d1，时间 12.5 / #666，预览 14 / #666。
- 行间距 22，分隔线 `left:75px`、`#242424`。
- 文件传输助手行是置顶底色 `#242424`；其余 `#191919`。
- 免打扰图标：`BellOff` 14px，#5e5e5e。
- 未读红色 badge。

### 5.5 通讯录

- 功能行/好友行：57px 高。
- 彩色图标：40×40，圆角 8；图标左 16，文字左 78（gap 22）。
- 分隔线：`left:73px`。
- 好友头像 40，圆角 5，文字 16。
- 企业微信联系人上方有 30px 的“我的企业及企业联系人”标签。
- 字母分组头 30px / 13px / #8c8c8c。
- 右侧索引：绝对定位 `top:24%; bottom:20%; right:2px`，宽度 17，字号 9.5。
- 功能入口顺序：新的朋友 / 仅聊天的朋友 / 群聊 / 标签 / 公众号 / 服务号 / 我的企业及企业联系人 / 企业微信联系人 / A-Z 好友。

### 5.6 发现

- 行高 58px，图标 24–26，图标左 16，文字左 56，箭头 `#5e5e5e`。
- 分组（必须严格保持）：
  1. 朋友圈（单独）
  2. 视频号（单独）
  3. 扫一扫 + 听一听
  4. 搜一搜（单独）
  5. 附近（单独）
  6. 小程序（单独）
- 组间距 10px，分隔线 `left:56px`。
- 官方 glyph 色：视频号 #BD8041、扫一扫 #4487D8、听一听/搜一搜 #E75E58、附近 #4A94ED、小程序 #8384EE。
- 朋友圈 glyph：手绘 SVG `MomentsGlyph`，6 段彩色弧 + 6 条弧形叶片，中心留洞（不是白色实心圆）。

### 5.7 我

- 状态栏背景 #191919，与顶部卡片连成一片。
- 顶部资料卡：`min-height:192px`，`padding:68px 14px 20px 24px`；卡片从状态栏下一直延伸，视觉总高（含状态栏）≈230px。
- 头像 64 / 圆角 8；头像左 24；名字 22 / 600；name 与头像 gap 18。
- ID 行 13px，#8c8c8c，右侧 chevron；QR 二维码图标绝对定位 `top:68px; right:14px`。
- 服务行 57px；其余功能行 57px，图标 22，左 18，文字 59（gap 19）。
- “我”页行分隔线是**通栏**（`left:0`），不是从图标后开始。
- 功能顺序：服务 / 收藏 / 朋友圈 / 作品 / 小店与卡包 / 表情 / 设置。
- 图标色：服务 #58BE6A；收藏多色（金 #C29F3B、红 #B44E4A、蓝 #4994F1）；朋友圈 #4994F1；作品 #5AA9EC；小店 #E76D55；表情 #C29F3B；设置 #4994F1。

### 5.8 聊天页

- 背景 #111；收到气泡 #2c2c2c，发出 #62b379（文字 #111）。
- 气泡圆角 5，最大宽度 66%，头像 36，圆角 5。
- 时间戳 #595959，12px。
- 输入栏：外层 #111，输入框 #2a2a2a；左侧语音/键盘切换；输入框内右侧小麦克风；外部笑脸 + 加号；文字时有“发送”。
- 语音模式：左侧变键盘图标，输入框变“按住 说话”。
- 图片消息 onLoad 后自动贴底；`ChatScreen.tsx` 里已有 60/160/320/640/1000ms 多次 `scrollTop = scrollHeight`。
- 聊天页不显示顶部边框。

### 5.9 朋友圈

- 封面宽度 100%，`aspect-ratio: 1.388 / 1`（约 0.72 高宽比）。
- 状态栏覆盖在封面上，透明。
- 返回/相机图标：top 50px，尺寸 24/21；白色。
- 我的昵称 + 头像在封面右侧，`bottom:29.5%`；头像 42，圆角 6，名字 18。
- 信息流 `padding:42px 16px 0`。
- 帖子头像 32，圆角 5；作者 15.5 / #b0b0b0；内容 16。
- 点赞/评论社交盒 #242424；时间 11.5 / #5e5e5e；“…”按钮 34×22 / 圆角 6。

---

## 6. 图标系统（当前重点）

用户明确说过“里面的图标看起来不一样”，并要求“哪怕把原版的那个图标给截下来”。**结论：不用 SVG 手绘近似，全部用官方截图裁切的 PNG。**

### 来源与生成

- 裁切脚本：`scripts/extract_official_icons.py`，输出目录 `public/icons/`。
- 官方截图原生 1260×2800（411dp 宽，约 3.065 px/dp），坐标都写死在脚本里；换截图后按新坐标改常量重跑。
- 显示尺寸 = 裁切像素 / 3.065，写在 `WxIcons.tsx` / `TabIcon.tsx` 的 `width`/`height` 上。

### 图标清单

- 通讯录：`contacts-new` / `chatonly` / `group` / `tag` / `official` / `service` / `enterprise`，127×127，显示 41×41。
- 文件传输助手：`chat-fileassistant`，127×127，显示 41×41。
- 发现页：`discover-moments` / `channels` / `scan` / `listen` / `search` / `nearby` / `mini`。
- 我页：`me-service` / `fav` / `moments` / `works` / `store` / `emoji` / `settings`。
- 底栏：`tab-chat`、`tab-contacts`、`tab-discover`、`tab-me` 及各自 `-active`（激活图从对应页面截图取绿色像素定位）。

### 组件

- `WxIcons.tsx` 导出 `WxIconImage`（`<img src={BASE_URL + icons/name.png}>`）；`ContactTile`、`FileAssistantGlyph`、`MomentsGlyph`、`ChannelsGlyph`、`ScanGlyph`、`ListenGlyph`、`SearchGlyph`、`NearbyGlyph`、`MiniGlyph`、`ServiceGlyph`、`CubeGlyph`、`PhotoGlyph`、`WorksGlyph`、`StoreGlyph`、`EmojiGlyph`、`SettingsGlyph` 都只是尺寸包装。
- `TabIcon` 按 `active` 选 `tab-*-active.png` / `tab-*.png`。
- 相关 CSS：`.contact-tile`（40/41 尺寸、圆角 8、`flex:0 0 auto`）、`.system-avatar--file`（背景透明）、`.tab-icon-wrap img`。

### 图标状态（2026-10-26 v15 已验收）

1. 通讯录 7 个 tile 与官方**同一张图裁下**，颜色/形状/圆角完全一致。
2. 文件传输助手的绿色方块来自官方截图原图，不再是手绘文件夹。
3. 发现页 7 个 glyph、我页 7 个 glyph 全部为官方原图。
4. 底栏四图标激活/未激活均为官方原图，未激活灰色直接来自截图（≈`#d2d2d2`）。
5. 验收截图：`screenshots/v15/*-crop.png`；对比图 `screenshots/v15/cmp-*.png`。
6. **不要回退成 SVG**；新增图标一律先从官方截图裁切。

---

## 7. 官方参考和测量方法

用户手机截图（原生 1260×2800）：

| 页面 | 文件 |
|---|---|
| 微信 | `images/Screenshot_20261026_014211.jpg` |
| 通讯录 | `images/Screenshot_20261026_014238.jpg` |
| 发现 | `images/Screenshot_20261026_014242.jpg` |
| 我 | `images/Screenshot_20261026_014246.jpg` |
| 朋友圈 | `images/Screenshot_20261026_014609.jpg` |
| 聊天（语音模式） | `images/Screenshot_20261026_014634.jpg` |
| 聊天（文字输入） | `images/Screenshot_20261026_014705.jpg` |

测量：原生宽度 1260，约 411dp，换算 **dp = px / 3.065**。

图标放大参照：
- `screenshots/official-icons.png`（27 个图标总表）
- `screenshots/official-icons-zoom.png`
- `screenshots/official-icons-big.png`

MuMu 模拟器（`C:\Program Files\Netease\MuMu\nx_main\adb.exe`，设备 `127.0.0.1:7555`）：
- 可以 `exec-out screencap -p` 截屏。
- **不能**用 adb 启动或操作官方微信（安全策略拦截）；必须用户手动点。
- MuMu 里官方微信即使是全屏，也仍是**平板版式**（头像/行高偏大），不要用它的行高做基准；只用来取色、看图标形状。
- 目前模拟器 density 被设为 420（手机宽度），分辨率 1080×1920。

---

## 8. 踩过的坑

- 527px 桌面窗口曾触发全屏手机模式，把列表横向拉宽，看起来“行很扁”。现在 `@media (max-width:480px)` 才全屏，桌面保留 412dp 手机框；不要改回去。
- `statusbar--photo` 是绝对定位，只对 `/moments` 生效；`/moments/compose` 必须是普通暗色状态栏。
- 聊天气泡图片加载后高度变化会把底部消息顶出视口；已用多次 scroll + img onLoad 解决。
- 修改 seed 后旧 localStorage 不会自动更新；需要重置或改持久化版本号。
- AI 的 typing/主动消息依赖客户端定时器，整页刷新会丢；这是已知限制。
- API key 目前存 localStorage（原型妥协）；正式化时应走后端。
- 构建/截图工具偶发“classifier unavailable”；重试或稍后再试。

---

## 9. 下一步任务清单（按优先级）

### P0：构建并验收图标（已完成 2026-10-26，v15 截图验收）

1. `npm run build` 通过。
2. 已截 6 页：`/chats`、`/contacts`、`/discover`、`/me`、`/chat/xiaolu`、`/moments`；截图 527×1054，内部屏幕裁切 `(58,70,470,984)`。
3. 图标已不用 SVG：全部换成 `public/icons/*.png`（官方截图裁切），比对图见 `screenshots/v15/cmp-*.png`。
4. 原先 ServiceGlyph 中缝、ScanGlyph、朋友圈 glyph 三个手绘偏差问题随 PNG 替换一并消失。

### P1：像素微调

5. 通讯录：功能行/好友行 57、tile 41、文字左 78、分隔线 73；确认修改后没有文字换行/挤压。
6. 我：资料卡高 192、头像左 24、名字左 106、QR top 68、行 57、分隔线通栏、文字左 59。
7. 微信：行高 72、头像 40、gap 22、分隔线 75、时间/预览 #666；文件行置顶 #242424。
8. 发现：行 58、组结构、图标 24–26、分隔线 56。
9. 底部 tab 图标 22–25（按官方裁切尺寸）、标签 10、激活绿 #58BE6A。

### P2：细节补齐

10. 微信页右上角“+”在有待处理好友请求时加一个小红点（官方截图有）。
11. 可选：补“微信支付/服务通知/折叠的聊天”静态行，让列表更像官方；不要塞真实微信号/隐私。
12. 重新生成 `compare-main.png` 和 `compare-chat-moments.png`（用最新截图，别再引用旧的）。**v15 已重新生成。**

### P3：之后再做

13. 朋友圈换成真实素材/更真实 AI 内容（用户明确说后面再做，现在别堆）。
14. AI 主动消息目前是客户端调度（网页打开期间生效）；要做“关掉网页也会发消息”需要服务端常驻 + 推送，另开项目。
15. 需要 APK 时再用 Capacitor 打包。

---

## 10. 验收标准

- `npm run build` 通过。
- 桌面 527 宽时显示 412dp 手机框，没有横向拉伸；手机 ≤480 全屏。
- 四页图标与官方截图裁切原图一致（`public/icons/`），不再是 Lucide 或手绘 SVG。
- 通讯录/我/微信/发现的行高、左缩进、分隔线位置符合第 5 节。
- 聊天页输入栏 #111、内部麦克风、气泡色、时间戳、图片加载后贴底正常。
- 朋友圈封面比例/状态栏覆盖/头像位置正常。
- 流程仍然可用：加好友 → 通过请求 → 聊天 → 发朋友圈 → 点赞评论 → 设置/事件/支付壳。
- AI：设置里填 Key 后聊天走模型；未填时回落本地模拟；主动消息按静默/性格/事件触发；事件文件由服务端每轮读取。

---

## 11. 安全与边界

- 仅个人本地使用；不要把微信品牌资源/UI 对外分发或商用。
- 不要连接、登录、自动化真实微信账号；不要用 adb 操作官方微信。
- API key 不要写进前端源码或提交；正式化时走后端环境变量。
- 官方 APK/资源不要复用；图标来自用户自己手机截图的裁切，仅本地自用。

---

## 12. 快速核对表（可直接打勾）

- [x] build 通过
- [x] chats 截图 & 图标/行高检查
- [x] contacts 截图 & 7 个彩色图标
- [x] discover 截图 & 6 组结构
- [x] me 截图 & 通栏卡片/行分隔线
- [x] chat 截图 & 输入栏/气泡
- [x] tab 4 个图标形状
- [x] 文件传输助手图标
- [x] ServiceGlyph 中缝
- [x] ScanGlyph 形状
- [x] 朋友圈 glyph 光圈
- [x] 重新生成对比图
- [x] 图标全部换成官方截图裁切 PNG（`public/icons/` + 裁切脚本）
- [x] v15 六页截图 + 逐页对比图
- [ ] 手机宽度 ≤480 全屏回归
- [ ] 核心流程回归

import { CalendarDays, CheckCircle2, Eye, EyeOff, Globe, Loader2, MessageCircle, Sparkles, Wand2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { Cell, CellGroup, IconTile, Switch } from '../components/Cell'
import { providerConfig, PROVIDER_LABELS, testAIConnection } from '../lib/ai'
import { isNative } from '../lib/platform'
import { webLogin, webStatus as readWebStatus } from '../lib/webBridge'
import { useApp } from '../store'
import type { AIProvider, AIProviderConfig, AISettings } from '../types'

const MODELS: Record<AIProvider, { value: string; label: string }[]> = {
  deepseek: [
    { value: 'deepseek-flash', label: 'deepseek-flash（Flash，推荐）' },
    { value: 'deepseek-chat', label: 'deepseek-chat（稳定版）' },
    { value: 'deepseek-reasoner', label: 'deepseek-reasoner（深度思考）' },
  ],
  gemini: [
    { value: 'gemini-3.8-flash', label: 'gemini-3.8-flash（推荐）' },
    { value: 'gemini-flash-latest', label: 'gemini-flash-latest（最新 Flash）' },
    { value: 'gemini-3.7-flash', label: 'gemini-3.7-flash' },
  ],
  web: [{ value: 'deepseek-web', label: '网页端会话（不需要 Key）' }],
}

function maskKey(key: string) {
  const clean = key.trim()
  if (!clean) return '未填 Key'
  if (clean.length <= 8) return `${clean.slice(0, 2)}••••`
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`
}

export function AISettingsScreen() {
  const navigate = useNavigate()
  const ai = useApp((state) => state.settings.ai)
  const todayEvent = useApp((state) => state.todayEvent)
  const updateAI = useApp((state) => state.updateAI)
  const triggerProactive = useApp((state) => state.triggerProactive)
  const showToast = useApp((state) => state.showToast)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)
  const [testedModel, setTestedModel] = useState('')
  const [testError, setTestError] = useState('')
  const [summoning, setSummoning] = useState(false)
  const [webStatus, setWebStatus] = useState<{ running: boolean; loggedIn: boolean }>({
    running: false,
    loggedIn: false,
  })
  const [webBusy, setWebBusy] = useState(false)

  const provider: AIProvider = ai.provider ?? 'deepseek'
  const config = providerConfig(ai, provider)
  const verifiedModel = ai.verified?.[provider]
  // 页面上显示实际在用的模型：测试成功后如果发生回退，会把回退结果存下来
  const actualModel = provider === 'web' ? '网页端会话' : verifiedModel || config.model
  const active = ai.enabled && (provider === 'web' || Boolean(config.apiKey.trim()))

  const webStatusText = webStatus.loggedIn
    ? ai.verified?.web
      ? '已登录 · 已连接'
      : '已登录'
    : webStatus.running
      ? '浏览器已开，等待登录'
      : '未登录'

  useEffect(() => {
    if (provider !== 'web') return
    let alive = true
    const load = async () => {
      const data = await readWebStatus()
      if (alive) {
        setWebStatus({ running: Boolean(data.running), loggedIn: Boolean(data.loggedIn) })
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 5000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [provider])

  const openWebLogin = async () => {
    setWebBusy(true)
    try {
      const status = await webLogin()
      setWebStatus(status)
      if (isNative()) {
        showToast(status.loggedIn ? '已登录 DeepSeek' : '登录窗口已关闭，请确认已登录')
      } else {
        showToast(status.loggedIn ? '浏览器已打开，当前已是登录状态' : '浏览器已打开，请在窗口里登录 DeepSeek')
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '登录窗口打开失败')
    } finally {
      setWebBusy(false)
    }
  }

  const statusOf = (item: AIProvider) => {
    if (item === 'web') return webStatusText
    const own = providerConfig(ai, item)
    if (!own.apiKey.trim()) return '未填 Key'
    const verified = ai.verified?.[item]
    if (!verified) return '未验证'
    return verified === own.model ? '已连接' : `已连接（实际 ${verified}）`
  }

  const heroStatus = !ai.enabled
    ? '未启用'
    : active
      ? statusOf(provider)
      : '缺少 API Key'

  /** 两家服务商共用一组互斥开关：开了哪家，聊天就用哪家。 */
  const toggleProvider = (item: AIProvider, on: boolean) => {
    setTested(false)
    setTestedModel('')
    setTestError('')
    if (!on) {
      if (provider === item) updateAI({ enabled: false })
      return
    }
    updateAI({ provider: item, enabled: true })
  }

  const patchConfig = (item: AIProvider, patch: Partial<AIProviderConfig>) => {
    setTested(false)
    setTestedModel('')
    setTestError('')
    const next = { ...providerConfig(ai, item), ...patch }
    const nextVerified = { ...(ai.verified ?? {}) }
    delete nextVerified[item]
    updateAI({ [item]: next, verified: nextVerified } as Partial<AISettings>)
  }

  const eventLines = todayEvent.split('\n').map((line) => line.trim()).filter(Boolean)
  const eventPreview = eventLines[0]?.replace(/^#+\s*/, '') ?? ''

  const summonFriend = async () => {
    setSummoning(true)
    try {
      await triggerProactive()
      showToast('已让一位好友发来消息')
    } finally {
      setSummoning(false)
    }
  }

  const testConnection = async () => {
    if (provider !== 'web' && !config.apiKey.trim()) {
      showToast('先填写 API Key')
      return
    }
    setTesting(true)
    setTested(false)
    setTestError('')
    try {
      const usedModel = await testAIConnection({ ...ai, provider, enabled: true }, provider)
      setTested(true)
      setTestedModel(provider === 'web' ? '网页端会话' : usedModel)
      const nextVerified = { ...(ai.verified ?? {}), [provider]: usedModel }
      if (provider !== 'web' && usedModel !== config.model) {
        // 配的模型名在这家账号下不可用，已自动回退：把能用的模型存下来，避免每次聊天都重试一轮
        updateAI({
          enabled: true,
          provider,
          [provider]: { ...config, model: usedModel },
          verified: nextVerified,
        } as Partial<AISettings>)
        showToast(`${config.model} 不可用，已自动切到 ${usedModel}`)
      } else {
        // 测试通过就把这家的开关打开，并记住实际生效的模型
        updateAI({ enabled: true, provider, verified: nextVerified })
        showToast(
          provider === 'web'
            ? `连接成功：${PROVIDER_LABELS.web}`
            : `连接成功：${PROVIDER_LABELS[provider]} · ${usedModel}`,
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '连接失败'
      // toast 只有 2 秒，容易看不清失败原因，这里保留在页面上
      setTestError(message)
      showToast(message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="page page--sub ai-settings-page">
      <NavBar
        back
        title="AI 连接"
        right={
          <button type="button" className="nav-text-btn nav-text-btn--green" onClick={() => navigate(-1)}>
            完成
          </button>
        }
      />
      <div className="scroll settings-scroll">
        <section className={`ai-hero ${active ? 'ai-hero--on' : ''}`}>
          <div className="ai-hero-icon">
            <Sparkles size={25} strokeWidth={1.8} />
          </div>
          <div>
            <div className="ai-hero-title">
              {ai.enabled ? `${PROVIDER_LABELS[provider]} · ${actualModel}` : '本地模拟回复'}
            </div>
            <div className="ai-hero-sub">
              {ai.enabled
                ? `当前使用中 · ${heroStatus}`
                : '两个 API 都没开，好友回复用内置文案，不产生费用'}
            </div>
          </div>
          <span className={`ai-dot ${active ? 'ai-dot--on' : ''}`} />
        </section>

        <CellGroup>
          <Cell
            icon={
              <IconTile background="linear-gradient(135deg, #6bb9ff, #3a7cff)">
                <CalendarDays size={16} strokeWidth={2} />
              </IconTile>
            }
            title="今日事件"
            subtitle={
              eventPreview
                ? `${eventPreview.slice(0, 22)}${eventPreview.length > 22 ? '…' : ''}`
                : '还没写今天的事件，好友会缺少话题'
            }
            value={eventLines.length ? `${eventLines.length} 行` : '去填写'}
            onClick={() => navigate('/settings/events')}
          />
        </CellGroup>

        <section className="form-card">
          <div className="form-row form-row--switch">
            <div>
              <div className="form-label">DeepSeek API</div>
              <div className="form-hint">
                {maskKey(providerConfig(ai, 'deepseek').apiKey)} · {providerConfig(ai, 'deepseek').model} ·{' '}
                {statusOf('deepseek')}
              </div>
            </div>
            <Switch
              checked={ai.enabled && provider === 'deepseek'}
              onChange={(value) => toggleProvider('deepseek', value)}
            />
          </div>
          <div className="form-row form-row--switch">
            <div>
              <div className="form-label">Google AI Studio（Gemini）</div>
              <div className="form-hint">
                {maskKey(providerConfig(ai, 'gemini').apiKey)} · {providerConfig(ai, 'gemini').model} ·{' '}
                {statusOf('gemini')}
              </div>
            </div>
            <Switch
              checked={ai.enabled && provider === 'gemini'}
              onChange={(value) => toggleProvider('gemini', value)}
            />
          </div>
          <div className="form-row form-row--switch">
            <div>
              <div className="form-label">DeepSeek 网页端（借用登录会话）</div>
              <div className="form-hint">
                {webStatusText} · {isNative() ? '手机 App 内登录一次' : '不需要 Key · 逐字输入模拟真人'}
              </div>
            </div>
            <Switch checked={ai.enabled && provider === 'web'} onChange={(value) => toggleProvider('web', value)} />
          </div>
          <div className="form-row">
            <span className="form-hint">
              三个开关互斥，同一时间只会用一家；全关就是本地模拟，不花钱。
            </span>
          </div>
        </section>

        {provider === 'web' ? (
          <section className="form-card">
            <div className="form-row">
              <span className="form-label">正在配置：DeepSeek 网页端</span>
            </div>
            <div className="form-row">
              <div>
                <div className="form-label">浏览器登录状态</div>
                <div className="form-hint">{webStatusText}</div>
              </div>
              <button
                type="button"
                className="ai-secondary-btn"
                onClick={() => void openWebLogin()}
                disabled={webBusy}
              >
                {webBusy ? <Loader2 size={16} className="spin" /> : <Globe size={16} />}
                {webBusy ? '正在打开...' : '打开浏览器登录'}
              </button>
            </div>
            <div className="form-row form-row--stack">
              <span className="form-hint">
                {isNative()
                  ? '会弹出 App 内置的浏览器窗口，登录一次后登录状态保存在手机本地；之后每条回复都在后台页面里输入、按真人节奏发送。这条路径不是官方接口：违反对方使用条款，账号有被限制的风险，网页改版也可能失效。如果某天失效，可以改用上面的 API Key。'
                  : '会弹出一个独立浏览器窗口，登录一次后登录状态保存在本地；之后每条回复都在这个窗口里逐字输入、按真人节奏发送。这条路径不是官方接口：违反对方使用条款，账号有被限制的风险，网页改版也可能失效。'}
              </span>
            </div>
          </section>
        ) : (
          <section className="form-card">
            <div className="form-row">
              <span className="form-label">正在配置：{PROVIDER_LABELS[provider]}</span>
            </div>
          {provider === 'deepseek' ? (
            <label className="form-row form-row--stack">
              <span className="form-label">Base URL</span>
              <input
                className="form-input"
                value={config.baseUrl}
                onChange={(event) => patchConfig('deepseek', { baseUrl: event.target.value })}
                placeholder="https://api.deepseek.com"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </label>
          ) : null}
          <label className="form-row form-row--stack">
            <span className="form-label">API Key</span>
            <div className="form-input-wrap">
              <input
                className="form-input"
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(event) => patchConfig(provider, { apiKey: event.target.value })}
                placeholder={provider === 'gemini' ? 'AIza...' : 'sk-...'}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <button type="button" className="form-input-eye" onClick={() => setShowKey((value) => !value)}>
                {showKey ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
              </button>
            </div>
            <span className="form-hint">
              {provider === 'gemini'
                ? '在 Google AI Studio 创建 API Key（通常以 AIza 开头）。'
                : '在 DeepSeek 开放平台创建 API Key（通常以 sk- 开头）。'}
              Key 只保存在当前浏览器本地，不会写进代码仓库。
            </span>
          </label>
          <label className="form-row form-row--stack">
            <span className="form-label">模型</span>
            <select
              className="form-input form-select"
              value={config.model}
              onChange={(event) => patchConfig(provider, { model: event.target.value })}
            >
              {MODELS[provider].map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="form-hint">
              {provider === 'gemini'
                ? '默认 gemini-3.8-flash；如果账号暂不支持，会自动回退到 flash-latest / 3.7。'
                : 'Flash 速度快、适合日常聊天；如果接口提示该模型名不可用，会自动回退到 deepseek-chat。'}
            </span>
          </label>
          {provider === 'deepseek' ? (
            <label className="form-row form-row--stack">
              <span className="form-label">温度 {ai.temperature.toFixed(1)}</span>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={ai.temperature}
                onChange={(event) => updateAI({ temperature: Number(event.target.value) })}
                className="form-range"
              />
              <span className="form-hint">越高越活泼，越低越稳定。建议 0.8～1.0。</span>
            </label>
          ) : null}
          </section>
        )}

        <div className="ai-actions">
          <button type="button" className="ai-test-btn" onClick={() => void testConnection()} disabled={testing}>
            {testing ? <Loader2 size={18} className="spin" /> : tested ? <CheckCircle2 size={18} /> : <Wand2 size={18} />}
            {testing
              ? '正在测试...'
              : tested
                ? `连接正常${testedModel ? `：${testedModel}` : ''}`
                : `测试 ${PROVIDER_LABELS[provider]} 连接`}
          </button>
          <button
            type="button"
            className="ai-secondary-btn"
            onClick={() => void summonFriend()}
            disabled={summoning}
          >
            {summoning ? <Loader2 size={18} className="spin" /> : <MessageCircle size={18} />}
            {summoning ? '正在生成...' : '让好友主动发一条'}
          </button>
        </div>
        {testError ? <p className="ai-test-error">连接失败：{testError}</p> : null}

        <section className="form-card">
          <div className="form-row form-row--switch">
            <div>
              <div className="form-label">允许主动找你</div>
              <div className="form-hint">按性格、沉默时长和今日事件自动发消息（网页打开期间生效）</div>
            </div>
            <Switch checked={ai.proactive} onChange={(value) => updateAI({ proactive: value })} />
          </div>
          <div className="form-row form-row--stack">
            <span className="form-label">回复节奏</span>
            <div className="segmented">
              {[
                { value: 'fast', label: '快' },
                { value: 'natural', label: '自然' },
                { value: 'slow', label: '慢' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={ai.replyPace === item.value ? 'segmented-btn segmented-btn--active' : 'segmented-btn'}
                  onClick={() => updateAI({ replyPace: item.value as typeof ai.replyPace })}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="form-hint">自然模式下，好友会稍等一会儿再回复；网页端本身较慢，页面上不会显示任何“正在输入”提示。</span>
          </div>
        </section>

        <p className="settings-footer">
          三家各自的配置会分别保存，换开关不用重填。点「测试连接」通过后会打开对应开关，页面上方会一直显示当前在用的服务商和模型。
          {isNative()
            ? '网页端不需要 Key，用 App 内置的 WebView 登录一次即可；登录状态保存在手机本地。'
            : '网页端不需要 Key，但会驱动一个可见浏览器窗口，登录状态保存在本地 .browser-data 目录。'}
          每次对话和主动消息都会自动读取「每日事件」。
        </p>
      </div>
    </div>
  )
}

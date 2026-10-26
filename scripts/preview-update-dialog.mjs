import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 527, height: 1054 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5180/settings/about', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const info = {
  version: '0.1.1',
  name: 'v0.1.1',
  notes: '- 修复聊天页输入框在部分手机上被键盘遮挡\n- 优化 DeepSeek 网页端登录状态检测\n- 新增「关于微信」检查更新入口',
  apkUrl: 'https://example.com/wechat-sandbox-0.1.1.apk',
  size: 18350080,
  publishedAt: '2026-10-27T02:00:00Z',
  htmlUrl: 'https://example.com',
}

await page.evaluate(async (info) => {
  const mod = await import('/src/lib/updater.ts')
  mod.useUpdater.setState({
    status: 'available',
    info,
    dialogOpen: true,
    currentVersion: '0.1.0',
    error: '',
  })
}, info)
await page.waitForTimeout(400)
await page.screenshot({ path: 'screenshots/update-dialog.png' })

await page.evaluate(async () => {
  const mod = await import('/src/lib/updater.ts')
  mod.useUpdater.setState({ status: 'downloading', progress: 42 })
})
await page.waitForTimeout(400)
await page.screenshot({ path: 'screenshots/update-downloading.png' })

await browser.close()
console.log('done')

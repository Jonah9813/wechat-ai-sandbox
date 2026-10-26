import { chromium } from 'playwright'
import fs from 'node:fs'

fs.mkdirSync('screenshots', { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 527, height: 1054 }, deviceScaleFactor: 2 })
const base = 'http://localhost:5180'

for (const [name, path] of [
  ['mobile-settings', '/settings'],
  ['mobile-about', '/settings/about'],
  ['mobile-ai', '/settings/ai'],
]) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `screenshots/${name}.png` })
  console.log(name, await page.title())
}

await browser.close()

import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/test/raceweekend', { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForSelector('#weekend-heading', { timeout: 45000 })
  await page.waitForTimeout(10000)
  console.log(JSON.stringify(await page.evaluate(() => window.__pitwallRaceWeekendRenders ?? {}), null, 2))
  await context.close()
} finally {
  await browser.close()
}

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/test/dashboard'
const OUTPUT_DIR = path.resolve('screenshots/batch4')
const REVIEW_DIR = path.resolve('reviews/batch4')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })
fs.mkdirSync(REVIEW_DIR, { recursive: true })

const VIEWPORTS = [
  { width: 390, height: 844, name: '390' },
  { width: 1280, height: 800, name: '1280' },
]

const THEMES = ['dark', 'light']

async function run() {
  console.log(`Starting Batch 4 captures targeting: ${OUTPUT_DIR}`)
  const browser = await chromium.launch({ headless: true })

  try {
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        console.log(`\nCapturing components at ${vp.name}px in ${theme} mode...`)
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          reducedMotion: 'reduce',
          colorScheme: theme,
        })

        await context.addInitScript(({ themeMode }) => {
          window.localStorage.setItem('pitwall_theme_mode', JSON.stringify(themeMode))
          window.localStorage.setItem('pitwall_time_format_24h', JSON.stringify(true))
          window.localStorage.setItem('pitwall_tz_confirmed', JSON.stringify(true))
        }, { themeMode: theme })

        const page = await context.newPage()
        await page.goto(BASE_URL, { waitUntil: 'networkidle' })

        await page.evaluate((themeMode) => {
          if (themeMode === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }, theme)

        // Scroll through the page once
        await page.evaluate(async () => {
          const dist = 400
          const maxH = document.documentElement.scrollHeight
          for (let y = 0; y < maxH; y += dist) {
            window.scrollTo(0, y)
            await new Promise((r) => setTimeout(r, 60))
          }
          window.scrollTo(0, 0)
          await new Promise((r) => setTimeout(r, 150))
        })

        await page.waitForTimeout(600)

        // 1. Hero capture
        const heroEl = page.locator('section#next-race')
        const heroFile = `hero-${vp.name}-${theme}.png`
        await heroEl.screenshot({ path: path.join(OUTPUT_DIR, heroFile) })
        fs.copyFileSync(path.join(OUTPUT_DIR, heroFile), path.join(REVIEW_DIR, heroFile))
        console.log(`  -> Saved ${heroFile}`)

        // 2. Calendar capture
        const calEl = page.locator('#calendar')
        const calFile = `calendar-${vp.name}-${theme}.png`
        await calEl.screenshot({ path: path.join(OUTPUT_DIR, calFile) })
        fs.copyFileSync(path.join(OUTPUT_DIR, calFile), path.join(REVIEW_DIR, calFile))
        console.log(`  -> Saved ${calFile}`)

        // 3. Drivers capture
        const drivEl = page.locator('#drivers')
        const drivFile = `drivers-${vp.name}-${theme}.png`
        await drivEl.screenshot({ path: path.join(OUTPUT_DIR, drivFile) })
        fs.copyFileSync(path.join(OUTPUT_DIR, drivFile), path.join(REVIEW_DIR, drivFile))
        console.log(`  -> Saved ${drivFile}`)

        // 4. Full-page capture
        const fullFile = `fullpage-${vp.name}-${theme}.png`
        await page.screenshot({ path: path.join(OUTPUT_DIR, fullFile), fullPage: true })
        fs.copyFileSync(path.join(OUTPUT_DIR, fullFile), path.join(REVIEW_DIR, fullFile))
        console.log(`  -> Saved ${fullFile}`)

        await context.close()
      }
    }
    console.log(`\nBatch 4 captures completed successfully in: ${OUTPUT_DIR}`)
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Batch 4 capture failed:', err)
  process.exit(1)
})

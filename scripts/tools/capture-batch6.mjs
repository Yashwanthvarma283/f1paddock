import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/test/dashboard'
const REVIEW_DIR = path.resolve('reviews/batch6')

fs.mkdirSync(REVIEW_DIR, { recursive: true })

const VIEWPORTS = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 1280, height: 800, name: 'desktop' },
]

const THEMES = ['dark', 'light']

async function run() {
  console.log(`Starting Batch 6 captures targeting: ${REVIEW_DIR}`)
  const browser = await chromium.launch({ headless: true })

  try {
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        console.log(`\nCapturing components at ${vp.name} (${vp.width}px) in ${theme} mode...`)
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          reducedMotion: 'reduce',
          colorScheme: theme,
        })

        await context.addInitScript(({ themeMode }) => {
          window.localStorage.setItem('f1paddock_theme_mode', JSON.stringify(themeMode))
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

        // Scroll through the page once to hydrate all lazy/motion items
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

        // 1. Header capture (shows F1 Paddock wordmark)
        const headerEl = page.locator('header')
        if (await headerEl.count() > 0) {
          const headerFile = `header-${vp.name}-${theme}.png`
          await headerEl.first().screenshot({ path: path.join(REVIEW_DIR, headerFile) })
          console.log(`  -> Saved ${headerFile}`)
        }

        // 2. Results Section capture (shows mobile swap: Podium -> Pos table -> Standings)
        const resultsEl = page.locator('section#results')
        if (await resultsEl.count() > 0) {
          const resultsFile = `results-${vp.name}-${theme}.png`
          await resultsEl.first().screenshot({ path: path.join(REVIEW_DIR, resultsFile) })
          console.log(`  -> Saved ${resultsFile}`)
        }

        // 3. Footer capture (shows F1 Paddock & f1paddock.live)
        const footerEl = page.locator('footer')
        if (await footerEl.count() > 0 && vp.name === 'desktop') {
          const footerFile = `footer-${theme}.png`
          await footerEl.first().screenshot({ path: path.join(REVIEW_DIR, footerFile) })
          console.log(`  -> Saved ${footerFile}`)
        }

        // 4. Full-page capture
        const fullFile = `fullpage-${vp.name}-${theme}.png`
        await page.screenshot({ path: path.join(REVIEW_DIR, fullFile), fullPage: true })
        console.log(`  -> Saved ${fullFile}`)

        await context.close()
      }
    }
    console.log('\nAll Batch 6 captures successfully saved to reviews/batch6/')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Batch 6 capture failed:', err)
  process.exit(1)
})

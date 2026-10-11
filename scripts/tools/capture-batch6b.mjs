import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/test/dashboard'
const REVIEW_DIR = path.resolve('reviews/batch6b')

fs.mkdirSync(REVIEW_DIR, { recursive: true })

const VIEWPORTS = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 1280, height: 800, name: 'desktop' },
]

const THEMES = ['dark', 'light']

async function run() {
  console.log(`Starting Batch 6b captures targeting: ${REVIEW_DIR}`)
  const browser = await chromium.launch({ headless: true })

  try {
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        console.log(`\nCapturing hero at ${vp.name} (${vp.width}px) in ${theme} mode...`)
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
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

        await page.evaluate((themeMode) => {
          if (themeMode === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }, theme)

        await page.waitForTimeout(600)

        // 1. Hero capture (shows increased top and bottom spacing)
        const heroEl = page.locator('section#next-race')
        if (await heroEl.count() > 0) {
          const heroFile = `hero-${vp.name}-${theme}.png`
          await heroEl.first().screenshot({ path: path.join(REVIEW_DIR, heroFile) })
          console.log(`  -> Saved ${heroFile}`)
        }

        // 2. Full-page capture
        const fullFile = `fullpage-${vp.name}-${theme}.png`
        await page.screenshot({ path: path.join(REVIEW_DIR, fullFile), fullPage: true })
        console.log(`  -> Saved ${fullFile}`)

        await context.close()
      }
    }
    console.log('\nAll Batch 6b captures successfully saved to reviews/batch6b/')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Batch 6b capture failed:', err)
  process.exit(1)
})

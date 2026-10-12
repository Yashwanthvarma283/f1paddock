import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/'
const REVIEW_DIR = path.resolve('reviews/batch8')

fs.mkdirSync(REVIEW_DIR, { recursive: true })

const VIEWPORTS = [
  { width: 1440, height: 900, name: 'desktop' },
  { width: 390, height: 844, name: 'mobile' },
]

const THEMES = ['dark', 'light']

async function run() {
  console.log(`Starting Batch 8 captures targeting: ${REVIEW_DIR}`)
  const browser = await chromium.launch({ headless: true })

  try {
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        console.log(`\nCapturing main dashboard at ${vp.name} (${vp.width}px) in ${theme} mode...`)
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

        // Wait for data to load and skeleton shimmer to detach
        try {
          await page.locator('section#next-race h1').waitFor({ state: 'visible', timeout: 15000 })
        } catch {
          console.warn('Timed out waiting for section#next-race h1')
        }
        await page.waitForTimeout(800)

        // 1. Hero capture
        const heroEl = page.locator('section#next-race')
        if (await heroEl.count() > 0) {
          const heroFile = `hero-${vp.name}-${theme}.png`
          await heroEl.first().screenshot({ path: path.join(REVIEW_DIR, heroFile) })
          console.log(`  -> Saved ${heroFile}`)
        }

        // 2. Results & Standings capture
        const resultsEl = page.locator('section#results')
        if (await resultsEl.count() > 0) {
          const resFile = `results-${vp.name}-${theme}.png`
          await resultsEl.first().screenshot({ path: path.join(REVIEW_DIR, resFile) })
          console.log(`  -> Saved ${resFile}`)
        }

        // 3. Full-page capture
        const fullFile = `fullpage-${vp.name}-${theme}.png`
        await page.screenshot({ path: path.join(REVIEW_DIR, fullFile), fullPage: true })
        console.log(`  -> Saved ${fullFile}`)

        await context.close()
      }
    }

    // Verify /test/dashboard route compatibility
    console.log('\nVerifying /test/dashboard URL route...')
    const testContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'dark',
    })
    const testPage = await testContext.newPage()
    await testPage.goto('http://localhost:5173/test/dashboard', { waitUntil: 'domcontentloaded' })
    await testPage.waitForTimeout(1000)
    await testPage.screenshot({ path: path.join(REVIEW_DIR, 'test-dashboard-compat-dark.png') })
    console.log('  -> Saved test-dashboard-compat-dark.png')
    await testContext.close()

    console.log('\nAll Batch 8 screenshots captured successfully.')
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Batch 8 capture error:', err)
  process.exit(1)
})

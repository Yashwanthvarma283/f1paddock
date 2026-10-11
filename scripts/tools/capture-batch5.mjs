import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/test/dashboard'
const OUTPUT_DIR = path.resolve('screenshots/batch5')
const MOTION_DIR = path.resolve('screenshots/batch5/motion')
const REVIEW_DIR = path.resolve('reviews/batch5')
const REVIEW_MOTION_DIR = path.resolve('reviews/batch5/motion')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })
fs.mkdirSync(MOTION_DIR, { recursive: true })
fs.mkdirSync(REVIEW_DIR, { recursive: true })
fs.mkdirSync(REVIEW_MOTION_DIR, { recursive: true })

const VIEWPORTS = [
  { width: 320, height: 800, name: '320' },
  { width: 390, height: 844, name: '390' },
  { width: 768, height: 1024, name: '768' },
  { width: 1280, height: 800, name: '1280' },
]

const THEMES = ['dark', 'light']

async function run() {
  console.log(`Starting Batch 5 captures targeting: ${OUTPUT_DIR}`)
  const browser = await chromium.launch({ headless: true })

  try {
    // 1. Full-page captures across 4 viewports and 2 themes
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        console.log(`\nCapturing full-page at ${vp.name}px in ${theme} mode...`)
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

        // Scroll through once
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

        const filename = `fullpage-${vp.name}-${theme}.png`
        const filePath = path.join(OUTPUT_DIR, filename)
        await page.screenshot({ path: filePath, fullPage: true })
        fs.copyFileSync(filePath, path.join(REVIEW_DIR, filename))
        console.log(`  -> Saved ${filename}`)

        await context.close()
      }
    }

    // 2. Motion Captures: Nav indicator, progress line, count-up, back to top
    console.log('\nCapturing motion frames...')
    const motionContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'no-preference',
      colorScheme: 'dark',
    })

    await motionContext.addInitScript(() => {
      window.localStorage.setItem('pitwall_theme_mode', JSON.stringify('dark'))
      window.localStorage.setItem('pitwall_time_format_24h', JSON.stringify(true))
      window.localStorage.setItem('pitwall_tz_confirmed', JSON.stringify(true))
    })

    const motionPage = await motionContext.newPage()
    await motionPage.goto(BASE_URL, { waitUntil: 'networkidle' })
    await motionPage.waitForTimeout(400)

    // Motion Frame 1: Sticky nav at initial tab
    const navEl = motionPage.locator('nav[aria-label="Dashboard sections"]')
    await navEl.screenshot({ path: path.join(MOTION_DIR, 'nav-indicator-frame1.png') })
    fs.copyFileSync(path.join(MOTION_DIR, 'nav-indicator-frame1.png'), path.join(REVIEW_MOTION_DIR, 'nav-indicator-frame1.png'))
    console.log('  -> Saved nav-indicator-frame1.png (Next race active)')

    // Click 'Calendar' tab to demonstrate sliding indicator
    await motionPage.locator('nav[aria-label="Dashboard sections"] a[href="#calendar"]').click()
    await motionPage.waitForTimeout(80) // mid-transition
    await navEl.screenshot({ path: path.join(MOTION_DIR, 'nav-indicator-frame2.png') })
    fs.copyFileSync(path.join(MOTION_DIR, 'nav-indicator-frame2.png'), path.join(REVIEW_MOTION_DIR, 'nav-indicator-frame2.png'))
    console.log('  -> Saved nav-indicator-frame2.png (Sliding indicator in flight)')

    await motionPage.waitForTimeout(250) // settled
    await navEl.screenshot({ path: path.join(MOTION_DIR, 'nav-indicator-frame3.png') })
    fs.copyFileSync(path.join(MOTION_DIR, 'nav-indicator-frame3.png'), path.join(REVIEW_MOTION_DIR, 'nav-indicator-frame3.png'))
    console.log('  -> Saved nav-indicator-frame3.png (Calendar active)')

    // Progress line capture at partial scroll
    await motionPage.evaluate(() => window.scrollTo(0, 1500))
    await motionPage.waitForTimeout(200)
    await motionPage.screenshot({
      path: path.join(MOTION_DIR, 'progress-line-frame1.png'),
      clip: { x: 0, y: 0, width: 1280, height: 120 },
    })
    fs.copyFileSync(path.join(MOTION_DIR, 'progress-line-frame1.png'), path.join(REVIEW_MOTION_DIR, 'progress-line-frame1.png'))
    console.log('  -> Saved progress-line-frame1.png')

    await motionPage.evaluate(() => window.scrollTo(0, 3000))
    await motionPage.waitForTimeout(200)
    await motionPage.screenshot({
      path: path.join(MOTION_DIR, 'progress-line-frame2.png'),
      clip: { x: 0, y: 0, width: 1280, height: 120 },
    })
    fs.copyFileSync(path.join(MOTION_DIR, 'progress-line-frame2.png'), path.join(REVIEW_MOTION_DIR, 'progress-line-frame2.png'))
    console.log('  -> Saved progress-line-frame2.png')

    // Back to top button capture
    const bttEl = motionPage.locator('button[aria-label="Scroll back to top of page"]')
    if (await bttEl.isVisible()) {
      await bttEl.screenshot({ path: path.join(MOTION_DIR, 'back-to-top.png') })
      fs.copyFileSync(path.join(MOTION_DIR, 'back-to-top.png'), path.join(REVIEW_MOTION_DIR, 'back-to-top.png'))
      console.log('  -> Saved back-to-top.png')
    }

    // CountUp capture
    const countupEl = motionPage.locator('#results').first()
    await countupEl.screenshot({ path: path.join(MOTION_DIR, 'countup-frame1.png') })
    fs.copyFileSync(path.join(MOTION_DIR, 'countup-frame1.png'), path.join(REVIEW_MOTION_DIR, 'countup-frame1.png'))
    console.log('  -> Saved countup-frame1.png')

    await motionContext.close()
    console.log(`\nBatch 5 captures completed successfully in: ${OUTPUT_DIR}`)
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Batch 5 capture failed:', err)
  process.exit(1)
})

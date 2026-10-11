import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/test/dashboard'
const OUTPUT_DIR = path.resolve('screenshots/closeout')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const VIEWPORTS = [
  { width: 390, height: 844, name: '390' },
  { width: 768, height: 1024, name: '768' },
  { width: 1280, height: 800, name: '1280' },
  { width: 1920, height: 1080, name: '1920' },
]

const THEMES = ['dark', 'light']

async function run() {
  console.log(`Starting dashboard captures targeting: ${OUTPUT_DIR}`)
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

        // Ensure theme class is applied on root
        await page.evaluate((themeMode) => {
          if (themeMode === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }, theme)

        // Scroll through the whole page once
        await page.evaluate(async () => {
          const distance = 400
          const totalHeight = document.documentElement.scrollHeight
          for (let pos = 0; pos < totalHeight; pos += distance) {
            window.scrollTo(0, pos)
            await new Promise((r) => setTimeout(r, 60))
          }
          window.scrollTo(0, 0)
          await new Promise((r) => setTimeout(r, 150))
        })

        // Wait for safe rendering fallback
        await page.waitForTimeout(600)

        // Verify Calendar and Drivers visibility
        const visibility = await page.evaluate(() => {
          const cal = document.querySelector('#calendar')
          const driv = document.querySelector('#drivers')
          const calRect = cal ? cal.getBoundingClientRect() : null
          const drivRect = driv ? driv.getBoundingClientRect() : null
          const calCards = cal ? cal.querySelectorAll('.grid > *').length : 0
          const drivCards = driv ? driv.querySelectorAll('.grid > *').length : 0

          return {
            calendarExists: !!cal,
            calendarHeight: calRect ? calRect.height : 0,
            calendarCards: calCards,
            driversExists: !!driv,
            driversHeight: drivRect ? drivRect.height : 0,
            driversCards: drivCards,
          }
        })

        console.log(`  - Calendar: exists=${visibility.calendarExists}, height=${Math.round(visibility.calendarHeight)}px, cards=${visibility.calendarCards}`)
        console.log(`  - Drivers: exists=${visibility.driversExists}, height=${Math.round(visibility.driversHeight)}px, cards=${visibility.driversCards}`)

        if (!visibility.calendarExists || visibility.calendarHeight === 0 || !visibility.driversExists || visibility.driversHeight === 0) {
          throw new Error(`Calendar or Drivers section not visible at ${vp.name} ${theme}!`)
        }

        const filename = `dashboard-${vp.name}-${theme}.png`
        const filePath = path.join(OUTPUT_DIR, filename)
        await page.screenshot({ path: filePath, fullPage: true })
        console.log(`  -> Saved ${filename}`)

        await context.close()
      }
    }

    // 2. Time Format verification captures (12h vs 24h at 1280)
    console.log('\nCapturing time format verification (12h vs 24h)...')
    for (const is24h of [true, false]) {
      const modeLabel = is24h ? '24h' : '12h'
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        reducedMotion: 'reduce',
        colorScheme: 'dark',
      })

      await context.addInitScript(({ is24 }) => {
        window.localStorage.setItem('pitwall_theme_mode', JSON.stringify('dark'))
        window.localStorage.setItem('pitwall_time_format_24h', JSON.stringify(is24))
        window.localStorage.setItem('pitwall_tz_confirmed', JSON.stringify(true))
      }, { is24: is24h })

      const page = await context.newPage()
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      await page.waitForTimeout(400)

      const timeTexts = await page.evaluate(() => {
        const heroSchedule = document.querySelector('section#next-race ul')
        return heroSchedule ? Array.from(heroSchedule.querySelectorAll('li span.dv2-fig')).map(el => el.textContent.trim()) : []
      })
      console.log(`  - ${modeLabel} schedule times:`, timeTexts)

      const heroEl = await page.locator('section#next-race')
      const filename = `hero-timeformat-${modeLabel}.png`
      await heroEl.screenshot({ path: path.join(OUTPUT_DIR, filename) })
      console.log(`  -> Saved ${filename}`)
      await context.close()
    }

    // 3. Hero background verification captures at 390 and 1280 (both themes)
    console.log('\nCapturing hero background verification at 390 and 1280 in both themes...')
    for (const theme of ['dark', 'light']) {
      for (const width of [390, 1280]) {
        const context = await browser.newContext({
          viewport: { width, height: 800 },
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
        await page.waitForTimeout(400)

        const heroEl = await page.locator('section#next-race')
        const filename = `hero-bg-${width}-${theme}.png`
        await heroEl.screenshot({ path: path.join(OUTPUT_DIR, filename) })
        console.log(`  -> Saved ${filename}`)
        await context.close()
      }
    }

    console.log(`\nAll captures completed successfully in: ${OUTPUT_DIR}`)
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Capture failed:', err)
  process.exit(1)
})

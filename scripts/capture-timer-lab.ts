import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'http://localhost:5173/test/timer'
const SCREENSHOT_DIR = path.resolve('screenshots/timer')
const MOTION_DIR = path.resolve('screenshots/timer/motion')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
fs.mkdirSync(MOTION_DIR, { recursive: true })

const VARIANTS = ['A', 'B', 'C', 'D', 'E', 'F'] as const
const STATES = [
  { key: 'gt24h', num: 1 },
  { key: 'lt1h', num: 3 },
  { key: 'running', num: 5 },
  { key: 'completed', num: 6 },
] as const
const THEMES = ['dark', 'light'] as const

async function run() {
  const measureOnly = process.argv.includes('--measure-only')
  console.log('Starting Playwright capture and measurement suite...')
  const browser = await chromium.launch({ headless: true })

  if (!measureOnly) {
    // 1. Capture Variants in States 1, 3, 5, 6 (Dark and Light, Desktop Frame and 360px Frame)
    for (const theme of THEMES) {
    for (const state of STATES) {
      for (const variant of VARIANTS) {
        const page = await browser.newPage({
          viewport: { width: 1440, height: 900 },
          reducedMotion: 'reduce',
        })

        const url = `${BASE_URL}?variant=${variant}&state=${state.key}&theme=${theme}&motion=reduced&view=compare`
        await page.goto(url, { waitUntil: 'networkidle' })
        await page.waitForTimeout(300)

        // Capture Desktop Frame
        const section = page.locator(`[data-testid="variant-section-${variant}"]`)
        if (await section.count() > 0) {
          const filename = `variant-${variant}-state${state.num}-${theme}.png`
          await section.screenshot({ path: path.join(SCREENSHOT_DIR, filename) })
        }

        await page.close()

        // Capture 360px Mobile Frame
        const mobilePage = await browser.newPage({
          viewport: { width: 360, height: 800 },
          reducedMotion: 'reduce',
        })
        const mobileUrl = `${BASE_URL}?variant=${variant}&state=${state.key}&theme=${theme}&motion=reduced&view=compare`
        await mobilePage.goto(mobileUrl, { waitUntil: 'networkidle' })
        await mobilePage.waitForTimeout(300)

        const mobileSection = mobilePage.locator(`[data-testid="variant-section-${variant}"]`)
        if (await mobileSection.count() > 0) {
          const mobileFilename = `variant-${variant}-state${state.num}-${theme}-360px.png`
          await mobileSection.screenshot({ path: path.join(SCREENSHOT_DIR, mobileFilename) })
        }

        await mobilePage.close()
      }
    }
  }

  // 2. In-Context Captures at 1920x1080 and 390
  for (const variant of VARIANTS) {
    for (const theme of THEMES) {
      // 1920x1080 Desktop
      const page1920 = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
        reducedMotion: 'reduce',
      })
      await page1920.goto(`${BASE_URL}?variant=${variant}&state=gt24h&theme=${theme}&motion=reduced&view=context`, {
        waitUntil: 'networkidle',
      })
      await page1920.waitForTimeout(300)
      await page1920.screenshot({
        path: path.join(SCREENSHOT_DIR, `in-context-variant-${variant}-${theme}-1920x1080.png`),
        fullPage: false,
      })
      await page1920.close()

      // 390 Mobile
      const page390 = await browser.newPage({
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      })
      await page390.goto(`${BASE_URL}?variant=${variant}&state=gt24h&theme=${theme}&motion=reduced&view=context`, {
        waitUntil: 'networkidle',
      })
      await page390.waitForTimeout(300)
      await page390.screenshot({
        path: path.join(SCREENSHOT_DIR, `in-context-variant-${variant}-${theme}-390px.png`),
        fullPage: false,
      })
      await page390.close()
    }
  }

  // 3. Motion Frames for C, D, E (3-4 frames each)
  console.log('Capturing motion frames for C, D, and E...')
  const motionVariants = ['C', 'D', 'E'] as const
  for (const mv of motionVariants) {
    const motionPage = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'no-preference',
    })
    // For C: test state lt1m (final seconds gantry lights sequence)
    // For D: test state gt24h
    // For E: test state gt24h
    const testState = mv === 'C' ? 'lt1m' : 'gt24h'
    await motionPage.goto(`${BASE_URL}?variant=${mv}&state=${testState}&theme=dark&motion=normal&view=compare`, {
      waitUntil: 'networkidle',
    })

    const section = motionPage.locator(`[data-testid="variant-section-${mv}"]`)
    for (let frame = 1; frame <= 4; frame++) {
      await motionPage.waitForTimeout(350)
      await section.screenshot({
        path: path.join(MOTION_DIR, `motion-variant-${mv}-frame${frame}.png`),
      })
    }
    await motionPage.close()
  }
}

  // 4. Height Measurements and Overflow Checks
  console.log('Measuring component heights and checking for overflows...')
  const measurements: Record<string, Record<string, { desktopHeight: number; mobileHeight: number }>> = {}
  const viewports = [320, 360, 390, 768, 1280, 1920]
  const overflowIssues: string[] = []

  const measurePage = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  for (const variant of VARIANTS) {
    measurements[variant] = {}
    for (const state of STATES) {
      await measurePage.goto(`${BASE_URL}?variant=${variant}&state=${state.key}&theme=dark&motion=reduced&view=compare`, {
        waitUntil: 'networkidle',
      })
      await measurePage.waitForTimeout(200)

      const heights = await measurePage.evaluate((v) => {
        const sec = document.querySelector(`[data-testid="variant-section-${v}"]`)
        if (!sec) return { desktop: 0, mobile: 0 }
        const desktopRoot = sec.querySelector('[data-testid="frame-desktop"] [data-testid="timer-root"]')
        const mobileRoot = sec.querySelector('[data-testid="frame-mobile"] [data-testid="timer-root"]')
        const fullwidthRoot = sec.querySelector('[data-testid="timer-root"]')

        if (desktopRoot && mobileRoot) {
          return {
            desktop: Math.round(desktopRoot.getBoundingClientRect().height),
            mobile: Math.round(mobileRoot.getBoundingClientRect().height),
          }
        }
        if (fullwidthRoot) {
          const h = Math.round(fullwidthRoot.getBoundingClientRect().height)
          return { desktop: h, mobile: h }
        }
        return { desktop: 0, mobile: 0 }
      }, variant)

      measurements[variant][state.key] = {
        desktopHeight: heights.desktop,
        mobileHeight: heights.mobile,
      }
    }
  }

  // Overflow and clipping checks across all viewports
  for (const vp of viewports) {
    await measurePage.setViewportSize({ width: vp, height: 800 })
    for (const variant of VARIANTS) {
      await measurePage.goto(`${BASE_URL}?variant=${variant}&state=gt24h&theme=dark&motion=reduced&view=compare`, {
        waitUntil: 'networkidle',
      })
      await measurePage.waitForTimeout(150)

      const overflow = await measurePage.evaluate(() => {
        const docEl = document.documentElement
        const body = document.body
        const hasHorizontalScroll = docEl.scrollWidth > docEl.clientWidth || body.scrollWidth > body.clientWidth
        return hasHorizontalScroll
      })

      if (overflow) {
        overflowIssues.push(`Horizontal overflow detected at ${vp}px viewport for Variant ${variant}`)
      }
    }
  }

  await measurePage.close()
  await browser.close()

  console.log('--- MEASUREMENT RESULTS ---')
  console.log(JSON.stringify(measurements, null, 2))
  console.log('--- OVERFLOW CHECK ISSUES ---')
  console.log(overflowIssues.length === 0 ? 'None detected (0 overflows)' : overflowIssues.join('\n'))

  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'measurements.json'), JSON.stringify(measurements, null, 2))
  console.log('Captures and measurements completed successfully!')
}

run().catch((err) => {
  console.error('Error running capture suite:', err)
  process.exit(1)
})

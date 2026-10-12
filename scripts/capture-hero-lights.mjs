import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const SCREENSHOT_DIR = path.resolve('screenshots/hero-lights')
const LOOP_DIR = path.resolve('screenshots/hero-lights/loop')
const BATCH_DIR = path.resolve('reviews/batch1')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
fs.mkdirSync(LOOP_DIR, { recursive: true })
fs.mkdirSync(BATCH_DIR, { recursive: true })

async function main() {
  const browser = await chromium.launch()

  console.log('--- 1. Testing and Capturing Hero at multiple viewports and themes (reducedMotion: reduce) ---')
  const viewports = [
    { name: '390', width: 390, height: 844 },
    { name: '768', width: 768, height: 1024 },
    { name: '1280', width: 1280, height: 720 },
    { name: '1920', width: 1920, height: 1080 },
  ]
  const themes = ['dark', 'light']

  for (const vp of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        reducedMotion: 'reduce',
        colorScheme: theme,
      })
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/test/dashboard`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('[data-testid="start-lights-timer"]', { timeout: 10000 })

      // Set HTML class for theme
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.classList.remove('light')
        } else {
          document.documentElement.classList.remove('dark')
          document.documentElement.classList.add('light')
        }
      }, theme)

      await page.waitForTimeout(500)

      // Locate hero element
      const hero = page.locator('#overview, section:has([data-testid="start-lights-timer"])').first()
      const heroBox = await hero.boundingBox()

      const filename = `hero-${vp.name}-${theme}.png`
      const outPath = path.join(SCREENSHOT_DIR, filename)

      if (heroBox) {
        await page.screenshot({
          path: outPath,
          clip: {
            x: 0,
            y: heroBox.y,
            width: vp.width,
            height: heroBox.height,
          },
        })
      } else {
        await page.screenshot({ path: outPath })
      }
      console.log(`Saved: ${outPath}`)

      // Copy key shots to reviews/batch1/ for the batch review rule
      if (vp.name === '1280') {
        const batchCopy = path.join(BATCH_DIR, `hero-1280-${theme}.png`)
        fs.copyFileSync(outPath, batchCopy)
      }
      if (vp.name === '390') {
        const batchCopy = path.join(BATCH_DIR, `hero-390-${theme}.png`)
        fs.copyFileSync(outPath, batchCopy)
      }

      await context.close()
    }
  }

  console.log('\n--- 2. Loop Capture (1280px, reducedMotion OFF, 2 sessions complete override) ---')
  const loopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    reducedMotion: 'no-preference',
    colorScheme: 'dark',
  })
  const loopPage = await loopContext.newPage()
  await loopPage.goto(`${BASE_URL}/test/dashboard?testCompleted=2`, { waitUntil: 'domcontentloaded' })
  await loopPage.waitForSelector('[data-testid="start-lights-timer"]', { timeout: 10000 })
  await loopPage.evaluate(() => {
    document.documentElement.classList.add('dark')
  })
  await loopPage.waitForTimeout(600)

  // Measure loop duration and check completed / animated counts
  const measureResult = await loopPage.evaluate(() => {
    const timer = document.querySelector('[data-testid="start-lights-timer"]')
    const allLights = document.querySelectorAll('[data-testid^="start-light-"]')
    const completeLights = document.querySelectorAll('[data-complete="true"]')
    const ringEl = document.querySelector('.dv2-start-light-ring')
    const computedStyle = ringEl ? window.getComputedStyle(ringEl) : null

    return {
      totalLights: allLights.length,
      completeCount: completeLights.length,
      nonCompleteCount: allLights.length - completeLights.length,
      animationDuration: computedStyle ? computedStyle.animationDuration : 'none',
      animationName: computedStyle ? computedStyle.animationName : 'none',
    }
  })

  console.log('Measured State in Browser:', measureResult)
  const durationSec = parseFloat(measureResult.animationDuration)
  const durationMs = Math.round(durationSec * 1000)
  const expectedDurationMs = measureResult.nonCompleteCount * 600 + 400 + measureResult.nonCompleteCount * 600 + 400
  console.log(`Measured Duration: ${durationMs}ms (Computed Style: ${measureResult.animationDuration})`)
  console.log(`Expected Duration formula ((N*600)+400+(N*600)+400): ${expectedDurationMs}ms`)
  if (durationMs === expectedDurationMs) {
    console.log('✓ Measured loop duration EXACTLY matches the constants formula for non-complete lights!')
  } else {
    console.warn(`Mismatch: ${durationMs}ms vs ${expectedDurationMs}ms`)
  }

  // Locate the timer card or hero for frame captures
  const timerCard = loopPage.locator('[data-testid="start-lights-timer"]')

  console.log('\nCapturing 8 frames 150ms apart...')
  for (let i = 1; i <= 8; i++) {
    const framePath = path.join(LOOP_DIR, `frame-${i}.png`)
    await timerCard.screenshot({ path: framePath })
    console.log(`Captured frame ${i}: ${framePath}`)
    await loopPage.waitForTimeout(150)
  }
  await loopContext.close()

  console.log('\n--- 3. Capturing 1 Reduced-Motion frame in loop directory ---')
  const rmContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  })
  const rmPage = await rmContext.newPage()
  await rmPage.goto(`${BASE_URL}/test/dashboard?testCompleted=2`, { waitUntil: 'domcontentloaded' })
  await rmPage.waitForSelector('[data-testid="start-lights-timer"]', { timeout: 10000 })
  await rmPage.evaluate(() => {
    document.documentElement.classList.add('dark')
  })
  await rmPage.waitForTimeout(400)
  const rmTimerCard = rmPage.locator('[data-testid="start-lights-timer"]')
  const rmPath = path.join(LOOP_DIR, 'reduced-motion.png')
  await rmTimerCard.screenshot({ path: rmPath })
  console.log(`Captured reduced motion frame: ${rmPath}`)
  await rmContext.close()

  await browser.close()
  console.log('\nAll captures successfully finished!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

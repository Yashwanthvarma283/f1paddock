import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

async function capture() {
  const dir = path.resolve('reviews/batch10')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const browser = await chromium.launch()

  // 1. Dark Mode Desktop (1440x900)
  const pageDark = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await pageDark.addInitScript(() => {
    localStorage.setItem('f1paddock_theme_mode', JSON.stringify('dark'))
  })
  await pageDark.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await pageDark.waitForTimeout(1200)

  const heroDark = pageDark.locator('#next-race')
  await heroDark.scrollIntoViewIfNeeded()
  await pageDark.waitForTimeout(800)
  await heroDark.screenshot({ path: path.join(dir, 'hero-desktop-dark.png') })

  // 2. Light Mode Desktop (1440x900)
  const pageLight = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await pageLight.addInitScript(() => {
    localStorage.setItem('f1paddock_theme_mode', JSON.stringify('light'))
  })
  await pageLight.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await pageLight.waitForTimeout(1200)

  const heroLight = pageLight.locator('#next-race')
  await heroLight.scrollIntoViewIfNeeded()
  await pageLight.waitForTimeout(800)
  await heroLight.screenshot({ path: path.join(dir, 'hero-desktop-light.png') })

  // 3. Mobile Dark Mode (390x844)
  const pageMobileDark = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await pageMobileDark.addInitScript(() => {
    localStorage.setItem('f1paddock_theme_mode', JSON.stringify('dark'))
  })
  await pageMobileDark.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await pageMobileDark.waitForTimeout(1200)

  const heroMobileDark = pageMobileDark.locator('#next-race')
  await heroMobileDark.scrollIntoViewIfNeeded()
  await pageMobileDark.waitForTimeout(800)
  await heroMobileDark.screenshot({ path: path.join(dir, 'hero-mobile-dark.png') })

  // 4. Mobile Light Mode (390x844)
  const pageMobileLight = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await pageMobileLight.addInitScript(() => {
    localStorage.setItem('f1paddock_theme_mode', JSON.stringify('light'))
  })
  await pageMobileLight.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await pageMobileLight.waitForTimeout(1200)

  const heroMobileLight = pageMobileLight.locator('#next-race')
  await heroMobileLight.scrollIntoViewIfNeeded()
  await pageMobileLight.waitForTimeout(800)
  await heroMobileLight.screenshot({ path: path.join(dir, 'hero-mobile-light.png') })

  // 5. Start lights closeup screenshots
  const timerDark = pageDark.locator('section#next-race .order-3').first()
  if (await timerDark.count() > 0) {
    await timerDark.screenshot({ path: path.join(dir, 'start-lights-dark.png') })
  }
  const timerLight = pageLight.locator('section#next-race .order-3').first()
  if (await timerLight.count() > 0) {
    await timerLight.screenshot({ path: path.join(dir, 'start-lights-light.png') })
  }

  await browser.close()
  console.log('Batch 10 screenshots captured successfully!')
}

capture().catch(console.error)

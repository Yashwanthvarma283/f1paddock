import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

async function captureBatch11() {
  const dir = path.resolve('reviews/batch11')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const browser = await chromium.launch()

  // 1. Dark Mode Desktop
  const pageDark = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await pageDark.addInitScript(() => {
    localStorage.setItem('f1paddock_theme_mode', JSON.stringify('dark'))
  })
  await pageDark.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await pageDark.waitForTimeout(1000)

  // Wait for car to enter an active corner (e.g. Turn 1 or Turn 2)
  await pageDark.waitForFunction(() => {
    const active = document.querySelector('div[style*="scale(1.2)"]')
    return Boolean(active)
  }, { timeout: 15000 }).catch(() => console.log('Timeout waiting for active corner in dark mode'))

  const heroDark = pageDark.locator('#next-race')
  await heroDark.scrollIntoViewIfNeeded()
  await pageDark.screenshot({ path: path.join(dir, 'corner-active-enlarged-dark.png') })
  await heroDark.screenshot({ path: path.join(dir, 'hero-desktop-dark.png') })

  // 2. Light Mode Desktop
  const pageLight = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await pageLight.addInitScript(() => {
    localStorage.setItem('f1paddock_theme_mode', JSON.stringify('light'))
  })
  await pageLight.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await pageLight.waitForTimeout(1000)

  // Wait for car to enter an active corner in light mode
  await pageLight.waitForFunction(() => {
    const active = document.querySelector('div[style*="scale(1.2)"]')
    return Boolean(active)
  }, { timeout: 15000 }).catch(() => console.log('Timeout waiting for active corner in light mode'))

  const heroLight = pageLight.locator('#next-race')
  await heroLight.scrollIntoViewIfNeeded()
  await pageLight.screenshot({ path: path.join(dir, 'corner-active-enlarged-light.png') })
  await heroLight.screenshot({ path: path.join(dir, 'hero-desktop-light.png') })

  // 3. Mobile Dark Mode (390x844)
  const pageMobileDark = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await pageMobileDark.addInitScript(() => {
    localStorage.setItem('f1paddock_theme_mode', JSON.stringify('dark'))
  })
  await pageMobileDark.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await pageMobileDark.waitForTimeout(1500)
  const heroMobileDark = pageMobileDark.locator('#next-race')
  await heroMobileDark.screenshot({ path: path.join(dir, 'hero-mobile-dark.png') })

  // 4. Mobile Light Mode (390x844)
  const pageMobileLight = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await pageMobileLight.addInitScript(() => {
    localStorage.setItem('f1paddock_theme_mode', JSON.stringify('light'))
  })
  await pageMobileLight.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await pageMobileLight.waitForTimeout(1500)
  const heroMobileLight = pageMobileLight.locator('#next-race')
  await heroMobileLight.screenshot({ path: path.join(dir, 'hero-mobile-light.png') })

  await browser.close()
  console.log('Batch 11 screenshots captured successfully in reviews/batch11/')
}

captureBatch11().catch(console.error)

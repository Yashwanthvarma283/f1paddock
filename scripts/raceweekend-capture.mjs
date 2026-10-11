import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const root = 'F:/F1'
const output = path.join(root, 'screenshots', 'raceweekend')
const motionOutput = path.join(output, 'motion')
fs.mkdirSync(motionOutput, { recursive: true })

const baseUrl = 'http://127.0.0.1:4173'
const widths = [390, 768, 1280, 1920]
const themes = ['light', 'dark']
const states = [
  { name: 'upcoming', path: '/test/raceweekend' },
  { name: 'completed-16', path: '/test/raceweekend/16' },
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function setTheme(page, theme) {
  await page.evaluate((value) => {
    document.documentElement.classList.toggle('dark', value === 'dark')
    window.localStorage.setItem('pitwall_theme_mode', JSON.stringify(value))
  }, theme)
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.max(240, Math.floor(window.innerHeight * 0.8))
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 35))
    }
    window.scrollTo(0, 0)
  })
  await wait(200)
}

async function captureFullPages(browser) {
  for (const width of widths) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width, height: 1080 },
        colorScheme: theme,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      for (const state of states) {
        await page.goto(`${baseUrl}${state.path}`, { waitUntil: 'networkidle', timeout: 45000 })
        await page.waitForSelector('#weekend-heading', { timeout: 45000 })
        await setTheme(page, theme)
        await wait(900)
        await scrollThrough(page)
        await page.screenshot({
          path: path.join(output, `${state.name}-${theme}-${width}.png`),
          fullPage: true,
        })
      }
      await context.close()
    }
  }
}

async function captureMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/test/dashboard/v2`, { waitUntil: 'networkidle', timeout: 45000 })
  await setTheme(page, 'dark')
  await page.waitForSelector('text=View race weekend', { timeout: 45000 })
  await page.screenshot({ path: path.join(motionOutput, '01-route-before.png') })
  await page.getByText('View race weekend', { exact: true }).click()
  await wait(80)
  await page.screenshot({ path: path.join(motionOutput, '02-route-080ms.png') })
  await wait(100)
  await page.screenshot({ path: path.join(motionOutput, '03-route-180ms.png') })
  await page.waitForSelector('#weekend-heading', { timeout: 45000 })
  await wait(180)
  await page.screenshot({ path: path.join(motionOutput, '04-route-complete.png') })

  await page.goto(`${baseUrl}/test/raceweekend/16#circuit`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForSelector('#circuit-heading', { timeout: 45000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: path.join(motionOutput, '05-sticky-top.png') })
  await page.evaluate(() => window.scrollTo(0, 680))
  await wait(180)
  await page.screenshot({ path: path.join(motionOutput, '06-sticky-collapsed.png') })

  const circuit = await page.locator('#circuit').boundingBox()
  if (circuit) {
    for (const [index, fraction] of [0.15, 0.5, 0.85].entries()) {
      await page.evaluate((value) => window.scrollTo(0, value), circuit.y + circuit.height * fraction)
      await wait(140)
      await page.screenshot({ path: path.join(motionOutput, `07-circuit-${index + 1}.png`) })
    }
  }
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await captureFullPages(browser)
  await captureMotion(browser)
} finally {
  await browser.close()
}

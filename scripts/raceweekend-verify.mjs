import { chromium } from 'playwright'

const base = 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true })
const results = []

try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(`${base}/test/raceweekend/16`, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForSelector('#weekend-heading', { timeout: 45000 })
    const before = await page.evaluate(() => ({
      title: document.querySelector('h1')?.textContent?.trim(),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      sections: document.querySelectorAll('main section.rw-anchor').length,
      navItems: document.querySelectorAll('.rw-nav-link').length,
      perf: {
        routeToFirstFrame: performance.getEntriesByName('raceweekend-route-to-first-frame').length,
        dataToPage: performance.getEntriesByName('raceweekend-data-to-page').length,
      },
      overflowNodes: Array.from(document.querySelectorAll('*')).map((node) => {
        const rect = node.getBoundingClientRect()
        const style = getComputedStyle(node)
        return {
          tag: node.tagName,
          cls: node.className?.toString?.().slice(0, 80),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          hidden: Boolean(node.closest('[aria-hidden="true"]')) || style.display === 'none' || style.visibility === 'hidden',
        }
      }).filter((item) => item.right > window.innerWidth + 1 && !item.hidden).slice(0, 5),
    }))
    await page.getByRole('tab', { name: 'constructors' }).click()
    const tabUrl = page.url()
    await page.getByRole('link', { name: 'Circuit' }).click()
    await page.waitForTimeout(50)
    const circuitHash = new URL(page.url()).hash
    await page.getByRole('button', { name: /Turn/ }).first().focus()
    const focusVisible = await page.evaluate(() => document.activeElement?.classList.contains('rw-turn-marker'))
    results.push({ width, before, tabUrl, circuitHash, focusVisible })
    await context.close()
  }

  const deepContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const deepPage = await deepContext.newPage()
  await deepPage.goto(`${base}/test/raceweekend/16#results`, { waitUntil: 'networkidle', timeout: 45000 })
  await deepPage.waitForSelector('#results-heading', { timeout: 45000 })
  await deepPage.waitForTimeout(100)
  results.push({ deepLinkScrollY: await deepPage.evaluate(() => window.scrollY) })
  await deepContext.close()

  const dashboardContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const dashboard = await dashboardContext.newPage()
  await dashboard.goto(`${base}/test/dashboard/v2`, { waitUntil: 'networkidle', timeout: 45000 })
  await dashboard.getByText('View race weekend', { exact: true }).click()
  await dashboard.waitForURL(/\/test\/raceweekend\//, { timeout: 45000 })
  results.push({ destination: new URL(dashboard.url()).pathname })
  await dashboardContext.close()
} finally {
  await browser.close()
}

console.log(JSON.stringify(results, null, 2))

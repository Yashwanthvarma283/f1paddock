import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const phase = process.argv[2] || 'after'
const output = new URL('../screenshots/raceweekend/round2/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const report = { phase, overflow: [], renders: [], compact: [] }
const routes = [{ state: 'upcoming', route: '/test/raceweekend' }, { state: 'completed', route: '/test/raceweekend/16' }]

function inspectEdges() {
  const selector = node => {
    if (node.id) return `#${node.id}`
    const classes = node.getAttribute('class')?.trim().split(/\s+/).filter(c => c.startsWith('rw-')) || []
    const parent = node.parentElement
    return classes.length ? `${node.tagName.toLowerCase()}.${classes.join('.')}` :
      `${parent ? selector(parent) + ' > ' : ''}${node.tagName.toLowerCase()}:nth-child(${parent ? Array.from(parent.children).indexOf(node) + 1 : 1})`
  }
  const elements = Array.from(document.querySelectorAll('[data-rw] *'))
  const overflowing = elements.filter(node => node.getBoundingClientRect().right > innerWidth + 0.5)
    .map(node => ({ selector: selector(node), right: +node.getBoundingClientRect().right.toFixed(2),
      hidden: Boolean(node.closest('[aria-hidden="true"]')) || getComputedStyle(node).visibility === 'hidden',
      text: node.children.length ? undefined : node.textContent?.trim().slice(0, 50) }))
  return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflowing }
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let top = 0; top < document.documentElement.scrollHeight; top += 600) {
      scrollTo(0, top)
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    scrollTo(0, 0)
  })
  await page.waitForTimeout(150)
}

try {
  for (const { state, route } of routes) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', timezoneId: 'Asia/Singapore' })
    const page = await context.newPage()
    await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForSelector('#weekend-heading')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(2000)
    const before = await page.evaluate(() => structuredClone(window.__pitwallRaceWeekendRenders || {}))
    await page.waitForTimeout(10000)
    const after = await page.evaluate(() => window.__pitwallRaceWeekendRenders || {})
    report.renders.push({ state, intervalMs: 10000, counts: Object.fromEntries(Object.keys(after).map(key => [key, after[key].count - (before[key]?.count || 0)])) })

    for (const width of [320, 360, 390, 414, 768, 1024, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await scrollThrough(page)
      report.overflow.push({ state, ...(await page.evaluate(inspectEdges)) })
      await page.locator('#sessions').evaluate(node => node.scrollIntoView())
      await page.waitForTimeout(100)
      report.compact.push({ state, width, ...(await page.evaluate(() => {
        const left = document.querySelector('.rw-compact-leading, .rw-compact-bar > div:first-child')?.getBoundingClientRect()
        const right = document.querySelector('.rw-compact-countdown, .rw-countdown-compact')?.getBoundingClientRect()
        return { gap: left && right ? +(right.left - left.right).toFixed(2) : null }
      })) })
      if ([390, 1280].includes(width)) await page.screenshot({ path: new URL(`${phase}-compact-${state}-${width}.png`, output).pathname.replace(/^\/(\w:)/, '$1') })
    }
    if (phase === 'after') for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 1080 })
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => { document.documentElement.classList.toggle('dark', theme === 'dark') }, theme)
        await scrollThrough(page)
        const image = await page.screenshot({ fullPage: true })
        await writeFile(new URL(`${state}-${theme}-${width}.png`, output), image)
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
}
await writeFile(new URL(`${phase}.json`, output), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ phase, renders: report.renders, overflow: report.overflow.map(({ state, viewport, scrollWidth, overflowing }) => ({ state, viewport, scrollWidth, visibleOverflow: overflowing.filter(n => !n.hidden).length })), compact: report.compact }, null, 2))

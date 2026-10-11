import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
try {
  for (const width of [320, 360, 390, 414]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:4173/test/raceweekend/16', { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForSelector('#weekend-heading')
    await page.addStyleTag({ content: `
    html, body { overflow-x: visible !important; }
    [data-rw] .rw-circuit-facts { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0 24px !important; }
    [data-rw] .rw-circuit-stage { min-height: 520px !important; }
    [data-rw] .rw-circuit-svg-wrap { width: auto !important; max-width: none !important; min-height: 260px !important; height: 260px !important; }
    [data-rw] .rw-circuit-svg { height: 260px !important; }
  ` })
    await page.waitForTimeout(100)
    console.log(JSON.stringify({ width, ...(await page.evaluate(() => {
    const isHidden = (node) => {
      let current = node
      while (current && current !== document.documentElement) {
        const style = getComputedStyle(current)
        if (style.display === 'none' || style.visibility === 'hidden') return true
        current = current.parentElement
      }
      return false
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
      elements: Array.from(document.querySelectorAll('[data-rw] *')).map(node => {
        const rect = node.getBoundingClientRect()
        return { tag: node.tagName.toLowerCase(), className: node.className?.toString?.().slice(0, 100), right: Math.round(rect.right * 100) / 100, hidden: isHidden(node) }
      }).filter(item => item.right > innerWidth + 0.5)
    }
    })) }, null, 2))
    await context.close()
  }
} finally {
  await browser.close()
}

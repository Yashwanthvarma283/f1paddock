import { chromium } from 'playwright'

const RACES = [
  { round: '18', name: 'United States Grand Prix (longest, 4 words)' },
  { round: '2', name: 'Saudi Arabian Grand Prix (long, 3 words)' },
  { round: '14', name: 'Dutch Grand Prix (shortest, 2 words)' },
]

const VIEWPORTS = [
  { name: '390', width: 390, height: 844, targetDist: 40 },
  { name: '768', width: 768, height: 1024, targetDist: 48 },
  { name: '1280', width: 1280, height: 720, targetDist: 64, checkFold: true },
  { name: '1920', width: 1920, height: 1080, targetDist: 64, checkFold: true },
]

async function main() {
  const browser = await chromium.launch()
  console.log('='.repeat(100))
  console.log('HERO MEASUREMENT AUDIT')
  console.log('='.repeat(100))

  for (const race of RACES) {
    console.log(`\nRACE: ${race.name} (?round=${race.round})`)
    console.log('-'.repeat(100))
    console.log(
      'VP'.padEnd(6) +
      'Title Lines'.padEnd(14) +
      'Card Height'.padEnd(14) +
      'Content+Pad'.padEnd(14) +
      'Diff (Card-Content)'.padEnd(22) +
      'Button->Stripe'.padEnd(16) +
      'Visible at Fold (scroll 0)'
    )

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      })

      await page.goto(`http://localhost:5173/test/dashboard?round=${race.round}`, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForSelector('#next-race h1', { state: 'visible', timeout: 10000 })
      await page.waitForSelector('#next-race a button', { state: 'visible', timeout: 10000 })

      // Count title lines
      const titleLines = await page.evaluate(() => {
        const h1 = document.querySelector('#next-race h1')
        if (!h1) return 0
        const wordSpans = Array.from(h1.querySelectorAll(':scope > span'))
        const tops = new Set()
        wordSpans.forEach(s => {
          const r = s.getBoundingClientRect()
          if (r.width > 0 && r.height > 0) {
            tops.add(Math.round(r.top))
          }
        })
        return tops.size
      })

      // Card height vs content height
      const cardMetrics = await page.evaluate(() => {
        const card = document.querySelector('#next-race .xl\\:col-span-4')
        if (!card) return { cardH: 0, contentH: 0, diff: 0 }
        const r = card.getBoundingClientRect()
        const cs = window.getComputedStyle(card)
        const pt = parseFloat(cs.paddingTop)
        const pb = parseFloat(cs.paddingBottom)
        
        const children = Array.from(card.children)
        if (children.length === 0) return { cardH: r.height, contentH: 0, diff: 0 }
        const first = children[0].getBoundingClientRect()
        const last = children[children.length - 1].getBoundingClientRect()
        const innerH = last.bottom - first.top
        const expectedCardH = innerH + pt + pb
        return {
          cardH: Math.round(r.height),
          expectedCardH: Math.round(expectedCardH),
          diff: Math.round(Math.abs(r.height - expectedCardH)),
        }
      })

      // Distance from button bottom to stripe top
      const spacingMetrics = await page.evaluate(() => {
        const btn = document.querySelector('#next-race a button')
        const hero = document.querySelector('#next-race')
        const stripeWrapper = hero?.nextElementSibling
        if (!btn || !stripeWrapper) return { dist: 0, btnBottom: 0, stripeTop: 0 }
        const btnRect = btn.getBoundingClientRect()
        const stripeRect = stripeWrapper.getBoundingClientRect()
        return {
          dist: Math.round(stripeRect.top - btnRect.bottom),
          btnBottom: Math.round(btnRect.bottom),
          stripeTop: Math.round(stripeRect.top),
        }
      })

      // Visible at fold
      const isVisibleAtFold = spacingMetrics.btnBottom <= vp.height

      const diffStatus = cardMetrics.diff < 8 ? 'PASS (<8px)' : `FAIL (${cardMetrics.diff}px)`
      const distStatus = spacingMetrics.dist >= vp.targetDist ? `${spacingMetrics.dist}px (>=${vp.targetDist}px PASS)` : `${spacingMetrics.dist}px (FAIL)`
      const foldStatus = vp.checkFold
        ? (isVisibleAtFold ? `YES (btn at ${spacingMetrics.btnBottom}px <= ${vp.height}px PASS)` : `NO (btn at ${spacingMetrics.btnBottom}px > ${vp.height}px FAIL)`)
        : `N/A (mobile/tablet)`

      console.log(
        `${vp.name}px`.padEnd(6) +
        `${titleLines} lines`.padEnd(14) +
        `${cardMetrics.cardH}px`.padEnd(14) +
        `${cardMetrics.expectedCardH}px`.padEnd(14) +
        `${cardMetrics.diff}px ${diffStatus}`.padEnd(22) +
        distStatus.padEnd(16) +
        foldStatus
      )

      await page.close()
    }
  }

  await browser.close()
}

main().catch(console.error)

import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:5173/test/dashboard', { waitUntil: 'domcontentloaded' })

  const results = await page.evaluate(async () => {
    // Dynamic import circuits from module
    const { getCircuitInfo, CIRCUITS, ALIAS_TO_CIRCUIT_ID } = await import('/src/lib/circuits.ts')
    
    // Test the 24 championship circuits
    const rounds = [
      { round: 1, circuitId: 'albert_park', name: 'Albert Park Grand Prix Circuit' },
      { round: 2, circuitId: 'shanghai', name: 'Shanghai International Circuit' },
      { round: 3, circuitId: 'suzuka', name: 'Suzuka Circuit' },
      { round: 4, circuitId: 'miami', name: 'Miami International Autodrome' },
      { round: 5, circuitId: 'villeneuve', name: 'Circuit Gilles Villeneuve' },
      { round: 6, circuitId: 'monaco', name: 'Circuit de Monaco' },
      { round: 7, circuitId: 'catalunya', name: 'Circuit de Barcelona-Catalunya' },
      { round: 8, circuitId: 'red_bull_ring', name: 'Red Bull Ring' },
      { round: 9, circuitId: 'silverstone', name: 'Silverstone Circuit' },
      { round: 10, circuitId: 'spa', name: 'Circuit de Spa-Francorchamps' },
      { round: 11, circuitId: 'hungaroring', name: 'Hungaroring' },
      { round: 12, circuitId: 'zandvoort', name: 'Circuit Park Zandvoort' },
      { round: 13, circuitId: 'monza', name: 'Autodromo Nazionale di Monza' },
      { round: 14, circuitId: 'madring', name: 'Madring' },
      { round: 15, circuitId: 'baku', name: 'Baku City Circuit' },
      { round: 16, circuitId: 'sepang', name: 'Sepang International Circuit' },
      { round: 17, circuitId: 'marina_bay', name: 'Marina Bay Street Circuit' },
      { round: 18, circuitId: 'americas', name: 'Circuit of the Americas' },
      { round: 19, circuitId: 'rodriguez', name: 'Autódromo Hermanos Rodríguez' },
      { round: 20, circuitId: 'interlagos', name: 'Autódromo José Carlos Pace' },
      { round: 21, circuitId: 'vegas', name: 'Las Vegas Strip Street Circuit' },
      { round: 22, circuitId: 'losail', name: 'Lusail International Circuit' },
      { round: 23, circuitId: 'yas_marina', name: 'Yas Marina Circuit' },
      // Also test standard aliases
      { round: 99, circuitId: 'bahrain', name: 'Bahrain International Circuit' },
      { round: 99, circuitId: 'sakhir', name: 'Bahrain International Circuit' },
      { round: 99, circuitId: 'jeddah', name: 'Jeddah Corniche Circuit' },
      { round: 99, circuitId: 'imola', name: 'Autodromo Enzo e Dino Ferrari' },
      { round: 99, circuitId: 'austin', name: 'Circuit of the Americas' },
      { round: 99, circuitId: 'mexico_city', name: 'Autódromo Hermanos Rodríguez' },
      { round: 99, circuitId: 'las_vegas', name: 'Las Vegas Strip Street Circuit' },
      { round: 99, circuitId: 'lusail', name: 'Lusail International Circuit' },
      { round: 99, circuitId: 'melbourne', name: 'Albert Park Grand Prix Circuit' },
      { round: 99, circuitId: 'montreal', name: 'Circuit Gilles Villeneuve' },
      { round: 99, circuitId: 'barcelona', name: 'Circuit de Barcelona-Catalunya' },
      { round: 99, circuitId: 'spielberg', name: 'Red Bull Ring' },
      { round: 99, circuitId: 'budapest', name: 'Hungaroring' },
    ]

    return rounds.map(r => {
      const info = getCircuitInfo(r.circuitId, r.name)
      const turns = info.turnsData || []
      const s1Turns = turns.filter(t => t.sector === 1).length
      const s2Turns = turns.filter(t => t.sector === 2).length
      const s3Turns = turns.filter(t => t.sector === 3).length
      return {
        circuitId: r.circuitId,
        resolvedId: info.id,
        isFallback: info.id === 'default_circuit',
        name: info.name,
        turns: info.turns,
        turnsDataCount: turns.length,
        s1Turns,
        s2Turns,
        s3Turns,
        hasAllSectors: s1Turns > 0 && s2Turns > 0 && s3Turns > 0,
      }
    })
  })

  console.log('AUDIT RESULTS:')
  let fallbacks = 0
  let sectorMissing = 0
  for (const r of results) {
    const flag = r.isFallback ? '❌ FALLBACK' : (!r.hasAllSectors ? '⚠️ MISSING SECTOR' : '✅ OK')
    if (r.isFallback) fallbacks++
    if (!r.hasAllSectors) sectorMissing++
    console.log(`${flag.padEnd(18)} [${r.circuitId}] -> id="${r.resolvedId}" "${r.name}" turns=${r.turns} (S1:${r.s1Turns}, S2:${r.s2Turns}, S3:${r.s3Turns})`)
  }
  console.log(`\nSummary: ${results.length} tested. ${fallbacks} fallbacks. ${sectorMissing} sector issues.`)
  await browser.close()
}

main().catch(console.error)

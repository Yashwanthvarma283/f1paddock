import fs from 'fs'

const testList = [
  { id: 'albert_park', name: 'Albert Park Grand Prix Circuit' },
  { id: 'melbourne', name: 'Melbourne Grand Prix Circuit' },
  { id: 'shanghai', name: 'Shanghai International Circuit' },
  { id: 'suzuka', name: 'Suzuka Circuit' },
  { id: 'miami', name: 'Miami International Autodrome' },
  { id: 'villeneuve', name: 'Circuit Gilles Villeneuve' },
  { id: 'montreal', name: 'Circuit Gilles Villeneuve' },
  { id: 'monaco', name: 'Circuit de Monaco' },
  { id: 'monte_carlo', name: 'Circuit de Monaco' },
  { id: 'catalunya', name: 'Circuit de Barcelona-Catalunya' },
  { id: 'barcelona', name: 'Circuit de Barcelona-Catalunya' },
  { id: 'red_bull_ring', name: 'Red Bull Ring' },
  { id: 'spielberg', name: 'Red Bull Ring' },
  { id: 'silverstone', name: 'Silverstone Circuit' },
  { id: 'spa', name: 'Circuit de Spa-Francorchamps' },
  { id: 'spa_francorchamps', name: 'Circuit de Spa-Francorchamps' },
  { id: 'hungaroring', name: 'Hungaroring' },
  { id: 'budapest', name: 'Hungaroring' },
  { id: 'zandvoort', name: 'Circuit Park Zandvoort' },
  { id: 'monza', name: 'Autodromo Nazionale di Monza' },
  { id: 'madring', name: 'Madring' },
  { id: 'madrid', name: 'Madrid Street Circuit' },
  { id: 'baku', name: 'Baku City Circuit' },
  { id: 'sepang', name: 'Sepang International Circuit' },
  { id: 'marina_bay', name: 'Marina Bay Street Circuit' },
  { id: 'americas', name: 'Circuit of the Americas' },
  { id: 'austin', name: 'Circuit of the Americas' },
  { id: 'rodriguez', name: 'Autódromo Hermanos Rodríguez' },
  { id: 'mexico_city', name: 'Autódromo Hermanos Rodríguez' },
  { id: 'interlagos', name: 'Autódromo José Carlos Pace' },
  { id: 'vegas', name: 'Las Vegas Strip Street Circuit' },
  { id: 'las_vegas', name: 'Las Vegas Strip Street Circuit' },
  { id: 'losail', name: 'Lusail International Circuit' },
  { id: 'lusail', name: 'Lusail International Circuit' },
  { id: 'yas_marina', name: 'Yas Marina Circuit' },
  { id: 'sakhir', name: 'Bahrain International Circuit' },
  { id: 'bahrain', name: 'Bahrain International Circuit' },
  { id: 'jeddah', name: 'Jeddah Corniche Circuit' },
  { id: 'imola', name: 'Autodromo Enzo e Dino Ferrari' },
]

let code = fs.readFileSync('src/lib/circuits.ts', 'utf8')
code = code.replace(/import\s+circuitsGeometryRaw\s+from\s+['"][^'"]+['"]/, 'const circuitsGeometryRaw = {};')
code = code.replace(/export\s+/g, '')

const fn = new Function(code + '\nreturn { CIRCUITS, getCircuitInfo, ALIAS_TO_CIRCUIT_ID };')
const { CIRCUITS, getCircuitInfo, ALIAS_TO_CIRCUIT_ID } = fn()

console.log('AUDITING GETCIRCUITINFO FOR ALL CHAMPIONSHIP CIRCUITS:\n')
let failCount = 0
for (const item of testList) {
  const info = getCircuitInfo(item.id, item.name)
  const isFallback = info.id === 'default_circuit'
  const turnsCount = info.turnsData?.length || 0
  const hasSectors = info.turnsData?.every(t => t.sector === 1 || t.sector === 2 || t.sector === 3)
  const status = isFallback ? 'FALLBACK ERROR!' : 'OK'
  if (isFallback) failCount++
  console.log(`[${status}] id="${item.id}" -> resolved="${info.id}" turns=${info.turns} turnsDataCount=${turnsCount} hasSectors=${hasSectors}`)
}
console.log(`\nTotal tested: ${testList.length}, Failures: ${failCount}`)

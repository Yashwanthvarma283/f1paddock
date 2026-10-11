import fs from 'fs'

const circuitsTs = fs.readFileSync('src/lib/circuits.ts', 'utf8')
const circuitMatches = Array.from(circuitsTs.matchAll(/([a-zA-Z0-9_]+):\s*\{\s*id:\s*['"]([^'"]+)['"]/g)).map(m => m[1])
console.log('CIRCUITS in circuits.ts (' + circuitMatches.length + '):', circuitMatches)

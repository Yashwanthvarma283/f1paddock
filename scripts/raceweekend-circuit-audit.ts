import { jolpicaClient } from '../src/api/jolpicaClient'
import { getCircuitInfo } from '../src/lib/circuits'
import { countPathPoints, isSimplifiedOutline } from '../src/features/raceweekend-v2/utils'

const schedule = await jolpicaClient.getSchedule('2026')
const rows = schedule.races.map((race) => {
  const circuit = getCircuitInfo(race.Circuit.circuitId, race.Circuit.circuitName)
  const pathPoints = countPathPoints(circuit.path)
  const markerCoverage = circuit.turns > 0 ? circuit.turnsData.length / circuit.turns : 0
  const simplified = isSimplifiedOutline(circuit)
  return {
    round: race.round,
    circuitId: race.Circuit.circuitId,
    race: race.raceName,
    pathPoints,
    listedTurns: circuit.turns,
    turnMarkers: circuit.turnsData.length,
    markerCoverage: `${Math.round(markerCoverage * 100)}%`,
    flag: simplified ? 'FLAG' : '—',
  }
})

console.table(rows)
console.log(`Flagged ${rows.filter((row) => row.flag === 'FLAG').length}/${rows.length} circuits (marker coverage < 70% or path points < 20).`)

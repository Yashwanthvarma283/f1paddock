import { memo, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Figure, Label, EmptyNote } from '@/features/dashboard-v2/primitives'
import type { CircuitInfo, TurnMarker } from '@/lib/circuits'
import { WeekendSection } from './WeekendSection'
import { FactFigure } from './FactFigure'
import { isSimplifiedOutline } from './utils'
import { useRenderCount } from './RenderTelemetry'

const sectors = [1, 2, 3] as const
const colors = { 1: 'var(--timing-purple)', 2: 'var(--timing-green)', 3: 'var(--timing-yellow)' }

export const CircuitExplorer = memo(function CircuitExplorer({ circuit }: { circuit: CircuitInfo | null }) {
  useRenderCount('circuit')
  const stage = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [sector, setSector] = useState<1 | 2 | 3>(1)
  const [selected, setSelected] = useState<TurnMarker | null>(null)
  const { scrollYProgress } = useScroll({ target: stage, offset: ['start 0.65', 'end 0.8'] })
  const drawing = useTransform(scrollYProgress, [0, 1], [1, 0])
  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (!reduced) setSector(value < 1 / 3 ? 1 : value < 2 / 3 ? 2 : 3)
  })
  if (!circuit) return <WeekendSection id="circuit" title="Know the circuit"><EmptyNote>Circuit geometry is not available for this round.</EmptyNote></WeekendSection>
  const [x, y, width, height] = circuit.viewBox.split(' ').map(Number)
  const active = selected?.sector ?? sector
  const simplified = isSimplifiedOutline(circuit)

  return <WeekendSection id="circuit" title="Know the circuit" action={<span className="rw-muted">{circuit.name}</span>}>
    <div ref={stage} className={`rw-circuit-grid${reduced ? ' is-static' : ''}`}>
      <div className="rw-circuit-stage">
        <div className="rw-map-heading"><Label>Circuit outline</Label><Figure>{reduced ? 'S1 / S2 / S3' : `Sector ${active} / 3`}</Figure></div>
        <div className="rw-circuit-svg-wrap" style={{ aspectRatio: `${width} / ${height}` }}>
          <svg viewBox={circuit.viewBox} className="rw-circuit-svg" role="img" aria-labelledby="rw-map-title">
            <title id="rw-map-title">{circuit.name}. Turn markers are coloured by sector.</title>
            <path d={circuit.path} fill="none" stroke="var(--border)" strokeWidth="3" strokeLinejoin="round" />
            <motion.path d={circuit.path} fill="none" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: reduced ? 0 : drawing }} />
            <rect x={circuit.startFinishPoint.x - 4} y={circuit.startFinishPoint.y - 4} width="8" height="8" fill="var(--text)" />
            {circuit.turnsData.map(turn => <g key={turn.number} style={{ opacity: reduced || turn.sector === active ? 1 : 0.3 }} className="rw-map-marker">
              <circle cx={turn.x} cy={turn.y} r="4" fill={colors[turn.sector]} stroke="var(--text)" strokeWidth="0.7" />
              {turn.pillX !== undefined && turn.pillY !== undefined ? <line x1={turn.x} y1={turn.y} x2={turn.pillX} y2={turn.pillY} stroke="var(--text-muted)" strokeWidth="0.5" /> : null}
            </g>)}
          </svg>
          {circuit.turnsData.map(turn => <button key={turn.number} type="button"
            className={`rw-turn-marker${turn.number === selected?.number ? ' is-active' : ''}`}
            style={{ left: `${((turn.pillX ?? turn.x) - x) / width * 100}%`, top: `${((turn.pillY ?? turn.y) - y) / height * 100}%`, borderColor: colors[turn.sector] }}
            aria-pressed={selected?.number === turn.number} aria-label={`${turn.name || `Turn ${turn.number}`}, sector ${turn.sector}`}
            onClick={() => setSelected(selected?.number === turn.number ? null : turn)} onFocus={() => setSelected(turn)}>
            {turn.number}
          </button>)}
        </div>
        <div className="rw-circuit-detail" aria-live="polite">
          <div><Label>{selected ? `Sector ${selected.sector}` : 'Explore the turns'}</Label><p>{selected?.name || (selected ? `Turn ${selected.number}` : 'Select a numbered marker.')}</p></div>
          {selected ? <button type="button" className="rw-text-button" onClick={() => setSelected(null)}>Clear</button> : <span className="rw-muted">Start / finish ■</span>}
        </div>
      </div>
      <div className="rw-circuit-facts">
        <div className="rw-facts-grid">
          <div><Label>Length</Label><FactFigure value={circuit.lengthKm} /></div>
          <div><Label>Turns</Label><FactFigure value={String(circuit.turns)} /></div>
          <div className="rw-record"><Label>Lap record</Label><Figure>{circuit.lapRecord || '—'}</Figure></div>
        </div>
        <p className="rw-intro">Follow the outline. Select a sector to find its marked turns.</p>
        {simplified ? <p className="rw-simplified-note">Simplified outline</p> : null}
        <div className="rw-sector-chapters" aria-label="Circuit sectors">
          {sectors.map(number => {
            const turns = circuit.turnsData.filter(turn => turn.sector === number)
            return <button key={number} type="button" className={`rw-sector-chapter${active === number ? ' is-active' : ''}`}
              aria-pressed={active === number} onClick={() => { setSelected(null); setSector(number) }}>
              <Figure className="rw-sector-number">0{number}</Figure>
              <span><strong>Sector {number}</strong><span className="rw-sector-turns">Marked turns {turns.map(turn => turn.number).join(', ') || '—'}</span></span>
              <span className="rw-sector-swatch" style={{ backgroundColor: colors[number] }} aria-hidden="true" />
            </button>
          })}
        </div>
        <p className="rw-source-note">Turn positions and sector assignments from the circuit file. Timing-line boundaries are not supplied.</p>
      </div>
    </div>
  </WeekendSection>
})

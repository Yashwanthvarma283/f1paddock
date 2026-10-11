import { useRef } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { Figure } from '@/features/dashboard-v2/primitives'

/** A single digit-reel reveal. The announced value is always the supplied value. */
export function FactFigure({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduced = useReducedMotion()
  return <span ref={ref} className="rw-reel-value">
    <span className="sr-only">{value}</span>
    <Figure className="rw-reels"><span aria-hidden="true">
      {Array.from(value).map((character, index) => /\d/.test(character) ?
        <span className="rw-digit-window" key={index}>
          <span className="rw-digit-strip" style={{ transform: `translateY(-${reduced || inView ? Number(character) : 0}em)` }}>
            {Array.from({ length: 10 }, (_, digit) => <span key={digit}>{digit}</span>)}
          </span>
        </span> : <span key={index}>{character}</span>)}
    </span></Figure>
  </span>
}

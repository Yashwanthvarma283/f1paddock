import React, { useEffect, useState } from 'react'
import { SessionService } from '@/api/sessionService'
import type { CountdownState } from '@/api/sessionService'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Digit component that animates vertically when the value changes.
 */
const Digit: React.FC<{ char: string }> = ({ char }) => {
  return (
    <div className="inline-block relative w-[0.55em] h-[1em] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0, position: 'absolute', top: 0, left: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

const RollingNumber: React.FC<{ value: number }> = ({ value }) => {
  const str = pad(value)
  return (
    <span className="inline-flex">
      {str.split('').map((char, i) => (
        <Digit key={i} char={char} />
      ))}
    </span>
  )
}

/**
 * One countdown unit.
 */
const Unit: React.FC<{ value: number; unit: string; large?: boolean }> = ({
  value,
  unit,
  large = false,
}) => (
  <span className="inline-flex items-baseline">
    <span
      className={cn(
        'dv2-fig font-semibold text-[var(--text)] inline-flex',
        large ? 'text-[32px] md:text-[40px] leading-none' : 'text-[24px] md:text-[30px] leading-none'
      )}
    >
      <RollingNumber value={value} />
    </span>
    <span
      className="ml-0.5 mr-2 text-[12px] md:text-[13px] font-medium uppercase text-[var(--text-muted)]"
      aria-hidden="true"
    >
      {unit}
    </span>
  </span>
)

/**
 * Counts down to a target ISO timestamp, ticking once a second.
 */
export const Countdown: React.FC<{
  targetIso: string | null
  label: string
  isLive?: boolean
  onExpire?: () => void
}> = ({ targetIso, label, isLive = false, onExpire }) => {
  const [state, setState] = useState<CountdownState | null>(() =>
    targetIso ? SessionService.calculateCountdown(targetIso) : null
  )
  const [prevTargetIso, setPrevTargetIso] = useState(targetIso)
  if (prevTargetIso !== targetIso) {
    setPrevTargetIso(targetIso)
    setState(targetIso ? SessionService.calculateCountdown(targetIso) : null)
  }

  const onExpireRef = React.useRef(onExpire)
  const hasExpiredRef = React.useRef(false)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    hasExpiredRef.current = false
    if (!targetIso) return

    const initial = SessionService.calculateCountdown(targetIso)
    if (initial.isExpired) {
      hasExpiredRef.current = true
      onExpireRef.current?.()
    }

    const id = window.setInterval(() => {
      const next = SessionService.calculateCountdown(targetIso)
      setState(next)
      if (next.isExpired && !hasExpiredRef.current) {
        hasExpiredRef.current = true
        onExpireRef.current?.()
      }
    }, 1000)

    return () => window.clearInterval(id)
  }, [targetIso])

  const spokenLabel = isLive
    ? `${label} is currently live`
    : state && !state.isExpired
    ? `${label} in ${state.days} days, ${state.hours} hours, ${state.minutes} minutes`
    : label

  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-2">
        {label}
      </div>

      <div aria-label={spokenLabel} className="h-[40px] md:h-[44px] flex items-center">
        {isLive ? (
          <div className="flex items-center gap-2 text-[var(--accent)] font-extrabold text-[24px] md:text-[28px] tracking-tight animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>LIVE</span>
          </div>
        ) : !state || state.isExpired ? (
          <span className="dv2-fig text-[32px] md:text-[40px] font-semibold leading-none text-[var(--text)]">
            —
          </span>
        ) : (
          <span className="flex flex-wrap items-baseline" aria-hidden="true">
            {state.days > 0 ? <Unit value={state.days} unit="d" large /> : null}
            <Unit value={state.hours} unit="h" large={state.days === 0} />
            <Unit value={state.minutes} unit="m" large={state.days === 0} />
            <Unit value={state.seconds} unit="s" large={state.days === 0} />
          </span>
        )}
      </div>
    </div>
  )
}

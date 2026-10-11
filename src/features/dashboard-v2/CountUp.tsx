import React, { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

interface CountUpProps {
  value: number | string
  duration?: number // default 500ms (within 400-600ms requirement)
  className?: string
  prefix?: string
  suffix?: string
}

/**
 * Animated count-up numeral for points, gaps, and counts.
 * - Counts up once upon entering viewport
 * - 400-600ms ease-out cubic deceleration
 * - Tabular numerals, zero layout shift
 * - Completely static under prefers-reduced-motion
 */
export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 500,
  className,
  prefix = '',
  suffix = '',
}) => {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value))
  const isNumeric = !isNaN(numValue)
  const shouldReduceMotion = useReducedMotion()

  const [displayValue, setDisplayValue] = useState<number>(() =>
    shouldReduceMotion || !isNumeric ? numValue : 0
  )
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  useEffect(() => {
    if (shouldReduceMotion || !isNumeric) {
      setDisplayValue(numValue)
      return
    }

    if (inView && !hasAnimated) {
      setHasAnimated(true)
      const startTime = performance.now()
      const startVal = 0
      const endVal = numValue

      let animId: number
      const tick = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(1, elapsed / duration)
        // Ease-out cubic curve
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = startVal + (endVal - startVal) * eased

        const isFloat = String(value).includes('.')
        setDisplayValue(isFloat ? Math.round(current * 10) / 10 : Math.round(current))

        if (progress < 1) {
          animId = requestAnimationFrame(tick)
        } else {
          setDisplayValue(endVal)
        }
      }

      animId = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(animId)
    }
  }, [inView, hasAnimated, numValue, duration, shouldReduceMotion, isNumeric, value])

  if (!isNumeric) {
    return <span className={cn('dv2-fig tabular-nums inline-block', className)}>{value}</span>
  }

  return (
    <span ref={ref} className={cn('dv2-fig tabular-nums inline-block', className)}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  )
}

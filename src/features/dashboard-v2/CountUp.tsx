import React, { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

interface CountUpProps {
  value: number | string
  duration?: number // default 500ms
  className?: string
  prefix?: string
  suffix?: string
}

/**
 * Animated numeral for points, gaps, and counts.
 * - Tabular numerals, zero layout shift
 * - Always initializes with exact target value so data is never incomplete or stuck at 0
 * - Responds accurately to tab changes and query data updates
 * - Smoothly animates when in view and static under prefers-reduced-motion
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

  const [displayValue, setDisplayValue] = useState<number>(() => (isNumeric ? numValue : 0))
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const prevValueRef = useRef<number>(numValue)

  useEffect(() => {
    if (!isNumeric || shouldReduceMotion) {
      setDisplayValue(numValue)
      prevValueRef.current = numValue
      return
    }

    const startVal = prevValueRef.current !== numValue ? prevValueRef.current : 0
    const endVal = numValue
    prevValueRef.current = numValue

    if (startVal === endVal) {
      setDisplayValue(endVal)
      return
    }

    if (!inView) {
      setDisplayValue(endVal)
      return
    }

    const startTime = performance.now()
    let animId: number
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
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
  }, [inView, numValue, duration, shouldReduceMotion, isNumeric, value])

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

import React from 'react'
import { motion, useScroll, useReducedMotion } from 'motion/react'

/**
 * 2px red line at the very top of the viewport scaled with page scroll (scaleX).
 * Completely hidden when prefers-reduced-motion is active.
 */
export const ScrollProgress: React.FC = () => {
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()

  if (shouldReduceMotion) {
    return null
  }

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] bg-[var(--accent)] z-50 origin-left pointer-events-none"
      style={{ scaleX: scrollYProgress }}
    />
  )
}

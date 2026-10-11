import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ArrowUp } from 'lucide-react'

/**
 * Quiet Back-to-Top control that appears after the hero section.
 * - Positioned bottom right
 * - Keyboard accessible with clear focus ring
 * - Smooth fade without spring/bounce motion
 * - Instant toggle under prefers-reduced-motion
 */
export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById('next-race')
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 500
      setVisible(heroBottom < 0)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? 'instant' : 'smooth',
    })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll back to top of page"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="dv2-press fixed bottom-6 right-6 z-40 h-9 px-3 rounded-[4px] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] shadow-sm inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Top</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

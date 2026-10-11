import { useEffect, useRef, useState, useCallback } from 'react'

export interface ScrollSpySection {
  id: string
  label: string
}

export interface UseScrollSpyOptions {
  offset?: number
  defaultSection?: string
}

/**
 * Shared scroll-spy hook utilizing a single IntersectionObserver.
 * Evaluates active section based on the last target whose top is above the sticky offset.
 * Updates URL hash with history.replaceState and handles deep links on mount.
 */
export function useScrollSpy(
  sections: ScrollSpySection[],
  options: UseScrollSpyOptions = {}
) {
  const { offset = 120, defaultSection = sections[0]?.id || '' } = options
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (hash && sections.some((s) => s.id === hash)) {
        return hash
      }
    }
    return defaultSection
  })

  const readyRef = useRef(false)
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  const scrollToSection = useCallback(
    (id: string) => {
      const target = document.getElementById(id)
      if (!target) return

      const isReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      history.pushState(history.state, '', `${window.location.pathname}${window.location.search}#${id}`)
      setActiveId(id)

      target.scrollIntoView({
        behavior: isReduced ? 'instant' : 'smooth',
        block: 'start',
      })
    },
    []
  )

  useEffect(() => {
    let targets: HTMLElement[] = []
    const initialHash = window.location.hash.slice(1)

    const evaluate = () => {
      if (!readyRef.current) return
      // Find all target sections whose top is at or above the sticky offset
      const passed = targets.filter((node) => node.getBoundingClientRect().top <= offset + 2)
      const selected = passed.at(-1)?.id || sectionsRef.current[0]?.id || ''

      if (selected) {
        setActiveId((prev) => (prev === selected ? prev : selected))
        if (window.location.hash !== `#${selected}`) {
          history.replaceState(
            history.state,
            '',
            `${window.location.pathname}${window.location.search}#${selected}`
          )
        }
      }
    }

    const observer = new IntersectionObserver(evaluate, {
      rootMargin: `-${offset - 1}px 0px 0px`,
      threshold: [0, 1],
    })

    const observed = new Set<Element>()

    const register = () => {
      targets = sectionsRef.current
        .map((s) => document.getElementById(s.id))
        .filter((el): el is HTMLElement => Boolean(el))

      targets.forEach((node) => {
        if (!observed.has(node)) {
          observer.observe(node)
          observed.add(node)
        }
      })

      if (initialHash && document.getElementById(initialHash)) {
        requestAnimationFrame(() => {
          document.getElementById(initialHash)?.scrollIntoView({
            block: 'start',
            behavior: 'auto',
          })
          evaluate()
        })
      }
    }

    register()

    const mutations = new MutationObserver(register)
    const main = document.querySelector('main')
    if (main) mutations.observe(main, { childList: true, subtree: true })

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash && document.getElementById(hash)) {
        document.getElementById(hash)?.scrollIntoView({
          block: 'start',
          behavior: 'auto',
        })
        evaluate()
      }
    }

    const frame = requestAnimationFrame(() => {
      if (initialHash && document.getElementById(initialHash)) {
        document.getElementById(initialHash)?.scrollIntoView({
          block: 'start',
          behavior: 'auto',
        })
      }
      readyRef.current = true
      evaluate()
    })

    window.addEventListener('resize', evaluate, { passive: true })
    window.addEventListener('scroll', evaluate, { passive: true })
    window.addEventListener('scrollend', evaluate, { passive: true })
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)

    return () => {
      readyRef.current = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      mutations.disconnect()
      window.removeEventListener('resize', evaluate)
      window.removeEventListener('scroll', evaluate)
      window.removeEventListener('scrollend', evaluate)
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleHashChange)
    }
  }, [offset])

  return { activeId, scrollToSection }
}

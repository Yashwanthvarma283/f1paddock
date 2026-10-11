import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { RACEWEEKEND_SECTIONS } from './utils'
import { CompactWeekendBar } from './WeekendHero'
import type { RaceWeekendModel } from './types'

const OFFSET = 160

export function WeekendNav({ model, showResults }: { model: RaceWeekendModel; showResults: boolean }) {
  const [active, setActive] = useState('weekend')
  const [collapsed, setCollapsed] = useState(false)
  const reduced = useReducedMotion()
  const ready = useRef(false)
  const sections = RACEWEEKEND_SECTIONS.filter(s => s.id !== 'results' || showResults)

  useEffect(() => {
    let targets: HTMLElement[] = []
    const initialHash = window.location.hash.slice(1)
    const evaluate = () => {
      if (!ready.current) return
      const passed = targets.filter(node => node.getBoundingClientRect().top <= OFFSET + 1)
      const selected = passed.at(-1)?.id || 'weekend'
      setActive(previous => previous === selected ? previous : selected)
      const hero = document.getElementById('weekend')
      setCollapsed(Boolean(hero && hero.getBoundingClientRect().bottom <= OFFSET))
      if (location.hash !== `#${selected}`) {
        history.replaceState(history.state, '', `${location.pathname}${location.search}#${selected}`)
      }
    }
    // One observer per mount. The 2px sentinels report top crossings; sections and
    // scrollend cover fast jumps that skip the narrow sentinels between frames.
    const observer = new IntersectionObserver(evaluate, { rootMargin: `-${OFFSET - 1}px 0px 0px`, threshold: [0, 1] })
    const observed = new Set<Element>()
    const register = () => {
      targets = Array.from(document.querySelectorAll<HTMLElement>('[data-rw] main section.rw-anchor'))
      targets.forEach(node => {
        for (const target of [node, node.querySelector('[data-rw-spy]')]) {
          if (target && !observed.has(target)) { observer.observe(target); observed.add(target) }
        }
      })
      if (initialHash && document.getElementById(initialHash)) {
        requestAnimationFrame(() => {
          document.getElementById(initialHash)?.scrollIntoView({ block: 'start', behavior: 'auto' })
          evaluate()
        })
      }
    }
    register()
    const mutations = new MutationObserver(register)
    const main = document.querySelector('[data-rw] main')
    if (main) mutations.observe(main, { childList: true, subtree: true })
    const restoreHash = () => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'auto' })
      evaluate()
    }
    const frame = requestAnimationFrame(() => {
      if (initialHash) document.getElementById(initialHash)?.scrollIntoView({ block: 'start', behavior: 'auto' })
      ready.current = true
      evaluate()
    })
    window.addEventListener('resize', evaluate)
    window.addEventListener('scrollend', evaluate)
    window.addEventListener('hashchange', restoreHash)
    window.addEventListener('popstate', restoreHash)
    return () => {
      ready.current = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      mutations.disconnect()
      window.removeEventListener('resize', evaluate)
      window.removeEventListener('scrollend', evaluate)
      window.removeEventListener('hashchange', restoreHash)
      window.removeEventListener('popstate', restoreHash)
    }
  }, [])

  const index = Math.max(0, sections.findIndex(section => section.id === active))
  return (
    <nav className="rw-local-nav" aria-label="Race weekend sections">
      <div className={`rw-container rw-nav-shell${collapsed ? ' is-collapsed' : ''}`}>
        <div className="rw-compact-slot">
          <div className="rw-compact-content" aria-hidden={!collapsed}><CompactWeekendBar model={model} /></div>
          <span className="rw-nav-intro" aria-hidden={collapsed}>Your weekend, in order.</span>
        </div>
        <div className="rw-nav-links" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}>
          <span className="rw-nav-indicator" aria-hidden="true" style={{ width: `${100 / sections.length}%`, transform: `translateX(${index * 100}%)` }} />
          {sections.map(section => (
            <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined}
              className={`rw-nav-link${active === section.id ? ' is-active' : ''}`}
              onClick={event => {
                event.preventDefault()
                history.pushState(history.state, '', `${location.pathname}${location.search}#${section.id}`)
                document.getElementById(section.id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' })
              }}>
              {section.id === 'championship' ? 'Standings' : section.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}

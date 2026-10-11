import { useEffect } from 'react'

export interface RenderStat {
  count: number
  lastUpdated: number
}

declare global {
  interface Window {
    __pitwallRaceWeekendRenders?: Record<string, RenderStat>
  }
}

const renderCounts = new Map<string, number>()

export function useRenderCount(id: string): void {
  const count = (renderCounts.get(id) ?? 0) + 1
  renderCounts.set(id, count)

  useEffect(() => {
    const stats = window.__pitwallRaceWeekendRenders ?? {}
    stats[id] = { count, lastUpdated: performance.now() }
    window.__pitwallRaceWeekendRenders = stats
  })
}

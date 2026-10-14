export const DRAW_DURATION_MS = 600
export const HOLD_DRAWN_MS = 400
export const ERASE_DURATION_MS = 600
export const HOLD_EMPTY_MS = 400

export function getRingCycleDurationMs(nonCompleteCount: number): number {
  if (nonCompleteCount <= 0) return 0
  return (
    nonCompleteCount * DRAW_DURATION_MS +
    HOLD_DRAWN_MS +
    nonCompleteCount * ERASE_DURATION_MS +
    HOLD_EMPTY_MS
  )
}

// F1 Gantry Start Lights Timing:
// Step interval = 1000ms (1s per light set, reduced from 2s to 1s)
// Hold all on = 3000ms (3s hold with all lights on, reduced from 5s to 3s)
// All off pause = 1000ms (1s blackout before repeat)
export const LIGHT_STEP_DURATION_MS = 1000
export const ALL_LIT_HOLD_MS = 3000
export const ALL_OFF_PAUSE_MS = 1000

export function getGantryCycleDurationMs(nonCompleteCount: number): number {
  if (nonCompleteCount <= 0) return 0
  return (nonCompleteCount - 1) * LIGHT_STEP_DURATION_MS + ALL_LIT_HOLD_MS + ALL_OFF_PAUSE_MS
}

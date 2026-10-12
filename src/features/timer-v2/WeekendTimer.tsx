import React from 'react'
import type { WeekendTimerProps } from './types'
import { VariantA_Board } from './VariantA_Board'
import { VariantB_DayGrid } from './VariantB_DayGrid'
import { VariantC_StartLights } from './VariantC_StartLights'
import { VariantD_PlayheadTimeline } from './VariantD_PlayheadTimeline'
import { VariantE_RollCounter } from './VariantE_RollCounter'
import { VariantF_TickerLine } from './VariantF_TickerLine'

export const WeekendTimer: React.FC<WeekendTimerProps> = (props) => {
  switch (props.variant) {
    case 'A':
      return <VariantA_Board {...props} />
    case 'B':
      return <VariantB_DayGrid {...props} />
    case 'C':
      return <VariantC_StartLights {...props} />
    case 'D':
      return <VariantD_PlayheadTimeline {...props} />
    case 'E':
      return <VariantE_RollCounter {...props} />
    case 'F':
      return <VariantF_TickerLine {...props} />
    default:
      return <VariantA_Board {...props} />
  }
}

export default WeekendTimer

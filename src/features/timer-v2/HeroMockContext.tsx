import React from 'react'
import type { TimerVariant } from './types'
import { WeekendTimer } from './WeekendTimer'
import type { WeekendSession } from '@/api/types'

interface HeroMockContextProps {
  variant: TimerVariant
  sessions: WeekendSession[]
  clockIso: string
  timezoneLabel: string
  timeFormat?: '12h' | '24h'
}

export const HeroMockContext: React.FC<HeroMockContextProps> = ({
  variant,
  sessions,
  clockIso,
  timezoneLabel,
  timeFormat = '24h',
}) => {
  return (
    <div className="relative w-full bg-[var(--bg)] text-[var(--text)] border-b border-[var(--border-subtle)] pt-5 sm:pt-6 md:pt-8 pb-8 sm:pb-10 overflow-hidden">
      {/* Background Static Circuit Outline Placeholder */}
      <div className="absolute inset-y-0 left-0 md:left-[5%] lg:left-[7%] w-full md:w-[65%] lg:w-[58%] z-0 pointer-events-none flex items-center justify-start pl-2 sm:pl-6 md:pl-8 opacity-25">
        <svg viewBox="0 0 1000 650" className="w-[80%] h-[80%] stroke-[var(--text)]" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 220 540 L 140 500 L 120 380 L 160 300 L 220 280 L 260 220 L 320 180 L 380 160 L 440 180 L 480 230 L 520 280 L 580 300 L 640 280 L 720 220 L 800 200 L 880 240 L 920 320 L 890 400 L 820 460 L 740 500 L 620 520 L 500 530 L 380 540 Z" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1560px] mx-auto px-5 md:px-8 lg:px-12">
        {/* Top Section: Title & Right Column Timer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start mb-6">
          {/* Main Info Left Column */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
            {/* Fact Strip */}
            <div className="flex items-center gap-3 mb-3 text-[12px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
              <span>ROUND 19 / 24</span>
              <span className="text-[var(--border-subtle)] opacity-40">•</span>
              <span>4 DAYS</span>
            </div>

            {/* Race Name */}
            <h1 className="font-display font-extrabold text-[44px] sm:text-[60px] lg:text-[76px] leading-[0.95] tracking-[-0.02em] uppercase text-[var(--text)] mb-6">
              UNITED STATES GRAND PRIX
            </h1>
          </div>

          {/* Right Column (For variants A through E) */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col w-full">
            {variant !== 'F' ? (
              <WeekendTimer
                variant={variant}
                sessions={sessions}
                clockIso={clockIso}
                timezoneLabel={timezoneLabel}
                timeFormat={timeFormat}
              />
            ) : (
              <div className="hidden lg:flex items-center justify-center p-8 border border-dashed border-[var(--border-subtle)] rounded-[4px] text-[12px] font-mono text-[var(--text-muted)] text-center">
                Variant F (Ticker Line) displays below the fact grid as a full-width strip
              </div>
            )}
          </div>
        </div>

        {/* Bottom Line: Track Data on Left, View race weekend button on Right */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-8 w-full pt-0 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-7 sm:gap-x-10 lg:gap-x-12 gap-y-3 sm:gap-y-4 flex-1 max-w-4xl">
            <div className="flex flex-col pb-2 sm:pb-2.5 border-b border-[var(--border)] dark:border-white">
              <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">Circuit</span>
              <div className="font-semibold text-[16px] md:text-[17px] leading-tight">Circuit of the Americas</div>
            </div>
            <div className="flex flex-col pb-2 sm:pb-2.5 border-b border-[var(--border)] dark:border-white">
              <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">Location</span>
              <div className="font-semibold text-[16px] md:text-[17px] leading-tight">Austin, United States</div>
            </div>
            <div className="flex flex-col pb-2 sm:pb-2.5 border-b border-[var(--border)] dark:border-white">
              <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">Dates</span>
              <div className="font-semibold text-[16px] md:text-[17px] leading-tight dv2-fig">16-18 Oct</div>
            </div>
            <div className="flex flex-col pb-2 sm:pb-2.5 border-b border-[var(--border)] dark:border-white">
              <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">Total Laps</span>
              <div className="font-semibold text-[16px] md:text-[17px] leading-tight dv2-fig">56</div>
            </div>
            <div className="flex flex-col pb-2 sm:pb-2.5 border-b border-[var(--border)] dark:border-white">
              <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">Last Winner</span>
              <div className="font-semibold text-[16px] md:text-[17px] leading-tight">C. Leclerc 2024</div>
            </div>
            <div className="flex flex-col pb-2 sm:pb-2.5 border-b border-[var(--border)] dark:border-white">
              <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-0.5">Track Length</span>
              <div className="font-semibold text-[16px] md:text-[17px] leading-tight dv2-fig">5.513 km</div>
            </div>
          </div>

          <div className="shrink-0 flex items-center lg:items-end pb-1">
            <button
              type="button"
              className="px-6 py-3 bg-[var(--accent)] text-white text-[14px] font-semibold rounded-[4px] shadow-sm hover:opacity-90 transition-opacity"
            >
              View race weekend
            </button>
          </div>
        </div>

        {/* Variant F Full-Width Frame Placement */}
        {variant === 'F' && (
          <div className="w-full pt-4 border-t border-[var(--border-subtle)]">
            <WeekendTimer
              variant="F"
              sessions={sessions}
              clockIso={clockIso}
              timezoneLabel={timezoneLabel}
              timeFormat={timeFormat}
            />
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import { Header } from '@/features/dashboard-v2/Header'
import { Footer } from '@/features/dashboard-v2/Footer'
import { RacingLine } from '@/features/dashboard-v2/primitives'

export const RaceWeekendSkeleton: React.FC = () => (
  <div data-dv2 data-rw className="rw-page">
    <Header />
    <main className="rw-main" aria-busy="true" aria-label="Loading race weekend">
      <div className="rw-container rw-loading-hero">
        <div className="skeleton-shimmer h-4 w-32 rounded-[4px]" />
        <div className="skeleton-shimmer h-20 w-3/4 rounded-[4px]" />
        <div className="rw-loading-facts">
          <div className="skeleton-shimmer h-12 rounded-[4px]" />
          <div className="skeleton-shimmer h-12 rounded-[4px]" />
          <div className="skeleton-shimmer h-12 rounded-[4px]" />
        </div>
      </div>
      <div className="w-full flex my-5 md:my-7 lg:my-9" aria-hidden="true">
        <RacingLine className="h-[16px] md:h-[24px] opacity-100" />
      </div>
      <div className="rw-container rw-loading-section">
        <div className="skeleton-shimmer h-8 w-48 rounded-[4px]" />
        <div className="skeleton-shimmer h-16 rounded-[4px]" />
        <div className="skeleton-shimmer h-16 rounded-[4px]" />
        <div className="skeleton-shimmer h-16 rounded-[4px]" />
      </div>
    </main>
    <Footer />
  </div>
)

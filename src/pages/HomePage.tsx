import React from 'react'
import { Header } from '@/features/dashboard-v2/Header'
import { ScrollProgress } from '@/features/dashboard-v2/ScrollProgress'
import { BackToTop } from '@/features/dashboard-v2/BackToTop'
import { DashboardHero } from '@/features/dashboard-v2/DashboardHero'
import { LatestResultSection } from '@/features/dashboard-v2/LatestResultSection'
import { CalendarSection } from '@/features/dashboard-v2/CalendarSection'
import { DriversSection } from '@/features/dashboard-v2/DriversSection'
import { Footer } from '@/features/dashboard-v2/Footer'
import { RacingLine } from '@/features/dashboard-v2/primitives'
import '@/features/dashboard-v2/dashboard-v2.css'

export const HomePage: React.FC = () => {
  return (
    <div data-dv2 className="flex flex-col min-h-[100dvh] w-full bg-[var(--bg)] text-[var(--text)] font-sans antialiased">
      <ScrollProgress />
      <Header />
      
      <main className="flex-1 flex flex-col">
        <DashboardHero id="next-race" />
        
        <div className="w-full flex my-5 md:my-7 lg:my-9" aria-hidden="true">
          <RacingLine className="h-[16px] md:h-[24px] opacity-100" />
        </div>

        <div className="max-w-[1560px] mx-auto w-full px-5 md:px-8 lg:px-12 flex flex-col dv2-section-contain">
          <LatestResultSection id="results" />
        </div>
          
        <div className="w-full flex my-5 md:my-7 lg:my-9" aria-hidden="true">
          <RacingLine className="h-[16px] md:h-[24px] opacity-100" />
        </div>

        <div className="max-w-[1560px] mx-auto w-full px-5 md:px-8 lg:px-12 flex flex-col dv2-section-contain">
          <CalendarSection id="calendar" />
        </div>
          
        <div className="w-full flex my-5 md:my-7 lg:my-9" aria-hidden="true">
          <RacingLine className="h-[16px] md:h-[24px] opacity-100" />
        </div>

        <div className="max-w-[1560px] mx-auto w-full px-5 md:px-8 lg:px-12 flex flex-col mb-8 md:mb-10 lg:mb-12 dv2-section-contain">
          <DriversSection id="drivers" />
        </div>
      </main>

      <BackToTop />
      <Footer />
    </div>
  )
}

export default HomePage

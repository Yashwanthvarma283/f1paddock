import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--surface-1)] border-t border-[var(--border-subtle)] mt-auto text-[var(--text)]">
      <div className="max-w-[1560px] mx-auto px-5 md:px-8 lg:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[-0.01em] text-[28px] leading-none flex items-center gap-1.5">
                <span>F1</span>
                <span className="text-[var(--accent)]">Paddock</span>
              </span>
              <a 
                href="https://f1paddock.live" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[12px] font-mono text-[var(--accent)] hover:underline font-semibold tracking-wider uppercase mt-1"
              >
                f1paddock.live
              </a>
            </div>
            <p className="text-[14px] text-[var(--text-muted)] max-w-sm leading-relaxed">
              An unofficial, non-commercial fan project. 
              Not affiliated with Formula 1, Formula One Management, or any related companies.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-2">Explore</h3>
            <a href="#next-race" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">Next Race</a>
            <a href="#results" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">Results</a>
            <a href="#standings" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">Standings</a>
            <a href="#calendar" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">Calendar</a>
            <a href="#drivers" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">Drivers</a>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] uppercase tracking-[0.1em] font-medium text-[var(--text-muted)] mb-2">Data Sources</h3>
            <a href="https://jolpi.ca/" target="_blank" rel="noreferrer" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">Jolpica-F1 (Ergast API)</a>
            <a href="https://openf1.org/" target="_blank" rel="noreferrer" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">OpenF1</a>
            <a href="https://docs.fastf1.dev" target="_blank" rel="noreferrer" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">FastF1</a>
            <a href="https://github.com/IAmTomShaw/f1-race-replay" target="_blank" rel="noreferrer" className="dv2-link text-[14px] font-medium text-[var(--text)] hover:underline underline-offset-4">F1 Race Replay by IAmTomShaw</a>
          </div>
          
        </div>
        
        <div className="mt-16 pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-[13px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} F1 Paddock (f1paddock.live). Data is provided for educational purposes.
          </span>
          <div className="text-[13px] text-[var(--text-muted)]">
            F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.
          </div>
        </div>
      </div>
    </footer>
  )
}

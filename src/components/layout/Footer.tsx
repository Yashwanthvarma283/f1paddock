import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface-1)] pt-6 pb-5 text-xs text-[var(--text-muted)]">
      {/* Checkered Flag Motif Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-5">
        <div className="checkered-divider rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-display font-black text-base uppercase tracking-tight text-[var(--text)]">
              Pit<span className="text-[var(--accent-text)]">Wall</span>
            </div>
            <p className="text-[var(--text-muted)] max-w-md font-sans">
              High-precision Formula 1 fan telemetry command center. Live session countdowns, track telemetry, and championship standings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
            <div>
              Data via{' '}
              <a
                href="https://api.jolpi.ca"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--text)] hover:text-[var(--accent)] underline underline-offset-2 transition-colors font-semibold"
              >
                Jolpica Ergast API
              </a>
            </div>
            <span className="text-[var(--border)]">&bull;</span>
            <div>
              Telemetry via{' '}
              <a
                href="https://openf1.org"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--text)] hover:text-[var(--accent)] underline underline-offset-2 transition-colors font-semibold"
              >
                OpenF1 API
              </a>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
          <p>
            Unofficial fan telemetry project, not affiliated with Formula 1, Formula One Group, or the FIA. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trademarks of Formula One Licensing B.V.
          </p>
          <div className="font-mono text-[var(--text-muted)] shrink-0 font-semibold">
            Zero Tracking &bull; Free & Open Source
          </div>
        </div>
      </div>
    </footer>
  )
}

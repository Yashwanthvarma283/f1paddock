# F1 Paddock — Formula 1 Live Race Hub & Telemetry (`f1paddock.live`)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![WCAG AA](https://img.shields.io/badge/WCAG_AA-Passing-success.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

**F1 Paddock** ([f1paddock.live](https://f1paddock.live)) is a Formula 1 fan telemetry and live race dashboard. Built with modern React, Tailwind CSS v4, and Framer Motion, it delivers session countdowns, circuit geometry telemetry, championship standings, and season archives.

---

## Features

- **Session Countdown**: Ticker with smooth vertical digit rolls, tabular numerals, and animated tick pulses.
- **Accurate Circuit Telemetry**: Normalized SVG track path drawn on mount with sector colors (Sector 1 Purple, Sector 2 Green, Sector 3 Yellow), interactive turn numbers with contrast pills, and animated car lap tracer.
- **Dual Designed Themes**:
  - **"Race Night" (Dark Mode)**: Carbon black (`#0B0B0F`), F1 official dark surfaces (`#15151E`), and F1 Red action accents.
  - **"Race Day" (Light Mode)**: Clean high-contrast surfaces (`#FFFFFF`, `#EAEAF0`), zero hard-coded dark colors.
  - **Circular Reveal Transitions**: Theme toggles expand via the View Transitions API from the toggle button coordinate with crossfade fallback.
- **Championship Standings**: Driver and Constructor standings featuring horizontal animated team-coloured points bars scaled to the championship leader with gap-to-leader values (`LEADER` or `-XX PTS`).
- **Season Rounds Strip**: Interactive round carousel with official Grand Prix names, country flags, and session status indicators.
- **Quick Driver Telemetry Lookup**: Fast keyboard-accessible (`/`) search for all 2026 championship competitors with team colors, numbers, and nationality vector flags.
- **Timezone Conversion**: Automatic local timezone detection with quick conversion to track time and UTC.
- **WCAG AA Compliant**: Zero contrast violations audited across all viewports with axe-core.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Semantic CSS Custom Properties
- **Motion & Animations**: Framer Motion
- **Icons**: Lucide React + Custom SVG Country Flags
- **Data APIs**: Jolpica F1 API & OpenF1 Telemetry
- **State & Data Fetching**: TanStack React Query

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yashwanthvarma283-ui/f1.git
cd f1

# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Production Build

```bash
# Type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Credits

- Jolpica-F1 (Ergast API)
- OpenF1
- FastF1 (https://docs.fastf1.dev)
- F1 Race Replay by IAmTomShaw (https://github.com/IAmTomShaw/f1-race-replay)

*Check the licence of github.com/IAmTomShaw/f1-race-replay before copying any code from it.*

---

## License

MIT License.

*Disclaimer: Unofficial fan telemetry project, not affiliated with Formula 1, Formula One Group, or the FIA. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trademarks of Formula One Licensing B.V.*

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { getCircuitInfo, TurnMarker } from '@/lib/circuits'
import { cn } from '@/lib/utils'

interface CachedTrackData {
  len: number
  snappedTurns: TurnMarker[]
  sfLen: number
  s1End: number
  s2End: number
}

const circuitDataCache = new Map<string, CachedTrackData>()

interface CircuitOutlineProps {
  circuitId?: string
  circuitName?: string
  className?: string
  variant?: 'card' | 'outline-only' | 'hero-3d'
  hideSectorLegend?: boolean
  align?: 'center' | 'left' | 'right'
  rotation?: number
  rotateX?: number
  onActiveTurnChange?: (turn: TurnMarker | null) => void
}

export const CircuitOutline: React.FC<CircuitOutlineProps> = ({
  circuitId,
  circuitName,
  className = 'w-full h-44 sm:h-52 md:h-60',
  variant = 'card',
  hideSectorLegend = false,
  align = 'center',
  rotation = -10,
  rotateX = 55,
  onActiveTurnChange,
}) => {
  const info = getCircuitInfo(circuitId, circuitName)

  const [activeTurn, _setActiveTurn] = useState<TurnMarker | null>(null)
  const activeTurnRef = useRef<TurnMarker | null>(null)
  const setActiveTurn = (turn: TurnMarker | null) => {
    _setActiveTurn(turn)
    activeTurnRef.current = turn
    if (onActiveTurnChange) {
      onActiveTurnChange(turn)
    }
  }
  const [sectorsVisible, setSectorsVisible] = useState(false)
  const [pathLength, setPathLength] = useState(1000)
  const [sectorBounds, setSectorBounds] = useState({ s1: {start: 0, end: 333}, s2: {start: 333, end: 666}, s3: {start: 666, end: 1000} })
  const [snappedTurns, setSnappedTurns] = useState<TurnMarker[]>(info.turnsData)
  const snappedTurnsRef = useRef(info.turnsData)
  
  const [heroStage, setHeroStage] = useState(0)

  const pathRef = useRef<SVGPathElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const syncFrameRef = useRef<number | null>(null)
  const carOuterRef = useRef<SVGCircleElement>(null)
  const carInnerRef = useRef<SVGCircleElement>(null)
  const anchorRefs = useRef<Record<number, SVGCircleElement | null>>({})
  const overlayPillsRef = useRef<Record<number, HTMLDivElement | null>>({})
  const rootContainerRef = useRef<HTMLDivElement>(null)

  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (pathRef.current) {
      const t0 = performance.now();
      const cacheKey = circuitId || info.id || info.name || 'default';
      let data = circuitDataCache.get(cacheKey);

      if (!data) {
        const len = pathRef.current.getTotalLength();
        const STEP = 4;
        const samples: { len: number; x: number; y: number }[] = [];
        for (let l = 0; l <= len; l += STEP) {
          const pt = pathRef.current.getPointAtLength(l);
          samples.push({ len: l, x: pt.x, y: pt.y });
        }
        if (samples.length === 0 || samples[samples.length - 1].len < len) {
          const pt = pathRef.current.getPointAtLength(len);
          samples.push({ len, x: pt.x, y: pt.y });
        }

        const snapPoint = (targetX: number, targetY: number) => {
          let bestDist = Infinity;
          let bestIdx = 0;
          for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            const d = Math.hypot(s.x - targetX, s.y - targetY);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i;
            }
          }
          const roughLen = samples[bestIdx].len;
          let bestPt = { x: samples[bestIdx].x, y: samples[bestIdx].y };
          let bestLen = roughLen;
          const minL = Math.max(0, roughLen - 4);
          const maxL = Math.min(len, roughLen + 4);
          for (let l = minL; l <= maxL; l += 1) {
            const pt = pathRef.current!.getPointAtLength(l);
            const d = Math.hypot(pt.x - targetX, pt.y - targetY);
            if (d < bestDist) {
              bestDist = d;
              bestLen = l;
              bestPt = { x: pt.x, y: pt.y };
            }
          }
          return { x: bestPt.x, y: bestPt.y, len: bestLen };
        };

        const computedTurns = info.turnsData.map(turn => {
          const snapped = snapPoint(turn.x, turn.y);
          return { ...turn, x: snapped.x, y: snapped.y, len: snapped.len };
        });

        const sfSnapped = snapPoint(info.startFinishPoint.x, info.startFinishPoint.y);
        const sfLen = sfSnapped.len;

        const sorted = [...computedTurns].sort((a, b) => (a.len || 0) - (b.len || 0));
        const lastS1 = sorted.slice().reverse().find(t => t.sector === 1);
        const firstS2 = sorted.find(t => t.sector === 2);
        let s1End = (sfLen + len * 0.333) % len;
        if (lastS1 && firstS2) {
          let diff = (firstS2.len || 0) - (lastS1.len || 0);
          if (diff < 0) diff += len; 
          s1End = ((lastS1.len || 0) + diff / 2) % len;
        }

        const lastS2 = sorted.slice().reverse().find(t => t.sector === 2);
        const firstS3 = sorted.find(t => t.sector === 3);
        let s2End = (sfLen + len * 0.666) % len;
        if (lastS2 && firstS3) {
          let diff = (firstS3.len || 0) - (lastS2.len || 0);
          if (diff < 0) diff += len;
          s2End = ((lastS2.len || 0) + diff / 2) % len;
        }

        data = { len, snappedTurns: computedTurns, sfLen, s1End, s2End };
        circuitDataCache.set(cacheKey, data);
      }

      setPathLength(data.len);
      setSnappedTurns(data.snappedTurns);
      snappedTurnsRef.current = data.snappedTurns;
      setSectorBounds({
        s1: { start: data.sfLen, end: data.s1End },
        s2: { start: data.s1End, end: data.s2End },
        s3: { start: data.s2End, end: data.sfLen }
      });

      if (typeof window !== 'undefined') {
        (window as any).__heroMountTime = performance.now() - t0;
      }

      const len = data.len;
      const sfLen = data.sfLen;
      const s1End = data.s1End;
      const s2End = data.s2End;

      if (shouldReduceMotion) {
        setSectorsVisible(true);
        if (carOuterRef.current && carInnerRef.current) {
          const pt = pathRef.current.getPointAtLength(sfLen);
          carOuterRef.current.setAttribute('cx', String(pt.x));
          carOuterRef.current.setAttribute('cy', String(pt.y));
          carInnerRef.current.setAttribute('cx', String(pt.x));
          carInnerRef.current.setAttribute('cy', String(pt.y));
        }

        if (variant === 'hero-3d') {
          const syncCorners = () => {
            const firstPill = Object.values(overlayPillsRef.current).find(Boolean);
            if (firstPill && firstPill.parentElement) {
              const parentRect = firstPill.parentElement.getBoundingClientRect();
              Object.keys(anchorRefs.current).forEach(key => {
                const num = Number(key);
                const anchor = anchorRefs.current[num];
                const pill = overlayPillsRef.current[num];
                if (anchor && pill) {
                  const rect = anchor.getBoundingClientRect();
                  pill.style.left = `${rect.left - parentRect.left + rect.width / 2}px`;
                  pill.style.top = `${rect.top - parentRect.top + rect.height / 2}px`;
                }
              });
            }
          };

          let observer: ResizeObserver | null = null;
          const firstPill = Object.values(overlayPillsRef.current).find(Boolean);
          if (firstPill && firstPill.parentElement) {
            observer = new ResizeObserver(() => syncCorners());
            observer.observe(firstPill.parentElement);
            syncCorners();
          } else {
            setTimeout(() => {
              const fp = Object.values(overlayPillsRef.current).find(Boolean);
              if (fp && fp.parentElement) {
                observer = new ResizeObserver(() => syncCorners());
                observer.observe(fp.parentElement);
                syncCorners();
              }
            }, 100);
          }

          return () => {
            if (observer) observer.disconnect();
          };
        }
        return;
      }

      let startLoopTime: number | null = null;
      const loopDurationMs = variant === 'hero-3d' ? 60000 : 8000;
      let lastSector = -1;
      let isVisible = true;

      const syncCorners = () => {
        const firstPill = Object.values(overlayPillsRef.current).find(Boolean);
        if (firstPill && firstPill.parentElement) {
          const parentRect = firstPill.parentElement.getBoundingClientRect();
          Object.keys(anchorRefs.current).forEach(key => {
            const num = Number(key);
            const anchor = anchorRefs.current[num];
            const pill = overlayPillsRef.current[num];
            if (anchor && pill) {
              const rect = anchor.getBoundingClientRect();
              pill.style.left = `${rect.left - parentRect.left + rect.width / 2}px`;
              pill.style.top = `${rect.top - parentRect.top + rect.height / 2}px`;
            }
          });
        }
      };

      const loopAnimation = (timestamp: number) => {
        if (!isVisible) return;
        if (!startLoopTime) startLoopTime = timestamp;
        const elapsed = timestamp - startLoopTime;
        
        const linearProgress = (elapsed % loopDurationMs) / loopDurationMs;
        const dynamicProgress = linearProgress + (Math.sin(linearProgress * Math.PI * 10) * 0.015);
        const safeProgress = Math.max(0, Math.min(1, dynamicProgress));

        if (pathRef.current) {
          const pt = pathRef.current.getPointAtLength(safeProgress * len);
          
          if (carOuterRef.current && carInnerRef.current) {
            carOuterRef.current.setAttribute('cx', String(pt.x));
            carOuterRef.current.setAttribute('cy', String(pt.y));
            carInnerRef.current.setAttribute('cx', String(pt.x));
            carInnerRef.current.setAttribute('cy', String(pt.y));
          }
          
          if (variant === 'hero-3d') {
            let currentSector = 1;
            const curLen = safeProgress * len;
            
            const inSector = (pos: number, start: number, end: number) => {
              if (start <= end) {
                return pos >= start && pos <= end;
              } else {
                return pos >= start || pos <= end;
              }
            };

            if (inSector(curLen, sfLen, s1End)) {
              currentSector = 1;
            } else if (inSector(curLen, s1End, s2End)) {
              currentSector = 2;
            } else {
              currentSector = 3;
            }
            
            if (currentSector !== lastSector) {
               setHeroStage(currentSector);
               lastSector = currentSector;
            }

            if (onActiveTurnChange) {
              let closestTurn: TurnMarker | null = null;
              let minDistance = 25;
              snappedTurnsRef.current.forEach(turn => {
                const dist = Math.hypot(turn.x - pt.x, turn.y - pt.y);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestTurn = turn;
                }
              });
              const currId = activeTurnRef.current ? activeTurnRef.current.number : null;
              const newId = closestTurn ? (closestTurn as TurnMarker).number : null;
              if (currId !== newId) {
                setActiveTurn(closestTurn);
              }
            }
          }
        }
        if (isVisible) {
          animFrameRef.current = requestAnimationFrame(loopAnimation);
        }
      };

      let observer: ResizeObserver | null = null;
      let visibilityObserver: IntersectionObserver | null = null;

      if (variant === 'hero-3d') {
        const t1 = setTimeout(() => {
          setSectorsVisible(true);
          if (isVisible && !animFrameRef.current) {
            animFrameRef.current = requestAnimationFrame(loopAnimation);
          }
        }, 500);
        
        const firstPill = Object.values(overlayPillsRef.current).find(Boolean);
        const container = firstPill?.parentElement || rootContainerRef.current;
        if (container) {
          observer = new ResizeObserver(() => {
            syncCorners();
          });
          observer.observe(container);
          // Initial coordinate calculation
          requestAnimationFrame(() => syncCorners());
        }

        if (rootContainerRef.current) {
          visibilityObserver = new IntersectionObserver(([entry]) => {
            const nextVisible = entry.isIntersecting;
            if (nextVisible === isVisible) return;
            isVisible = nextVisible;
            if (!isVisible) {
              if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
              }
            } else {
              if (!animFrameRef.current) {
                animFrameRef.current = requestAnimationFrame(loopAnimation);
              }
            }
          }, { threshold: 0.05 });
          visibilityObserver.observe(rootContainerRef.current);
        }
        
        return () => { 
          clearTimeout(t1); 
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          if (observer) observer.disconnect();
          if (visibilityObserver) visibilityObserver.disconnect();
        };
      } else {
        const timer = setTimeout(() => {
          setSectorsVisible(true);
          if (variant === 'card' && isVisible && !animFrameRef.current) {
            animFrameRef.current = requestAnimationFrame(loopAnimation);
          }
        }, 1400);

        if (rootContainerRef.current) {
          visibilityObserver = new IntersectionObserver(([entry]) => {
            const nextVisible = entry.isIntersecting;
            if (nextVisible === isVisible) return;
            isVisible = nextVisible;
            if (!isVisible) {
              if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
              }
            } else {
              if (!animFrameRef.current && variant === 'card') {
                animFrameRef.current = requestAnimationFrame(loopAnimation);
              }
            }
          }, { threshold: 0.05 });
          visibilityObserver.observe(rootContainerRef.current);
        }

        return () => { 
          clearTimeout(timer); 
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          if (visibilityObserver) visibilityObserver.disconnect();
        };
      }
    }
  }, [info.path, variant, circuitId, info.id, shouldReduceMotion, onActiveTurnChange])

  const is3D = variant === 'hero-3d'
  
  // Parse viewBox so we can map SVG coordinates to HTML % percentages
  const [vbMinX, vbMinY, vbWidth, vbHeight] = (info.viewBox || "0 0 1000 1000").split(' ').map(Number);

  const baseTrackOpacity = is3D ? 0.14 : 1
  const sectorOpacity = is3D ? 0.65 : 1
  
  const LIFT_HEIGHT = 45; // The active sector raises to Z=45px

  const renderSectorWall = (stage: number, color: string, start: number, end: number) => {
    if (!is3D) return null;
    const isActive = heroStage === stage;
    const numLayers = 6;
    const layerSpacing = LIFT_HEIGHT / numLayers;
    
    return Array.from({ length: numLayers }).map((_, i) => {
      const isTop = i === numLayers - 1;
      let opacity = 0;
      if (shouldReduceMotion) {
        opacity = isTop ? 0.75 : 0.06;
      } else if (isActive) {
        opacity = isTop ? 0.95 : 0.12; 
      } else {
        opacity = isTop ? 0.18 : 0.015;
      }
      
      const createPath = (s: number, e: number, keySuffix: string) => {
         let len = e - s;
         if (len < 0) len += pathLength;
         return (
            <motion.path
              key={keySuffix}
              d={info.path}
              stroke={color}
              strokeWidth={isTop && isActive ? "5" : "4"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${len} ${pathLength}`}
              strokeDashoffset={`-${s}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: sectorsVisible ? opacity : 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
         )
      };

      return (
        <div 
          key={i}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ 
            transform: (isActive || shouldReduceMotion) ? `translateZ(${i * layerSpacing}px)` : 'translateZ(0px)', 
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
            transformStyle: 'preserve-3d' 
          }}
        >
          <svg viewBox={info.viewBox} className="w-full h-full" fill="none" style={{ overflow: 'visible' }}>
            {start <= end ? (
               createPath(start, end, 'single')
            ) : (
               <>
                 {createPath(start, pathLength, 'part1')}
                 {createPath(0, end, 'part2')}
               </>
            )}
          </svg>
        </div>
      );
    });
  };

  return (
    <div
      ref={rootContainerRef}
      className={
        variant === "card"
          ? "f1-card-accent relative flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--card-shadow)] overflow-hidden transition-all duration-200 hover:shadow-[var(--card-shadow-hover)]"
          : cn(
              "relative w-full h-full flex items-center",
              align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
            )
      }
      style={is3D ? { transformStyle: 'preserve-3d', willChange: 'transform', contain: 'paint' } : undefined}
    >
      
      {variant === "card" && (
        <div className="w-full flex items-center justify-between text-xs font-mono mb-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] font-bold text-xs border border-[var(--border)]">
              {info.turns} TURNS
            </span>
            <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] font-semibold text-xs">
              {info.lengthKm}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs uppercase font-bold tracking-tight">
            <span className="flex items-center gap-1 text-[var(--timing-purple)] font-semibold text-xs"><span className="w-2 h-2 rounded-full bg-[var(--timing-purple)]" />S1</span>
            <span className="flex items-center gap-1 text-[var(--timing-green)] font-semibold text-xs"><span className="w-2 h-2 rounded-full bg-[var(--timing-green)]" />S2</span>
            <span className="flex items-center gap-1 text-[var(--timing-yellow)] font-semibold text-xs"><span className="w-2 h-2 rounded-full bg-[var(--timing-yellow)]" />S3</span>
          </div>
        </div>
      )}

      {/* SVG Canvas Container */}
      <div
        className={cn(
          "relative w-full flex items-center",
          align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center',
          !is3D && "my-2"
        )}
      >
        
        {/* The aspect ratio block that controls the size */}
        <div className={is3D ? className : "w-full"} style={is3D ? { position: 'relative', transformStyle: 'preserve-3d', transform: `perspective(800px) rotateX(${rotateX}deg) rotateZ(${rotation}deg)`, willChange: 'transform', contain: 'paint' } : { position: 'relative' }}>
          
          {/* Dummy SVG to drive aspect ratio */}
          <svg viewBox={info.viewBox} className="w-full h-full invisible pointer-events-none" fill="none">
            <path d={info.path} />
          </svg>

          {React.useMemo(() => (
            <>
              {/* Layer 0: Base ghost track */}
              <svg viewBox={info.viewBox} className="absolute inset-0 w-full h-full" fill="none" style={{ overflow: 'visible' }}>
                <path d={info.path} stroke="var(--surface-3)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity={baseTrackOpacity} />
                <path ref={pathRef} d={info.path} stroke="none" fill="none" />
                <motion.path
                  d={info.path}
                  stroke="var(--accent)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={is3D ? 0.1 : 1}
                  initial={shouldReduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
                />
              </svg>

              {/* Render 3D Extruded Sectors (or flat for card) */}
              {is3D ? (
                <>
                  {renderSectorWall(1, 'var(--timing-purple)', sectorBounds.s1.start, sectorBounds.s1.end)}
                  {renderSectorWall(2, 'var(--timing-green)', sectorBounds.s2.start, sectorBounds.s2.end)}
                  {renderSectorWall(3, 'var(--timing-yellow)', sectorBounds.s3.start, sectorBounds.s3.end)}
                </>
              ) : (
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                  <svg viewBox={info.viewBox} className="w-full h-full" fill="none" style={{ overflow: 'visible' }}>
                    {(() => {
                      const createPath = (s: number, e: number, color: string, keySuffix: string) => {
                         let len = e - s;
                         if (len < 0) len += pathLength;
                         return (
                            <motion.path
                              key={keySuffix}
                              d={info.path}
                              stroke={color}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray={`${len} ${pathLength}`}
                              strokeDashoffset={`-${s}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: sectorsVisible ? sectorOpacity : 0 }}
                              transition={{ duration: 0.4 }}
                            />
                         )
                      };

                      return (
                        <>
                          {sectorBounds.s1.start <= sectorBounds.s1.end ? createPath(sectorBounds.s1.start, sectorBounds.s1.end, 'var(--timing-purple)', 's1') : (
                            <>{createPath(sectorBounds.s1.start, pathLength, 'var(--timing-purple)', 's1-p1')}{createPath(0, sectorBounds.s1.end, 'var(--timing-purple)', 's1-p2')}</>
                          )}
                          {sectorBounds.s2.start <= sectorBounds.s2.end ? createPath(sectorBounds.s2.start, sectorBounds.s2.end, 'var(--timing-green)', 's2') : (
                            <>{createPath(sectorBounds.s2.start, pathLength, 'var(--timing-green)', 's2-p1')}{createPath(0, sectorBounds.s2.end, 'var(--timing-green)', 's2-p2')}</>
                          )}
                          {sectorBounds.s3.start <= sectorBounds.s3.end ? createPath(sectorBounds.s3.start, sectorBounds.s3.end, 'var(--timing-yellow)', 's3') : (
                            <>{createPath(sectorBounds.s3.start, pathLength, 'var(--timing-yellow)', 's3-p1')}{createPath(0, sectorBounds.s3.end, 'var(--timing-yellow)', 's3-p2')}</>
                          )}
                        </>
                      )
                    })()}
                  </svg>
                </div>
              )}
            </>
          ), [info.path, baseTrackOpacity, is3D, sectorBounds, pathLength, sectorsVisible, sectorOpacity, heroStage])}

          {/* Layer: Floating UI (Car and markers) */}
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={is3D ? { 
              transformStyle: 'preserve-3d',
            } : undefined}
          >
            {!is3D ? (
              <svg viewBox={info.viewBox} className="w-full h-full" fill="none" style={{ overflow: 'visible' }}>
                <circle cx={info.startFinishPoint.x} cy={info.startFinishPoint.y} r="4.5" fill="var(--surface-1)" stroke="var(--accent)" strokeWidth="2" />

                {snappedTurns.map((turn, idx) => {
                  const isHovered = activeTurn?.number === turn.number
                  const sectorColor = turn.sector === 1 ? 'var(--timing-purple)' : turn.sector === 2 ? 'var(--timing-green)' : 'var(--timing-yellow)'
                  const px = turn.pillX ?? turn.x
                  const py = turn.pillY ?? turn.y
                  const hasOffset = turn.pillX !== undefined && turn.pillY !== undefined

                  return (
                    <motion.g
                      key={turn.number}
                      className="cursor-pointer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4 + idx * 0.02, duration: 0.25 }}
                      onMouseEnter={() => setActiveTurn(turn)}
                      onMouseLeave={() => setActiveTurn(null)}
                    >
                      {hasOffset && (
                        <line x1={turn.x} y1={turn.y} x2={px} y2={py} stroke={sectorColor} strokeWidth="1" strokeDasharray="2 2" opacity={isHovered ? 0.9 : 0.5} />
                      )}
                      <circle
                        cx={turn.x}
                        cy={turn.y}
                        r={isHovered ? 4.5 : 2.75}
                        fill={sectorColor}
                        stroke="var(--surface-1)"
                        strokeWidth={isHovered ? 2 : 1}
                        opacity={isHovered ? 1 : 0.85}
                        className="transition-all duration-150"
                      />
                      <g>
                        <rect x={px - (turn.number >= 10 ? 26 : 22) / 2} y={py - 20 / 2} width={turn.number >= 10 ? 26 : 22} height={20} rx="5" fill="#0B0B0F" stroke={isHovered ? 'var(--text)' : sectorColor} strokeWidth={isHovered ? 2 : 1.2} className="transition-all duration-150" />
                        <text x={px} y={py + 4.5} textAnchor="middle" fontSize="13" fontWeight="bold" fontFamily="var(--font-mono)" fill="#FFFFFF" pointerEvents="none">
                          {turn.number}
                        </text>
                      </g>
                    </motion.g>
                  )
                })}

                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
                  <circle ref={carOuterRef} cx="-100" cy="-100" r="7" fill="var(--accent)" opacity="0.35" />
                  <circle ref={carInnerRef} cx="-100" cy="-100" r="3.5" fill="var(--surface-1)" stroke="var(--accent)" strokeWidth="1.5" />
                </motion.g>
              </svg>
            ) : (
              <>
                {/* Car layer always follows the lifted level (Z=45px) */}
                <div
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    transform: `translateZ(${LIFT_HEIGHT}px)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <svg viewBox={info.viewBox} className="w-full h-full" fill="none" style={{ overflow: 'visible' }}>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
                      <circle ref={carOuterRef} cx="-100" cy="-100" r="7" fill="var(--accent)" opacity="0.35" />
                      <circle ref={carInnerRef} cx="-100" cy="-100" r="3.5" fill="var(--surface-1)" stroke="var(--accent)" strokeWidth="1.5" />
                    </motion.g>
                  </svg>
                </div>

                {/* Sectors 1, 2, 3: Turn markers are on the normal level (Z=0px) and elevate to Z=45px with their active sector */}
                {([1, 2, 3] as const).map((sec) => {
                  const isSectorActive = heroStage === sec || shouldReduceMotion;
                  const sectorTurns = snappedTurns.filter((t) => t.sector === sec);

                  return (
                    <div
                      key={`sector-${sec}-markers`}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        transform: isSectorActive ? `translateZ(${LIFT_HEIGHT}px)` : 'translateZ(0px)',
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <svg viewBox={info.viewBox} className="w-full h-full" fill="none" style={{ overflow: 'visible' }}>
                        {sec === 1 && (
                          <circle cx={info.startFinishPoint.x} cy={info.startFinishPoint.y} r="4.5" fill="var(--surface-1)" stroke="var(--accent)" strokeWidth="2" />
                        )}
                        {sectorTurns.map((turn, idx) => {
                          const isHovered = activeTurn?.number === turn.number;
                          const sectorColor = turn.sector === 1 ? 'var(--timing-purple)' : turn.sector === 2 ? 'var(--timing-green)' : 'var(--timing-yellow)';
                          const px = turn.pillX ?? turn.x;
                          const py = turn.pillY ?? turn.y;
                          const hasOffset = turn.pillX !== undefined && turn.pillY !== undefined;

                          return (
                            <motion.g
                              key={turn.number}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                delay: 0.2 + idx * 0.015,
                                duration: 0.25,
                              }}
                            >
                              {hasOffset && (
                                <line x1={turn.x} y1={turn.y} x2={px} y2={py} stroke={sectorColor} strokeWidth="1" strokeDasharray="2 2" opacity={isHovered ? 0.9 : (isSectorActive ? 0.5 : 0.15)} />
                              )}
                              {isHovered && (
                                <circle cx={turn.x} cy={turn.y} r="8" fill="none" stroke={sectorColor} strokeWidth="1.5" opacity="0.8" />
                              )}
                              <circle
                                cx={turn.x}
                                cy={turn.y}
                                r={isHovered ? 4.5 : 2.75}
                                fill={sectorColor}
                                stroke="var(--surface-1)"
                                strokeWidth={isHovered ? 2 : 1}
                                opacity={isHovered ? 1 : (isSectorActive ? 0.85 : 0.25)}
                                className="transition-all duration-150"
                              />

                              {/* Invisible anchor dot for projecting the 2D billboard pill */}
                              <circle
                                ref={(el) => { anchorRefs.current[turn.number] = el; }}
                                cx={turn.pillX ?? turn.x}
                                cy={turn.pillY ?? turn.y}
                                r="1"
                                fill="transparent"
                              />
                            </motion.g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* 2D Overlay for flat corner numbers */}
        {is3D && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            {snappedTurns.map((turn) => {
              const isActive = activeTurn?.number === turn.number;
              const isSecActive = heroStage === turn.sector || shouldReduceMotion;
              const sectorColor = turn.sector === 1 ? 'var(--timing-purple)' : turn.sector === 2 ? 'var(--timing-green)' : 'var(--timing-yellow)';
              const isDoubleDigit = turn.number >= 10;

              return (
                <div
                  key={turn.number}
                  ref={el => { overlayPillsRef.current[turn.number] = el; }}
                  className={cn(
                    "absolute flex items-center justify-center font-mono font-bold rounded-[3px] pointer-events-none transition-all duration-150",
                    isActive
                      ? "z-30 text-[12px] text-white bg-[#0B0B0F] shadow-lg scale-125"
                      : (isSecActive ? "z-10 text-[10px] text-white/90 bg-[#0B0B0F]/85 shadow-sm" : "z-0 text-[10px] text-white/40 bg-[#0B0B0F]/50 shadow-none")
                  )}
                  style={{
                    width: isDoubleDigit ? (isActive ? 25 : 21) : (isActive ? 21 : 18),
                    height: isActive ? 19 : 15,
                    border: isActive ? `2px solid ${sectorColor}` : (isSecActive ? `1px solid ${sectorColor}` : `1px solid ${sectorColor}44`),
                    boxShadow: isActive ? `0 0 10px ${sectorColor}` : undefined,
                    transform: `translate(-50%, -50%)`,
                    opacity: sectorsVisible ? (isActive ? 1 : (isSecActive ? 0.78 : 0.25)) : 0,
                  }}
                >
                  {turn.number}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Sector Telemetry Legend in Hero 3D */}
        {is3D && !hideSectorLegend && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-4 z-20 flex items-center gap-2 sm:gap-2.5 px-2.5 py-1 rounded-[4px] bg-[var(--surface-1)]/85 border border-[var(--border)] backdrop-blur-md text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider shadow-sm pointer-events-none">
            <span className={cn("flex items-center gap-1 transition-opacity", (heroStage === 1 || shouldReduceMotion) ? "text-[var(--timing-purple)] opacity-100 font-bold" : "text-[var(--timing-purple)] opacity-60")}>
              <span className={cn("w-1.5 h-1.5 rounded-full bg-[var(--timing-purple)]", heroStage === 1 && !shouldReduceMotion && "animate-pulse")} />
              S1
            </span>
            <span className={cn("flex items-center gap-1 transition-opacity", (heroStage === 2 || shouldReduceMotion) ? "text-[var(--timing-green)] opacity-100 font-bold" : "text-[var(--timing-green)] opacity-60")}>
              <span className={cn("w-1.5 h-1.5 rounded-full bg-[var(--timing-green)]", heroStage === 2 && !shouldReduceMotion && "animate-pulse")} />
              S2
            </span>
            <span className={cn("flex items-center gap-1 transition-opacity", (heroStage === 3 || shouldReduceMotion) ? "text-[var(--timing-yellow)] opacity-100 font-bold" : "text-[var(--timing-yellow)] opacity-60")}>
              <span className={cn("w-1.5 h-1.5 rounded-full bg-[var(--timing-yellow)]", heroStage === 3 && !shouldReduceMotion && "animate-pulse")} />
              S3
            </span>
            {activeTurn && (
              <span className="hidden sm:inline pl-1.5 border-l border-[var(--border)] text-[var(--text)] font-bold">
                T{activeTurn.number}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}




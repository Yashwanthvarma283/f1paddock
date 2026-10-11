import React, { useState } from 'react'
import { getDriverImage } from '@/lib/driverImages'
import { cn } from '@/lib/utils'

interface DriverAvatarProps {
  driverId: string
  code?: string
  givenName: string
  familyName: string
  className?: string
  fallbackClassName?: string
  width?: number | string
  height?: number | string
  style?: React.CSSProperties
}

export const DriverAvatar: React.FC<DriverAvatarProps> = ({ driverId, code, givenName, familyName, className, fallbackClassName, width, height, style }) => {
  const primaryUrl = getDriverImage(driverId) || `/drivers/${driverId}.png`
  const localUrl = `/drivers/${driverId}.png`
  
  const [src, setSrc] = useState<string | undefined>(primaryUrl)
  const [hasError, setHasError] = useState(false)

  React.useEffect(() => {
    setHasError(false)
    const currentPrimary = getDriverImage(driverId) || `/drivers/${driverId}.png`
    setSrc(currentPrimary)
  }, [driverId])

  const handleError = () => {
    // If primary was remote or different and local exists, try localUrl
    if (src !== localUrl) {
      setSrc(localUrl)
    } else {
      setHasError(true)
      setSrc(undefined)
    }
  }

  if (hasError || !src) {
    const fallbackText = code || familyName.substring(0, 3).toUpperCase()
    return (
      <div 
        className={cn("flex items-center justify-center bg-[var(--surface-3)] text-[var(--text-strong)] border border-[var(--border-subtle)] rounded-full shrink-0", fallbackClassName || className)}
        title={`${givenName} ${familyName}`}
        style={{ width, height }}
      >
        <span className="font-bold tracking-widest text-[0.8em]">
          {fallbackText}
        </span>
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={`${givenName} ${familyName}`}
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      width={width}
      height={height}
      style={style}
    />
  )
}

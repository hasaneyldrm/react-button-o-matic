import { useLayoutEffect, useRef, useState } from 'react'
import type { ButtonOMaticVariant, ReelSpin } from './types'

export interface ReelProps {
  index: number
  idle: ButtonOMaticVariant
  above: ButtonOMaticVariant
  below: ButtonOMaticVariant
  buttonLabel: string
  landed: boolean
  spin: ReelSpin | null
}

export function Reel({
  index,
  idle,
  above,
  below,
  buttonLabel,
  landed,
  spin,
}: ReelProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const [blurred, setBlurred] = useState(false)

  // Drive the strip with a single decelerating transform transition: fast
  // start, long ease-out, slight overshoot so the reel settles with a thunk.
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    if (!spin) {
      // Back to idle: drop the inline styles so the idle bob (class-driven)
      // takes over again.
      strip.style.transition = ''
      strip.style.transform = ''
      return
    }
    strip.style.transition = 'none'
    strip.style.transform = 'translateY(0)'
    setBlurred(true)
    void strip.offsetHeight // flush so the reset applies before the transition
    const cell = strip.firstElementChild as HTMLElement | null
    const cellHeight = cell?.offsetHeight ?? 64
    const target = (spin.seq.length - 1) * cellHeight
    const raf = requestAnimationFrame(() => {
      strip.style.transition = `transform ${spin.duration}ms cubic-bezier(0.1, 0.35, 0.08, 1.03)`
      strip.style.transform = `translateY(${-target}px)`
    })
    const unblur = setTimeout(
      () => setBlurred(false),
      Math.max(0, spin.duration - 330),
    )
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(unblur)
    }
  }, [spin?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`bom-reel${landed ? ' bom-reel--thunk' : ''}`}>
      {spin ? (
        <div
          ref={stripRef}
          className={`bom-reelStrip${blurred ? ' bom-reelStrip--blur' : ''}`}
        >
          {spin.seq.map((v, i) => (
            <ReelCell key={i} variant={v} buttonLabel={buttonLabel} />
          ))}
        </div>
      ) : (
        <div
          className="bom-reelStrip bom-reelStrip--idle"
          style={{
            animationDuration: `${3.1 + index * 0.55}s`,
            animationDelay: `${index * 0.65}s`,
          }}
        >
          <ReelCell variant={above} buttonLabel={buttonLabel} />
          <ReelCell variant={idle} buttonLabel={buttonLabel} />
          <ReelCell variant={below} buttonLabel={buttonLabel} />
        </div>
      )}
    </div>
  )
}

export function ReelCell({
  variant,
  buttonLabel,
}: {
  variant: ButtonOMaticVariant
  buttonLabel: string
}) {
  return (
    <div className="bom-reelCell">
      <span
        className="bom-reelButton"
        style={{ background: variant.background, color: variant.color ?? '#ffffff' }}
      >
        {variant.label ?? buttonLabel}
      </span>
    </div>
  )
}

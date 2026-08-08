import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { ConfettiBurst } from './Confetti'
import './button-o-matic.css'

export interface ButtonOMaticVariant {
  /** Unique id, also used in default copy ("JACKPOT — BLUE SHIPS"). */
  id: string
  /** Background color of the sign-in button for this variant. */
  background: string
  /** Text color of the sign-in button for this variant. */
  color?: string
  /** Per-variant label override; falls back to `buttonLabel`. */
  label?: string
}

export type ButtonOMaticPhase = 'idle' | 'rolling' | 'jackpot' | 'revealed'

interface WinnerContext {
  winner: ButtonOMaticVariant
}

interface ClicksContext extends WinnerContext {
  count: number
}

type TextOrFn<C> = string | ((ctx: C) => string)

export interface ButtonOMaticProps {
  /** The button variants loaded in the reels. Default: blue / black / orange. */
  variants?: ButtonOMaticVariant[]
  /** Label on the reel buttons and the revealed button. */
  buttonLabel?: string
  /** Text on the black marquee above the machine. */
  marqueeText?: string
  /** Model name printed on the machine body. */
  machineName?: string
  /** Number of reels. */
  reels?: number
  /** LCD copy for each phase. */
  idleText?: string
  rollingText?: string
  jackpotText?: TextOrFn<WinnerContext>
  /** Caption under the revealed button. */
  winnerText?: TextOrFn<WinnerContext>
  /** Caption after the revealed button has been clicked at least once. */
  clicksText?: TextOrFn<ClicksContext>
  /** Label of the reset link under the revealed button. Pass `null` to hide it. */
  resetText?: string | null
  /** Accessible label for the lever. */
  leverLabel?: string
  /** Rig the outcome to a specific variant id. */
  winnerId?: string
  /** Custom winner picker; defaults to uniform random. */
  pickWinner?: (variants: ButtonOMaticVariant[]) => string
  /** ms of spinning before the first reel lands. */
  spinDuration?: number
  /** ms between consecutive reels landing. */
  reelStagger?: number
  /** ms the jackpot celebration is held before the machine morphs into the button. */
  jackpotDuration?: number
  /** Confetti on jackpot. */
  confetti?: boolean
  /** Confetti palette; defaults to variant colors plus a few festive ones. */
  confettiColors?: string[]
  /** Persist outcome + click count to localStorage under this key. */
  persistKey?: string
  /** `type` of the revealed button (use "submit" inside a form). */
  buttonType?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  style?: CSSProperties
  onPull?: () => void
  onReveal?: (winner: ButtonOMaticVariant) => void
  onButtonClick?: (count: number, winner: ButtonOMaticVariant) => void
  onReset?: () => void
  /** Full control over the revealed state. */
  renderRevealed?: (ctx: {
    winner: ButtonOMaticVariant
    count: number
    click: () => void
    reset: () => void
  }) => ReactNode
}

export const DEFAULT_VARIANTS: ButtonOMaticVariant[] = [
  { id: 'blue', background: '#3b6ef6', color: '#ffffff' },
  { id: 'black', background: '#1b1b1f', color: '#ffffff' },
  { id: 'orange', background: '#f6821f', color: '#ffffff' },
]

const FESTIVE = ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#ffffff']

interface SpinPlan {
  id: number
  seqs: ButtonOMaticVariant[][]
  durations: number[]
}

function resolveText<C>(text: TextOrFn<C>, ctx: C): string {
  return typeof text === 'function' ? text(ctx) : text
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function randomVariant(
  variants: ButtonOMaticVariant[],
  notId?: string,
): ButtonOMaticVariant {
  if (variants.length === 1) return variants[0]
  let v = variants[Math.floor(Math.random() * variants.length)]
  while (v.id === notId) {
    v = variants[Math.floor(Math.random() * variants.length)]
  }
  return v
}

interface PersistedState {
  winnerId: string
  count: number
}

function readPersisted(key: string | undefined): PersistedState | null {
  if (!key || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (typeof parsed?.winnerId !== 'string') return null
    return { winnerId: parsed.winnerId, count: Number(parsed.count) || 0 }
  } catch {
    return null
  }
}

function writePersisted(key: string | undefined, state: PersistedState | null) {
  if (!key || typeof window === 'undefined') return
  try {
    if (state === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* storage unavailable */
  }
}

export function ButtonOMatic({
  variants = DEFAULT_VARIANTS,
  buttonLabel = 'Sign in',
  marqueeText = 'FOR SCIENCE',
  machineName = 'BUTTON-O-MATIC 3000',
  reels = 3,
  idleText = 'PULL TO REVEAL YOUR SIGN-IN BUTTON',
  rollingText = 'ROLLING…',
  jackpotText = ({ winner }) => `JACKPOT — ${winner.id.toUpperCase()} SHIPS`,
  winnerText = ({ winner }) => `winner: ${winner.id}. your click counts.`,
  clicksText = ({ count }) => `n=${count} clicks recorded — for science.`,
  resetText = 'reset experiment',
  leverLabel = 'Pull the lever',
  winnerId,
  pickWinner,
  spinDuration = 1500,
  reelStagger = 600,
  jackpotDuration = 1500,
  confetti = true,
  confettiColors,
  persistKey,
  buttonType = 'button',
  disabled = false,
  className,
  style,
  onPull,
  onReveal,
  onButtonClick,
  onReset,
  renderRevealed,
}: ButtonOMaticProps) {
  const [phase, setPhase] = useState<ButtonOMaticPhase>('idle')
  const [winner, setWinner] = useState<ButtonOMaticVariant | null>(null)
  const [spin, setSpin] = useState<SpinPlan | null>(null)
  const [landedCount, setLandedCount] = useState(0)
  const [count, setCount] = useState(0)
  const [leverPulled, setLeverPulled] = useState(false)
  const [machineGone, setMachineGone] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const spinIdRef = useRef(0)
  const restoredRef = useRef(false)

  const palette = useMemo(
    () => confettiColors ?? [...variants.map((v) => v.background), ...FESTIVE],
    [confettiColors, variants],
  )

  const schedule = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms))
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  // Restore a persisted outcome once on mount.
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const saved = readPersisted(persistKey)
    if (!saved) return
    const savedWinner = variants.find((v) => v.id === saved.winnerId)
    if (!savedWinner) return
    setWinner(savedWinner)
    setCount(saved.count)
    setPhase('revealed')
    setMachineGone(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pull = useCallback(() => {
    if (phase !== 'idle' || disabled) return
    const id =
      winnerId ??
      (pickWinner
        ? pickWinner(variants)
        : variants[Math.floor(Math.random() * variants.length)].id)
    const picked = variants.find((v) => v.id === id) ?? variants[0]
    const reduced = prefersReducedMotion()

    // Build a randomized strip per reel: start on the idle face, roll through
    // a random sequence, land on the winner. Later reels roll longer.
    const seqs: ButtonOMaticVariant[][] = []
    const durations: number[] = []
    for (let i = 0; i < reels; i++) {
      const idle = variants[i % variants.length]
      const cells = reduced ? 3 : 12 + i * 6 + Math.floor(Math.random() * 5)
      const seq: ButtonOMaticVariant[] = [idle]
      for (let k = 0; k < cells; k++) {
        seq.push(randomVariant(variants, seq[seq.length - 1].id))
      }
      // Make the final snap onto the winner visible.
      if (seq[seq.length - 1].id === picked.id && variants.length > 1) {
        seq[seq.length - 1] = randomVariant(variants, picked.id)
      }
      seq.push(picked)
      seqs.push(seq)
      durations.push(
        reduced
          ? 260 + i * 90
          : spinDuration + i * reelStagger + Math.random() * 220,
      )
    }
    const settle = reduced ? 120 : 430
    const hold = reduced ? 500 : jackpotDuration
    const lastLanding = Math.max(...durations)

    spinIdRef.current += 1
    setSpin({ id: spinIdRef.current, seqs, durations })
    setWinner(picked)
    setPhase('rolling')
    setLandedCount(0)
    setLeverPulled(true)
    onPull?.()

    schedule(() => setLeverPulled(false), 900)
    durations.forEach((d, i) => schedule(() => setLandedCount(i + 1), d))
    schedule(() => {
      setPhase('jackpot')
      onReveal?.(picked)
    }, lastLanding + settle)
    schedule(() => setPhase('revealed'), lastLanding + settle + hold)
    schedule(() => setMachineGone(true), lastLanding + settle + hold + 480)
  }, [
    phase,
    disabled,
    winnerId,
    pickWinner,
    variants,
    reels,
    spinDuration,
    reelStagger,
    jackpotDuration,
    onPull,
    onReveal,
    schedule,
  ])

  const click = useCallback(() => {
    if (!winner) return
    setCount((prev) => {
      const next = prev + 1
      writePersisted(persistKey, { winnerId: winner.id, count: next })
      onButtonClick?.(next, winner)
      return next
    })
  }, [winner, persistKey, onButtonClick])

  const reset = useCallback(() => {
    clearTimers()
    writePersisted(persistKey, null)
    setPhase('idle')
    setWinner(null)
    setSpin(null)
    setLandedCount(0)
    setCount(0)
    setLeverPulled(false)
    setMachineGone(false)
    onReset?.()
  }, [clearTimers, persistKey, onReset])

  // Persist the outcome as soon as it is revealed (before any click).
  useEffect(() => {
    if (phase === 'revealed' && winner && count === 0) {
      writePersisted(persistKey, { winnerId: winner.id, count: 0 })
    }
  }, [phase, winner, count, persistKey])

  const lcdText =
    phase === 'idle'
      ? idleText
      : phase === 'rolling'
        ? rollingText
        : winner
          ? resolveText(jackpotText, { winner })
          : idleText

  const showRevealed = phase === 'revealed' && winner !== null

  const rootClass = [
    'bom',
    `bom--${phase}`,
    disabled ? 'bom--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} style={style}>
      {!machineGone && (
        <div className={`bom-stage${phase === 'revealed' ? ' bom-stage--exit' : ''}`}>
          <div className="bom-marquee" aria-hidden="true">
            <div className="bom-marqueeDots">
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  key={i}
                  className="bom-marqueeDot"
                  style={{
                    background: palette[i % palette.length],
                    animationDelay: `${i * 0.09}s`,
                  }}
                />
              ))}
            </div>
            <span className="bom-marqueeText">{marqueeText}</span>
          </div>

          <div className="bom-machine">
            <div className="bom-machineName">{machineName}</div>

            <div className="bom-window">
              <span className="bom-payline bom-payline--left" aria-hidden="true" />
              {Array.from({ length: reels }, (_, i) => (
                <Reel
                  key={i}
                  idle={variants[i % variants.length]}
                  buttonLabel={buttonLabel}
                  landed={landedCount > i}
                  spin={
                    spin
                      ? { id: spin.id, seq: spin.seqs[i], duration: spin.durations[i] }
                      : null
                  }
                />
              ))}
              <span className="bom-payline bom-payline--right" aria-hidden="true" />
            </div>

            <div className="bom-lcd" role="status" aria-live="polite">
              {lcdText}
            </div>

            <button
              type="button"
              className={`bom-lever${leverPulled ? ' bom-lever--pulled' : ''}`}
              onClick={pull}
              disabled={disabled || phase !== 'idle'}
              aria-label={leverLabel}
              title={leverLabel}
            >
              <span className="bom-leverTrack" aria-hidden="true" />
              <span className="bom-leverArm" aria-hidden="true">
                <span className="bom-leverKnob" />
              </span>
            </button>

            {confetti && phase === 'jackpot' && <ConfettiBurst colors={palette} />}
          </div>
        </div>
      )}

      {showRevealed &&
        (renderRevealed ? (
          renderRevealed({ winner: winner!, count, click, reset })
        ) : (
          <div className="bom-revealed">
            <button
              type={buttonType}
              className="bom-winnerButton"
              style={{
                background: winner!.background,
                color: winner!.color ?? '#ffffff',
              }}
              onClick={click}
              disabled={disabled}
            >
              {winner!.label ?? buttonLabel}
            </button>
            <p className="bom-caption" role="status" aria-live="polite">
              {count > 0
                ? resolveText(clicksText, { winner: winner!, count })
                : resolveText(winnerText, { winner: winner! })}
            </p>
            {resetText !== null && (
              <button type="button" className="bom-reset" onClick={reset}>
                {resetText}
              </button>
            )}
          </div>
        ))}
    </div>
  )
}

interface ReelSpin {
  id: number
  seq: ButtonOMaticVariant[]
  duration: number
}

interface ReelProps {
  idle: ButtonOMaticVariant
  buttonLabel: string
  landed: boolean
  spin: ReelSpin | null
}

function Reel({ idle, buttonLabel, landed, spin }: ReelProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const [blurred, setBlurred] = useState(false)

  // Drive the strip with a single decelerating transform transition: fast
  // start, long ease-out, slight overshoot so the reel settles with a thunk.
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!spin || !strip) return
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
        <div className="bom-reelStrip">
          <ReelCell variant={idle} buttonLabel={buttonLabel} />
        </div>
      )}
    </div>
  )
}

function ReelCell({
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

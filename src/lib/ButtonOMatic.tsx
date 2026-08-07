import {
  useCallback,
  useEffect,
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
  spinDuration = 1600,
  reelStagger = 550,
  jackpotDuration = 1600,
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
  const [landedCount, setLandedCount] = useState(0)
  const [count, setCount] = useState(0)
  const [leverPulled, setLeverPulled] = useState(false)
  const [machineGone, setMachineGone] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
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
    const spin = reduced ? 200 : spinDuration
    const stagger = reduced ? 60 : reelStagger
    const hold = reduced ? 400 : jackpotDuration

    setWinner(picked)
    setPhase('rolling')
    setLandedCount(0)
    setLeverPulled(true)
    onPull?.()

    schedule(() => setLeverPulled(false), 550)
    for (let i = 0; i < reels; i++) {
      schedule(() => setLandedCount(i + 1), spin + i * stagger)
    }
    const allLanded = spin + (reels - 1) * stagger + 380
    schedule(() => {
      setPhase('jackpot')
      onReveal?.(picked)
    }, allLanded)
    schedule(() => setPhase('revealed'), allLanded + hold)
    schedule(() => setMachineGone(true), allLanded + hold + 450)
  }, [
    phase,
    disabled,
    winnerId,
    pickWinner,
    variants,
    spinDuration,
    reelStagger,
    jackpotDuration,
    reels,
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

  const showMachine = !machineGone && phase !== 'revealed' ? true : !machineGone
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
      {showMachine && (
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
                  index={i}
                  variants={variants}
                  buttonLabel={buttonLabel}
                  winner={winner}
                  spinning={phase === 'rolling' && landedCount <= i}
                  landed={
                    (phase === 'rolling' && landedCount > i) ||
                    phase === 'jackpot' ||
                    phase === 'revealed'
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

interface ReelProps {
  index: number
  variants: ButtonOMaticVariant[]
  buttonLabel: string
  winner: ButtonOMaticVariant | null
  spinning: boolean
  landed: boolean
}

function Reel({ index, variants, buttonLabel, winner, spinning, landed }: ReelProps) {
  // Two copies of the sequence make the -50% translate loop seamless.
  const loop = [...variants, ...variants]
  const idle = variants[index % variants.length]

  return (
    <div className="bom-reel">
      {landed && winner ? (
        <div className="bom-reelStrip bom-reelStrip--landed" key={`landed-${winner.id}`}>
          <ReelCell variant={winner} buttonLabel={buttonLabel} />
        </div>
      ) : spinning ? (
        <div
          className="bom-reelStrip bom-reelStrip--spinning"
          style={{ animationDuration: `${0.32 + index * 0.06}s` }}
        >
          {loop.map((v, i) => (
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConfettiBurst } from './Confetti'
import { Lever } from './Lever'
import { Marquee } from './Marquee'
import { Reel } from './Reel'
import { RevealedButton } from './RevealedButton'
import { readPersisted, writePersisted } from './persistence'
import type {
  ButtonOMaticPhase,
  ButtonOMaticProps,
  ButtonOMaticVariant,
} from './types'
import { prefersReducedMotion, randomVariant, resolveText } from './utils'
import './button-o-matic.css'

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
          <Marquee text={marqueeText} palette={palette} />

          <div className="bom-machine">
            <div className="bom-machineName">{machineName}</div>

            <div className="bom-window">
              <span className="bom-payline bom-payline--left" aria-hidden="true" />
              {Array.from({ length: reels }, (_, i) => (
                <Reel
                  key={i}
                  index={i}
                  idle={variants[i % variants.length]}
                  above={variants[(i + variants.length - 1) % variants.length]}
                  below={variants[(i + 1) % variants.length]}
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

            <Lever
              pulled={leverPulled}
              disabled={disabled || phase !== 'idle'}
              label={leverLabel}
              onPull={pull}
            />

            {confetti && phase === 'jackpot' && <ConfettiBurst colors={palette} />}
          </div>
        </div>
      )}

      {showRevealed &&
        (renderRevealed ? (
          renderRevealed({ winner: winner!, count, click, reset })
        ) : (
          <RevealedButton
            winner={winner!}
            count={count}
            buttonLabel={buttonLabel}
            buttonType={buttonType}
            disabled={disabled}
            winnerText={winnerText}
            clicksText={clicksText}
            resetText={resetText}
            onClick={click}
            onReset={reset}
          />
        ))}
    </div>
  )
}

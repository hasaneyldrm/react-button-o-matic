import type { CSSProperties, ReactNode } from 'react'

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

export interface WinnerContext {
  winner: ButtonOMaticVariant
}

export interface ClicksContext extends WinnerContext {
  count: number
}

export type TextOrFn<C> = string | ((ctx: C) => string)

/** One reel's plan for a single pull. */
export interface ReelSpin {
  id: number
  seq: ButtonOMaticVariant[]
  duration: number
}

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

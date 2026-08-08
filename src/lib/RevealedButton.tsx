import type { ButtonOMaticVariant, ClicksContext, TextOrFn, WinnerContext } from './types'
import { resolveText } from './utils'

export interface RevealedButtonProps {
  winner: ButtonOMaticVariant
  count: number
  buttonLabel: string
  buttonType: 'button' | 'submit'
  disabled: boolean
  winnerText: TextOrFn<WinnerContext>
  clicksText: TextOrFn<ClicksContext>
  resetText: string | null
  onClick: () => void
  onReset: () => void
}

export function RevealedButton({
  winner,
  count,
  buttonLabel,
  buttonType,
  disabled,
  winnerText,
  clicksText,
  resetText,
  onClick,
  onReset,
}: RevealedButtonProps) {
  return (
    <div className="bom-revealed">
      <button
        type={buttonType}
        className="bom-winnerButton"
        style={{ background: winner.background, color: winner.color ?? '#ffffff' }}
        onClick={onClick}
        disabled={disabled}
      >
        {winner.label ?? buttonLabel}
      </button>
      <p className="bom-caption" role="status" aria-live="polite">
        {count > 0
          ? resolveText(clicksText, { winner, count })
          : resolveText(winnerText, { winner })}
      </p>
      {resetText !== null && (
        <button type="button" className="bom-reset" onClick={onReset}>
          {resetText}
        </button>
      )}
    </div>
  )
}

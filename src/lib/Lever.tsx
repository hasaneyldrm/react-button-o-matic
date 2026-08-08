export interface LeverProps {
  pulled: boolean
  disabled: boolean
  label: string
  onPull: () => void
}

export function Lever({ pulled, disabled, label, onPull }: LeverProps) {
  return (
    <button
      type="button"
      className={`bom-lever${pulled ? ' bom-lever--pulled' : ''}`}
      onClick={onPull}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <span className="bom-leverTrack" aria-hidden="true" />
      <span className="bom-leverArm" aria-hidden="true">
        <span className="bom-leverKnob" />
      </span>
    </button>
  )
}

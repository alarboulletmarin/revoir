interface ProgressBarProps {
  /** Valeur de 0 à 100. */
  value: number
  label?: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <div className="progress">
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progression'}
      >
        <div className="progress__fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="progress__value">{clamped}&nbsp;%</span>
    </div>
  )
}

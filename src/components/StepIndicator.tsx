interface Props {
  steps: readonly string[]
  currentStep: number
  onStepClick?: (index: number) => void
}

export function StepIndicator({ steps, currentStep, onStepClick }: Props) {
  return (
    <nav className="step-indicator" aria-label="作成ステップ">
      {steps.map((step, i) => {
        const state = i === currentStep ? 'active' : i < currentStep ? 'done' : ''
        const clickable = i !== currentStep && onStepClick
        const inner = (
          <>
            <span className="step-num">{i + 1}</span>
            <span className="step-label">{step}</span>
          </>
        )
        return (
          <div key={step} className="step-item-wrapper">
            {clickable ? (
              <button
                className={`step-item ${state} step-item-btn`}
                onClick={() => onStepClick(i)}
                aria-current={undefined}
              >
                {inner}
              </button>
            ) : (
              <div className={`step-item ${state}`} aria-current={i === currentStep ? 'step' : undefined}>
                {inner}
              </div>
            )}
            {i < steps.length - 1 && (
              <span className="step-arrow" aria-hidden="true">›</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

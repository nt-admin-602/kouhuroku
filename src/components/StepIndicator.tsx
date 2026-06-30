interface Props {
  steps: readonly string[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: Props) {
  return (
    <nav className="step-indicator" aria-label="作成ステップ">
      {steps.map((step, i) => {
        const state = i === currentStep ? 'active' : i < currentStep ? 'done' : ''
        return (
          <div key={step} className="step-item-wrapper">
            <div className={`step-item ${state}`} aria-current={i === currentStep ? 'step' : undefined}>
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{step}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="step-arrow" aria-hidden="true">›</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

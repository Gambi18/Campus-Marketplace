interface ListingProgressProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { step: 1, label: 'Upload Photos' },
  { step: 2, label: 'Item Details' },
  { step: 3, label: 'Pricing & Location' },
] as const;

export default function ListingProgress({ currentStep }: ListingProgressProps) {
  const active = STEPS.find((s) => s.step === currentStep);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-3xl font-bold text-brand-neutral">List Your Item</h1>
        <p className="text-text-muted text-sm mt-1">
          Step {currentStep} of 3 — {active?.label}
        </p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${step <= currentStep ? 'bg-brand-primary' : 'bg-blue-100'
              }`}
          />
        ))}
      </div>
    </div>
  );
}

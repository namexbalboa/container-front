"use client";

import { ReactNode } from "react";
import { CheckCircle2, Circle } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface StepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowStepClick?: boolean;
}

export function StepWizard({
  steps,
  currentStep,
  onStepClick,
  allowStepClick = false
}: StepWizardProps) {
  const handleStepClick = (index: number) => {
    if (allowStepClick && onStepClick && index < currentStep) {
      onStepClick(index);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-stretch gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = allowStepClick && index < currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-stretch">
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={`
                  flex flex-1 items-center gap-3 py-4 px-4 transition-all relative border-b-4
                  disabled:opacity-100
                  ${
                    isActive
                      ? "border-emerald-600 bg-emerald-50"
                      : isCompleted
                        ? "border-emerald-400 bg-white"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }
                  ${isClickable ? "cursor-pointer" : "cursor-default"}
                `}
              >
                <div
                  className={`
                    flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all
                    ${
                      isActive
                        ? "border-emerald-600 bg-white text-emerald-600 shadow-md ring-4 ring-emerald-100"
                        : isCompleted
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                          : "border-zinc-300 bg-white text-zinc-400"
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-base font-semibold">{index + 1}</span>
                  )}
                </div>

                <div className="text-left flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isActive ? "text-emerald-700" : isCompleted ? "text-emerald-600" : "text-zinc-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p
                      className={`text-xs mt-0.5 truncate ${
                        isActive ? "text-emerald-600" : isCompleted ? "text-emerald-500" : "text-zinc-400"
                      }`}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StepWizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
}

export function StepWizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  canGoNext = true,
  isSubmitting = false,
  nextLabel = "Próximo",
  submitLabel = "Finalizar",
}: StepWizardNavigationProps) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Voltar
      </button>

      <div className="text-sm text-zinc-600">
        Passo {currentStep + 1} de {totalSteps}
      </div>

      {!isLastStep ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canGoNext || isSubmitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Processando..." : submitLabel}
        </button>
      )}
    </div>
  );
}

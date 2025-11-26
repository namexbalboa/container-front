"use client";

import { useState } from "react";
import { StepWizard, StepWizardNavigation, WizardStep } from "@/components/shared/StepWizard";
import { AverbacaoCreate, Cliente, Seguradora, ContainerTrip } from "@/types/api";
import { WizardLoading } from "@/components/shared/WizardLoading";

import { Step1InfoGerais } from "./wizard/Step1InfoGerais";
import Step2SelectTrips from "./wizard/Step2SelectTrips";
import { Step3SelectContainers } from "./wizard/Step3SelectContainers";
import { Step4ResumoCalculo } from "./wizard/Step4ResumoCalculo";
import { Step5Emissao } from "./wizard/Step5Emissao";

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "info-gerais",
    title: "Informações Gerais",
    description: "Empresa, seguradora e período",
  },
  {
    id: "selecao-viagens",
    title: "Seleção de Viagens",
    description: "Escolha as viagens",
  },
  {
    id: "selecao-containers",
    title: "Seleção de Containers",
    description: "Escolha os containers",
  },
  {
    id: "resumo-calculo",
    title: "Resumo de Cálculo",
    description: "Conferir valores",
  },
  {
    id: "emissao",
    title: "Emissão",
    description: "Finalizar averbação",
  },
];

export interface ContainerTripSelection {
  idContainerTrip: number;
  numeroContainer: string;
  navio?: string;
  viagem?: string;
  portoOrigem?: string;
  portoDestino?: string;
  dataEmbarque?: string;
  dataChegadaPrevista?: string;
  valorMercadoria?: number;
  valorPremio?: number;
  tipoContainer?: string;
}

interface AverbacaoWizardData {
  // Step 1 - Informações Gerais
  clienteId: number | null;
  seguradoraId: number | null;
  apoliceId: number | null;
  periodoInicio: string;
  periodoFim: string;
  numero?: string;
  observacoes?: string;

  // Step 2 - Seleção de Viagens (NOVO)
  selectedTrips: ContainerTrip[];

  // Step 3 - Seleção de Containers (antigo Step 2)
  containerTrips: ContainerTripSelection[];

  // Step 4 - Resumo de Cálculo (antigo Step 3, computed)
  valorMercadoriaTotal: number;
  valorPremioTotal: number;
}

interface AverbacaoWizardProps {
  onSubmit: (data: AverbacaoCreate) => Promise<void>;
  onCancel?: () => void;
}

export function AverbacaoWizard({ onSubmit, onCancel }: AverbacaoWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [wizardData, setWizardData] = useState<AverbacaoWizardData>({
    clienteId: null,
    apoliceId: null,
    seguradoraId: null,
    periodoInicio: "",
    periodoFim: "",
    numero: "",
    observacoes: "",
    selectedTrips: [],  // NOVO - Step 2
    containerTrips: [],
    valorMercadoriaTotal: 0,
    valorPremioTotal: 0,
  });

  const updateWizardData = (data: Partial<AverbacaoWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const canGoToStep2 = () => {
    return (
      wizardData.clienteId !== null &&
      wizardData.seguradoraId !== null &&
      wizardData.periodoInicio !== "" &&
      wizardData.periodoFim !== ""
    );
  };

  const canGoToStep3 = () => {
    return wizardData.selectedTrips.length > 0;
  };

  const canGoToStep4 = () => {
    return wizardData.containerTrips.length > 0;
  };

  const canGoToStep5 = () => {
    return true; // Step 4 is just review
  };

  const canSubmit = () => {
    return canGoToStep2() && canGoToStep3() && canGoToStep4();
  };

  const calculateTotals = () => {
    const valorMercadoriaTotal = wizardData.containerTrips.reduce(
      (sum, ct) => sum + (ct.valorMercadoria || 0),
      0
    );

    const valorPremioTotal = wizardData.containerTrips.reduce(
      (sum, ct) => sum + (ct.valorPremio || 0),
      0
    );

    return { valorMercadoriaTotal, valorPremioTotal };
  };

  const handleNext = async (skipValidation = false) => {
    // Validações apenas se não for skip (Step2 faz sua própria validação)
    if (!skipValidation) {
      if (currentStep === 0 && !canGoToStep2()) return;
      if (currentStep === 1 && !canGoToStep3()) return;
      if (currentStep === 2 && !canGoToStep4()) return;
      if (currentStep === 3 && !canGoToStep5()) return;
    }

    // Mostrar loading
    setIsTransitioning(true);

    // Scroll para o topo imediatamente
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Aguardar um mínimo de 1.8 segundos para o loading
    const startTime = Date.now();

    // Quando avançar do step 3 para o step 4, calcular totais
    if (currentStep === 2) {
      const totals = calculateTotals();
      setWizardData((prev) => ({ ...prev, ...totals }));
    }

    // Garantir que o loading seja exibido por pelo menos 1.8 segundos
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 1800 - elapsed);

    await new Promise(resolve => setTimeout(resolve, remaining));

    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));

    // Esconder loading
    setIsTransitioning(false);

    // Garantir scroll para o topo após a transição completar
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));

    // Scroll para o topo
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);

      // Scroll para o topo
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
      console.log("📦 Dados do wizard antes de enviar:", {
        totalContainerTrips: wizardData.containerTrips.length,
        primeiros3: wizardData.containerTrips.slice(0, 3)
      });
    try {
      const payload: AverbacaoCreate = {
        clienteId: wizardData.clienteId!,
        seguradoraId: wizardData.seguradoraId || undefined,
        apoliceId: wizardData.apoliceId || undefined,
        periodoInicio: wizardData.periodoInicio,
        periodoFim: wizardData.periodoFim,
        numero: wizardData.numero || undefined,
        observacoes: wizardData.observacoes || undefined,
        ceContainerIds: wizardData.containerTrips.map((ct) => ct.idContainerTrip),
        valorMercadoriaTotal: wizardData.valorMercadoriaTotal,
        valorPremioTotal: wizardData.valorPremioTotal,
      };

      console.log("🚀 Enviando averbação:", {
        totalCeContainerIds: payload.ceContainerIds.length,
        valorMercadoriaTotal: payload.valorMercadoriaTotal,
        valorPremioTotal: payload.valorPremioTotal,
        primeiros10Ids: payload.ceContainerIds.slice(0, 10)
      });

      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCanGoNext = () => {
    if (currentStep === 0) return canGoToStep2();
    if (currentStep === 1) return canGoToStep3();
    if (currentStep === 2) return canGoToStep4();
    if (currentStep === 3) return canGoToStep5();
    return false;
  };

  return (
    <>
      <WizardLoading isLoading={isTransitioning} />

      <div className="space-y-6">
        <StepWizard
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowStepClick={true}
        />

        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="min-h-[400px] p-6">
          {currentStep === 0 && (
            <Step1InfoGerais
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}

          {currentStep === 1 && (
            <Step2SelectTrips
              clienteId={wizardData.clienteId}
              periodoInicio={wizardData.periodoInicio}
              periodoFim={wizardData.periodoFim}
              selectedTrips={wizardData.selectedTrips}
              onUpdate={updateWizardData}
              onNext={handleNext}
              onBack={handlePrevious}
              isTransitioning={isTransitioning}
            />
          )}

          {currentStep === 2 && (
            <Step3SelectContainers
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}

          {currentStep === 3 && (
            <Step4ResumoCalculo
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}

          {currentStep === 4 && (
            <Step5Emissao
              data={wizardData}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Step 2 and Step 5 have their own navigation, so hide default navigation */}
        {currentStep !== 1 && currentStep !== 4 && (
          <StepWizardNavigation
            currentStep={currentStep}
            totalSteps={WIZARD_STEPS.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === WIZARD_STEPS.length - 1}
            canGoNext={getCanGoNext()}
            isSubmitting={isSubmitting}
            submitLabel="Criar Averbação"
          />
        )}
      </div>
      </div>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";

import { useAlert } from "@/contexts/AlertContext";
import { useLoading } from "@/contexts/LoadingContext";
import { apiService } from "@/lib/api";
import { gerarPDFAverbacao } from "@/lib/pdf/averbacao-pdf";
import type { AverbacaoCreate } from "@/types/api";

import { AverbacaoWizard } from "../components/AverbacaoWizard";

export default function NovaAverbacaoPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { showLoading, hideLoading } = useLoading();

  const handleCreate = async (payload: AverbacaoCreate): Promise<void> => {
    // Mostrar loading
    showLoading();

    try {
      const response = await apiService.createAverbacao(payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Erro ao criar averbação");
      }

      const novaAverbacao = response.data;

      // Buscar o relatório da averbação para gerar o PDF
      try {
        const relatorioResponse = await apiService.getRelatorioAverbacao(novaAverbacao.idAverbacao);
        if (relatorioResponse.success && relatorioResponse.data) {
          // Gerar e baixar o PDF
          gerarPDFAverbacao(relatorioResponse.data);
        }
      } catch (pdfError) {
        console.error("Erro ao gerar PDF:", pdfError);
        // Não bloqueia o fluxo se o PDF falhar
      }

      // Aguardar um pouco antes de redirecionar para que o loading seja visível
      await new Promise(resolve => setTimeout(resolve, 500));

      showAlert("success", "Averbação criada com sucesso.");
      router.push(`/averbacoes/${novaAverbacao.idAverbacao}`);
    } finally {
      // O hideLoading será gerenciado pelo LoadingContext com o tempo mínimo
      hideLoading();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Nova Averbação</h1>
        <p className="text-sm text-zinc-600">
          Siga os passos abaixo para criar uma nova averbação de forma organizada.
        </p>
      </div>

      <AverbacaoWizard onSubmit={handleCreate} />
    </div>
  );
}


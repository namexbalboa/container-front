"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import type { Averbacao, AverbacaoUpdate } from "@/types/api";

import { AverbacaoForm } from "../../components/AverbacaoForm";

export default function EditarAverbacaoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [averbacao, setAverbacao] = useState<Averbacao | null>(null);
  const [loading, setLoading] = useState(true);

  const averbacaoId = Number(params?.id);

  useEffect(() => {
    const loadAverbacao = async () => {
      if (!averbacaoId || Number.isNaN(averbacaoId)) return;

      setLoading(true);
      try {
        const response = await apiService.getAverbacao(averbacaoId);
        if (!response.success || !response.data) {
          throw new Error(response.error || "Averbação não encontrada");
        }
        setAverbacao(response.data);
      } catch (error) {
        console.error("Erro ao carregar averbação:", error);
        showAlert("error", "Não foi possível carregar a averbação para edição.");
      } finally {
        setLoading(false);
      }
    };

    loadAverbacao();
  }, [averbacaoId, showAlert]);

  const handleUpdate = async (payload: AverbacaoUpdate) => {
    if (!averbacaoId) return;

    const response = await apiService.updateAverbacao(averbacaoId, payload);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Erro ao atualizar averbação");
    }

    showAlert("success", "Averbação atualizada com sucesso.");
    router.push(`/averbacoes/${averbacaoId}`);
    return response.data;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-sm text-zinc-500">Carregando averbação...</div>
      </div>
    );
  }

  if (!averbacao) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">Averbação não encontrada</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Verifique se o endereço está correto ou retorne para a página anterior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Editar averbação {averbacao.numero ?? `#${averbacao.idAverbacao}`}
        </h1>
        <p className="text-sm text-zinc-600">
          Ajuste o período, seguradora ou observações desta averbação consolidada.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <AverbacaoForm mode="edit" initialData={averbacao} onSubmit={handleUpdate} />
      </div>
    </div>
  );
}


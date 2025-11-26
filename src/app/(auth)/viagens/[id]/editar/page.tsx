"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { useApi } from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import { ContainerTrip, ContainerTripUpdate } from "@/types/api";
import type { ModuloSistema } from "@/types/api";
import { ViagemForm } from "../../components/ViagemForm";

export default function EditarViagemPage() {
  const router = useRouter();
  const params = useParams();
  const api = useApi();
  const { showAlert } = useAlert();
  const { permissions, canUpdate, canManage } = usePermissions();

  const viagemId = Number(params.id);

  const [viagem, setViagem] = useState<ContainerTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tripModules: ModuloSistema[] = ["CONTAINERS"];
  const enforcePermissions = permissions.length > 0;
  const canModifyTrip = tripModules.some((module) => canUpdate(module) || canManage(module));
  const hasUpdatePermission = enforcePermissions ? canModifyTrip : true;

  const fetchViagem = useCallback(async () => {
    if (!hasUpdatePermission) {
      setLoading(false);
      return;
    }

    if (Number.isNaN(viagemId)) {
      setError("Identificador da viagem inválido.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.getTrip(viagemId);

      if (response.success && response.data) {
        setViagem(response.data);
        setError(null);
      } else {
        throw new Error(response.message || "Não foi possível carregar a viagem.");
      }
    } catch (err) {
      console.error("Erro ao carregar viagem:", err);
      setError(err instanceof Error ? err.message : "Erro inesperado ao carregar a viagem.");
    } finally {
      setLoading(false);
    }
  }, [api, viagemId, hasUpdatePermission]);

  useEffect(() => {
    fetchViagem();
  }, [fetchViagem]);

  const handleSubmit = async (data: ContainerTripUpdate) => {
    try {
      const response = await api.updateTrip(viagemId, data);

      if (!response.success) {
        throw new Error(response.message || "Não foi possível atualizar a viagem.");
      }

      showAlert("success", "Viagem atualizada com sucesso!");
      router.push(`/viagens/${viagemId}`);
    } catch (err) {
      console.error("Erro ao atualizar viagem:", err);
      const message = err instanceof Error ? err.message : "Erro inesperado ao atualizar a viagem.";
      showAlert("error", message);
      throw err;
    }
  };

  if (!hasUpdatePermission) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Acesso negado</h2>
          <p className="text-sm text-gray-600">
            Você não tem permissão para editar viagens de containers.
          </p>
        </div>
        <Button onClick={() => router.push("/viagens")}>Voltar para viagens</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
        <p className="text-sm text-gray-600">Carregando informações da viagem...</p>
      </div>
    );
  }

  if (error || !viagem) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Não foi possível carregar a viagem</h2>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/viagens")}>Voltar</Button>
          <Button variant="outline" onClick={fetchViagem}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className=""
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar viagem</h1>
          <p className="text-sm text-gray-600">
            {viagem.numeroCE || viagem.numeroConhecimento || `ID ${viagem.idContainerTrip}`}
          </p>
        </div>
      </div>

      <ViagemForm
        viagem={viagem}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}

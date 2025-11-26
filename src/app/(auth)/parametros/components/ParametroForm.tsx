"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import {
  CreateParametroSeguroData,
  UpdateParametroSeguroData,
  Modal,
} from "@/types/parametro-seguro";
import { ContainerTipo } from "@/types/api";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface ParametroFormProps {
  parametroId?: number;
}

export function ParametroForm({ parametroId }: ParametroFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [tiposContainer, setTiposContainer] = useState<ContainerTipo[]>([]);

  const [formData, setFormData] = useState<
    CreateParametroSeguroData | UpdateParametroSeguroData
  >({
    nome: "",
    descricao: "",
    taxaSeguro: 0,
    taxaPremio: 0,
    taxaIof: 7.38, // Padrão 7.38%
    adicionalFracionamento: 0,
    custoApolice: 0,
    valorMinimoSeguro: undefined,
    valorMaximoSeguro: undefined,
    modalTransporte: undefined,
    vigenciaInicio: undefined,
    vigenciaFim: undefined,
    ativo: true,
  });

  useEffect(() => {
    loadTiposContainer();
    if (parametroId) {
      loadParametro();
    }
  }, [parametroId]);

  const loadTiposContainer = async () => {
    try {
      setLoadingTipos(true);
      const response = await apiService.getContainerTipos({ page: 1, limit: 100 });
      if (response.success && response.data) {
        // A resposta vem em data.items, não data.data
        setTiposContainer(response.data.items || response.data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar tipos de container:", error);
      setTiposContainer([]);
    } finally {
      setLoadingTipos(false);
    }
  };

  const loadParametro = async () => {
    if (!parametroId) return;

    try {
      setLoading(true);
      const response = await apiService.getParametroSeguroById(parametroId);
      if (response.success && response.data) {
        // A resposta pode vir em data.data ou diretamente em data
        const p = response.data.data || response.data;

        if (!p || !p.nome) {
          throw new Error("Dados do parâmetro inválidos");
        }

        setFormData({
          nome: p.nome,
          descricao: p.descricao || "",
          idTipoContainer: p.idTipoContainer || undefined,
          taxaSeguro: Number(p.taxaSeguro),
          taxaPremio: Number(p.taxaPremio),
          taxaIof: Number(p.taxaIof),
          adicionalFracionamento: p.adicionalFracionamento
            ? Number(p.adicionalFracionamento)
            : undefined,
          custoApolice: Number(p.custoApolice),
          valorMinimoSeguro: p.valorMinimoSeguro
            ? Number(p.valorMinimoSeguro)
            : undefined,
          valorMaximoSeguro: p.valorMaximoSeguro
            ? Number(p.valorMaximoSeguro)
            : undefined,
          modalTransporte: p.modalTransporte || undefined,
          vigenciaInicio: p.vigenciaInicio
            ? p.vigenciaInicio.split("T")[0]
            : undefined,
          vigenciaFim: p.vigenciaFim ? p.vigenciaFim.split("T")[0] : undefined,
          ativo: p.ativo,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar parâmetro:", error);
      alert("Erro ao carregar parâmetro");
      router.push("/parametros");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações
      if (!formData.nome) {
        alert("Nome é obrigatório");
        return;
      }

      if (formData.taxaSeguro < 0 || formData.taxaSeguro > 100) {
        alert("Taxa de seguro deve estar entre 0 e 100");
        return;
      }

      if (formData.taxaPremio < 0 || formData.taxaPremio > 100) {
        alert("Taxa de prêmio deve estar entre 0 e 100");
        return;
      }

      // Preparar dados
      const data = {
        ...formData,
        idTipoContainer: formData.idTipoContainer || undefined,
        adicionalFracionamento: formData.adicionalFracionamento || undefined,
        valorMinimoSeguro: formData.valorMinimoSeguro || undefined,
        valorMaximoSeguro: formData.valorMaximoSeguro || undefined,
        vigenciaInicio: formData.vigenciaInicio || undefined,
        vigenciaFim: formData.vigenciaFim || undefined,
      };

      if (parametroId) {
        await apiService.updateParametroSeguro(parametroId, data);
      } else {
        await apiService.createParametroSeguro(data);
      }

      router.push("/parametros");
    } catch (error: any) {
      console.error("Erro ao salvar parâmetro:", error);
      alert(error.response?.data?.message || "Erro ao salvar parâmetro");
    } finally {
      setLoading(false);
    }
  };

  if (loadingTipos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/parametros")}
            className="rounded-md p-2 text-zinc-600 transition hover:bg-zinc-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {parametroId ? "Editar" : "Novo"} Parâmetro
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Configure as taxas e valores para cálculo de seguro
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar
            </>
          )}
        </button>
      </div>

      {/* Informações Básicas */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Informações Básicas
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              rows={3}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Tipo de Container
            </label>
            <select
              value={formData.idTipoContainer || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  idTipoContainer: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Todos os tipos</option>
              {tiposContainer.map((tipo) => (
                <option key={tipo.idTipoContainer} value={tipo.idTipoContainer}>
                  {tipo.tipoContainer}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Modal de Transporte
            </label>
            <select
              value={formData.modalTransporte || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  modalTransporte: (e.target.value as Modal) || undefined,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Todos os modais</option>
              <option value="M">Marítimo</option>
              <option value="T">Terrestre</option>
              <option value="A">Aéreo</option>
            </select>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) =>
                setFormData({ ...formData, ativo: e.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-zinc-700">
              Parâmetro ativo
            </label>
          </div>
        </div>
      </div>

      {/* Taxas e Percentuais */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Taxas e Percentuais
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Taxa de Seguro (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxaSeguro}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  taxaSeguro: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Taxa de Prêmio (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxaPremio}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  taxaPremio: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Taxa IOF (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxaIof}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  taxaIof: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <p className="mt-1 text-xs text-zinc-500">Padrão: 7.38%</p>
          </div>
        </div>
      </div>

      {/* Valores Adicionais */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Valores Adicionais
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Adicional de Fracionamento (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.adicionalFracionamento || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  adicionalFracionamento: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Custo da Apólice (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.custoApolice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  custoApolice: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Valor Mínimo Seguro (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.valorMinimoSeguro || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valorMinimoSeguro: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Valor Máximo Seguro (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.valorMaximoSeguro || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valorMaximoSeguro: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>
      </div>

      {/* Vigência */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Período de Vigência
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={formData.vigenciaInicio || ""}
              onChange={(e) =>
                setFormData({ ...formData, vigenciaInicio: e.target.value || undefined })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={formData.vigenciaFim || ""}
              onChange={(e) =>
                setFormData({ ...formData, vigenciaFim: e.target.value || undefined })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Deixe em branco para vigência indefinida
        </p>
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import {
  CreateParametroSeguroData,
  UpdateParametroSeguroData,
  Modal,
} from "@/types/parametro-seguro";
import { ContainerTipo } from "@/types/api";
import { ArrowLeft, Save, Loader2, Check } from "lucide-react";
import { useAlert } from "@/contexts/AlertContext";

interface ParametroFormProps {
  parametroId?: number;
}

// Mapeamento de prefixo do código para nome de categoria
const CATEGORY_MAP: Record<string, string> = {
  DC: "Dry Container",
  HC: "High Cube",
  OT: "Open Top",
  FR: "Flat Rack",
  PL: "Platform",
  TK: "Tank",
  RF: "Refrigerado",
  SD: "Side Door",
  DD: "Double Door",
  VT: "Ventilado",
  IN: "Isolado",
  BK: "Graneleiro",
  HH: "Meia Altura",
  PW: "Pallet Wide",
  SW: "Swap Body",
};

function getCategoryPrefix(tipoContainer: string): string {
  return tipoContainer.replace(/\d+/g, "");
}

function getSize(tipoContainer: string): string {
  const match = tipoContainer.match(/\d+/);
  return match ? match[0] : "";
}

export function ParametroForm({ parametroId }: ParametroFormProps) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [tiposContainer, setTiposContainer] = useState<ContainerTipo[]>([]);
  const [selectedTipoIds, setSelectedTipoIds] = useState<number[]>([]);

  const isEditMode = !!parametroId;

  const [formData, setFormData] = useState<
    CreateParametroSeguroData | UpdateParametroSeguroData
  >({
    nome: "",
    descricao: "",
    taxaSeguro: 0,
    taxaPremio: 0,
    taxaIof: 7.38,
    adicionalFracionamento: 0,
    custoApolice: 0,
    valorMinimoSeguro: undefined,
    valorMaximoSeguro: undefined,
    modalTransporte: undefined,
    vigenciaInicio: undefined,
    vigenciaFim: undefined,
    ativo: true,
  });

  // Agrupar tipos por categoria
  const groupedTipos = useMemo(() => {
    const groups: Record<string, ContainerTipo[]> = {};
    for (const tipo of tiposContainer) {
      const prefix = getCategoryPrefix(tipo.tipoContainer);
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(tipo);
    }
    // Ordenar dentro de cada grupo pelo código
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.tipoContainer.localeCompare(b.tipoContainer));
    }
    return groups;
  }, [tiposContainer]);

  // Tamanhos disponíveis
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    for (const tipo of tiposContainer) {
      sizes.add(getSize(tipo.tipoContainer));
    }
    return Array.from(sizes).sort((a, b) => Number(a) - Number(b));
  }, [tiposContainer]);

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
      const response = await apiService.getParametroSeguroGeralById(parametroId);
      if (response.success && response.data) {
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
      showAlert("Erro ao carregar parâmetro");
      router.push("/parametros");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers de seleção de tipos ---

  const toggleTipo = (id: number) => {
    setSelectedTipoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedTipoIds(tiposContainer.map((t) => t.idTipoContainer));
  };

  const clearAll = () => {
    setSelectedTipoIds([]);
  };

  const selectBySize = (size: string) => {
    const ids = tiposContainer
      .filter((t) => getSize(t.tipoContainer) === size)
      .map((t) => t.idTipoContainer);
    setSelectedTipoIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id));
      }
      return [...new Set([...prev, ...ids])];
    });
  };

  const selectByCategory = (prefix: string) => {
    const ids = (groupedTipos[prefix] || []).map((t) => t.idTipoContainer);
    setSelectedTipoIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id));
      }
      return [...new Set([...prev, ...ids])];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.nome) {
        showAlert("Nome é obrigatório");
        return;
      }

      if (formData.taxaSeguro < 0 || formData.taxaSeguro > 100) {
        showAlert("Taxa de seguro deve estar entre 0 e 100");
        return;
      }

      if (formData.taxaPremio < 0 || formData.taxaPremio > 100) {
        showAlert("Taxa de prêmio deve estar entre 0 e 100");
        return;
      }

      const baseData = {
        ...formData,
        adicionalFracionamento: formData.adicionalFracionamento || undefined,
        valorMinimoSeguro: formData.valorMinimoSeguro || undefined,
        valorMaximoSeguro: formData.valorMaximoSeguro || undefined,
        vigenciaInicio: formData.vigenciaInicio || undefined,
        vigenciaFim: formData.vigenciaFim || undefined,
      };

      if (isEditMode) {
        // Modo edição: atualiza apenas o parâmetro único
        await apiService.updateParametroSeguroGeral(parametroId!, baseData);
        showAlert("Parâmetro atualizado com sucesso.", "success");
      } else if (selectedTipoIds.length === 0) {
        // Nenhum tipo selecionado: cria parâmetro genérico
        const { idTipoContainer, ...dataWithoutTipo } = baseData;
        await apiService.createParametroSeguroGeral(dataWithoutTipo as CreateParametroSeguroData);
        showAlert("Parâmetro criado com sucesso.", "success");
      } else if (selectedTipoIds.length === 1) {
        // Um único tipo: cria normalmente
        await apiService.createParametroSeguroGeral({
          ...baseData,
          idTipoContainer: selectedTipoIds[0],
        } as CreateParametroSeguroData);
        showAlert("Parâmetro criado com sucesso.", "success");
      } else {
        // Múltiplos tipos: batch
        const { idTipoContainer, ...batchBase } = baseData;
        const response = await apiService.createParametrosSeguroBatch({
          ...batchBase as CreateParametroSeguroData,
          idsTipoContainer: selectedTipoIds,
        });
        if (response.success && response.data) {
          const { created, errors } = response.data;
          if (errors > 0) {
            showAlert(`${created} parâmetro(s) criado(s), ${errors} erro(s).`);
          } else {
            showAlert(`${created} parâmetro(s) criado(s) com sucesso.`, "success");
          }
        }
      }

      router.push("/parametros");
    } catch (error: any) {
      console.error("Erro ao salvar parâmetro:", error);
      showAlert(error.message || "Erro ao salvar parâmetro");
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

  const inputClass =
    "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200";

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
              {isEditMode ? "Editar" : "Novo"} Parâmetro
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
              {!isEditMode && selectedTipoIds.length > 1 &&
                ` (${selectedTipoIds.length} tipos)`}
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
              className={inputClass}
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
              className={inputClass}
            />
          </div>

          {/* Tipo de Container: dropdown no modo edição, checkboxes no modo criação */}
          {isEditMode ? (
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
                className={inputClass}
              >
                <option value="">Todos os tipos</option>
                {tiposContainer.map((tipo) => (
                  <option key={tipo.idTipoContainer} value={tipo.idTipoContainer}>
                    {tipo.tipoContainer} - {tipo.descricao || tipo.tipoContainer}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-3">
                Tipos de Container
              </label>

              {/* Atalhos rápidos */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={selectAll}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition ${
                    selectedTipoIds.length === tiposContainer.length
                      ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                      : "bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Check className="h-3 w-3 inline mr-1" />
                  Todos
                </button>

                {availableSizes.map((size) => {
                  const sizeIds = tiposContainer
                    .filter((t) => getSize(t.tipoContainer) === size)
                    .map((t) => t.idTipoContainer);
                  const allSelected = sizeIds.every((id) => selectedTipoIds.includes(id));
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => selectBySize(size)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition ${
                        allSelected
                          ? "bg-blue-100 border-blue-400 text-blue-800"
                          : "bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {size} pés
                    </button>
                  );
                })}

                {/* Atalhos de categoria comuns */}
                {["DC", "RF", "HC", "TK", "OT"].map((prefix) => {
                  if (!groupedTipos[prefix]) return null;
                  const catIds = groupedTipos[prefix].map((t) => t.idTipoContainer);
                  const allSelected = catIds.every((id) => selectedTipoIds.includes(id));
                  return (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => selectByCategory(prefix)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition ${
                        allSelected
                          ? "bg-purple-100 border-purple-400 text-purple-800"
                          : "bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {CATEGORY_MAP[prefix] || prefix}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={clearAll}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border bg-zinc-50 border-zinc-300 text-zinc-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition"
                >
                  Limpar
                </button>
              </div>

              {/* Grade de checkboxes por categoria */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto rounded-md border border-zinc-200 p-4">
                {Object.entries(groupedTipos).map(([prefix, tipos]) => (
                  <div key={prefix}>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => selectByCategory(prefix)}
                        className="text-sm font-semibold text-zinc-800 hover:text-emerald-700 transition"
                      >
                        {CATEGORY_MAP[prefix] || prefix}
                      </button>
                      <span className="text-xs text-zinc-400">
                        ({tipos.filter((t) => selectedTipoIds.includes(t.idTipoContainer)).length}/{tipos.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {tipos.map((tipo) => {
                        const isSelected = selectedTipoIds.includes(tipo.idTipoContainer);
                        return (
                          <label
                            key={tipo.idTipoContainer}
                            className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition text-sm ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTipo(tipo.idTipoContainer)}
                              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-2 focus:ring-emerald-200"
                            />
                            <span className="font-mono font-medium">
                              {tipo.tipoContainer}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                {selectedTipoIds.length === 0
                  ? "Nenhum tipo selecionado — será criado parâmetro genérico (todos os tipos)"
                  : `${selectedTipoIds.length} tipo(s) selecionado(s) — será criado um parâmetro para cada tipo`}
              </p>
            </div>
          )}

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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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

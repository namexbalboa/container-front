"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import type { ClienteContainerSeguro } from "@/types/api";
import { Package, Edit, Trash2, Plus, History, AlertCircle } from "lucide-react";
import EditParametroDialog from "./EditParametroDialog";
import { usePermissions } from "@/hooks/use-permissions";

interface ParametrosSeguroTabProps {
  idCliente: number;
  razaoSocial: string;
}

export default function ParametrosSeguroTab({ idCliente, razaoSocial }: ParametrosSeguroTabProps) {
  const { showAlert } = useAlert();
  const { hasPermission } = usePermissions();
  const [parametros, setParametros] = useState<ClienteContainerSeguro[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParametro, setSelectedParametro] = useState<ClienteContainerSeguro | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [historico, setHistorico] = useState<ClienteContainerSeguro[]>([]);
  const [permissionError, setPermissionError] = useState(false);

  const loadParametros = async () => {
    if (!hasPermission("PARAMETROS_SEGURO", "READ")) {
      setPermissionError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPermissionError(false);
    try {
      const response = await apiService.getParametrosSeguroCliente(idCliente);

      if (!response.success) {
        throw new Error(response.message || "Erro ao carregar parâmetros");
      }

      setParametros(response.data || []);
    } catch (error: any) {
      console.error("Erro ao carregar parâmetros:", error);

      if (error.message?.includes("permissão") || error.message?.includes("Acesso negado")) {
        setPermissionError(true);
      } else {
        showAlert(error.message || "Erro ao carregar parâmetros de seguro", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCriarPadrao = async () => {
    if (!hasPermission("PARAMETROS_SEGURO", "CREATE")) {
      showAlert("Você não tem permissão para criar parâmetros de seguro", "error");
      return;
    }

    try {
      const response = await apiService.createParametrosPadrao(idCliente);

      if (!response.success) {
        throw new Error(response.message || "Erro ao criar parâmetros padrão");
      }

      showAlert(`${response.data?.created || 0} parâmetros padrão criados com sucesso!`, "success");
      loadParametros();
    } catch (error: any) {
      console.error("Erro ao criar parâmetros padrão:", error);
      showAlert(error.message || "Erro ao criar parâmetros padrão", "error");
    }
  };

  const handleViewHistorico = async (parametro: ClienteContainerSeguro) => {
    try {
      const response = await apiService.getHistoricoParametroSeguro(
        parametro.idCliente,
        parametro.idTipoContainer
      );

      if (!response.success) {
        throw new Error(response.message || "Erro ao carregar histórico");
      }

      setHistorico(response.data || []);
      setSelectedParametro(parametro);
      setShowHistorico(true);
    } catch (error: any) {
      console.error("Erro ao carregar histórico:", error);
      showAlert(error.message || "Erro ao carregar histórico", "error");
    }
  };

  const handleDelete = async (parametro: ClienteContainerSeguro) => {
    if (!hasPermission("PARAMETROS_SEGURO", "DELETE")) {
      showAlert("Você não tem permissão para excluir parâmetros de seguro", "error");
      return;
    }

    if (!confirm(`Deseja realmente excluir o parâmetro para ${parametro.tipoContainer?.tipoContainer}?`)) {
      return;
    }

    try {
      const response = await apiService.deleteParametroSeguro(
        parametro.idCliente,
        parametro.idTipoContainer
      );

      if (!response.success) {
        throw new Error(response.message || "Erro ao excluir parâmetro");
      }

      showAlert("Parâmetro excluído com sucesso!", "success");
      loadParametros();
    } catch (error: any) {
      console.error("Erro ao excluir parâmetro:", error);
      showAlert(error.message || "Erro ao excluir parâmetro", "error");
    }
  };

  useEffect(() => {
    loadParametros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCliente]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-zinc-500">Carregando parâmetros...</div>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acesso Negado
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-md">
          Você não tem permissão para visualizar os parâmetros de seguro.
          Entre em contato com o administrador do sistema.
        </p>
      </div>
    );
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Parâmetros de Seguro</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Configure as taxas e valores de seguro para cada tipo de container
          </p>
        </div>
        <button
          onClick={handleCriarPadrao}
          disabled={parametros.length > 0}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Criar Parâmetros Padrão
        </button>
      </div>

      {/* Alerta se não houver parâmetros */}
      {parametros.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">
                Nenhum parâmetro configurado
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Esta empresa não possui parâmetros de seguro configurados. Clique em "Criar Parâmetros Padrão"
                para inicializar com valores padrão para todos os tipos de container.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de parâmetros */}
      {parametros.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Tipo Container
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Taxa Seguro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Prêmio Seguro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Valor Container
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Vigência
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Versão
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {parametros.map((parametro) => (
                  <tr key={`${parametro.idCliente}-${parametro.idTipoContainer}-${parametro.versao}`} className="hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-900">
                            {parametro.tipoContainer?.tipoContainer || "N/A"}
                          </div>
                          {parametro.tipoContainer?.descricao && (
                            <div className="text-xs text-zinc-500">
                              {parametro.tipoContainer.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className="text-sm font-medium text-zinc-900">
                        {formatPercent(parametro.taxaSeguro)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-green-700">
                          {formatCurrency(parametro.valorContainerDecimal * parametro.taxaSeguro)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className="text-sm text-zinc-700">
                        {formatCurrency(parametro.valorContainerDecimal)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-zinc-700">
                        {formatDate(parametro.vigenciaInicio)}
                        {parametro.vigenciaFim && (
                          <span> até {formatDate(parametro.vigenciaFim)}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                        v{parametro.versao}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      {parametro.ativo ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewHistorico(parametro)}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                          title="Ver histórico"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedParametro(parametro);
                            setShowEditDialog(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-100"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(parametro)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      {showHistorico && selectedParametro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-zinc-900">
                Histórico de Versões - {selectedParametro.tipoContainer?.tipoContainer}
              </h3>
              <p className="text-sm text-zinc-600 mt-1">
                Todas as alterações realizadas neste parâmetro
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {historico.map((versao, index) => (
                  <div
                    key={`${versao.idCliente}-${versao.idTipoContainer}-${versao.versao}`}
                    className={`rounded-lg border p-4 ${
                      versao.ativo ? "border-green-200 bg-green-50" : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            versao.ativo ? "bg-green-200 text-green-900" : "bg-zinc-300 text-zinc-700"
                          }`}>
                            Versão {versao.versao}
                            {versao.ativo && " (Atual)"}
                          </span>
                          <span className="text-xs text-zinc-500">
                            Criado em {formatDate(versao.dataCriacao)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-zinc-700">Taxa de Seguro:</span>{" "}
                            <span className="text-zinc-900">{formatPercent(versao.taxaSeguro)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-zinc-700">Prêmio do Seguro:</span>{" "}
                            <span className="text-green-700 font-semibold">
                              {formatCurrency(versao.valorContainerDecimal * versao.taxaSeguro)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-zinc-700">Valor Container:</span>{" "}
                            <span className="text-zinc-900">{formatCurrency(versao.valorContainerDecimal)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-zinc-700">Vigência Início:</span>{" "}
                            <span className="text-zinc-900">{formatDate(versao.vigenciaInicio)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-zinc-700">Vigência Fim:</span>{" "}
                            <span className="text-zinc-900">
                              {versao.vigenciaFim ? formatDate(versao.vigenciaFim) : "Indefinida"}
                            </span>
                          </div>
                        </div>

                        {versao.dataAtualizacao && versao.dataAtualizacao !== versao.dataCriacao && (
                          <div className="text-xs text-zinc-500">
                            Atualizado em {formatDate(versao.dataAtualizacao)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowHistorico(false);
                  setSelectedParametro(null);
                  setHistorico([]);
                }}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditDialog && selectedParametro && (
        <EditParametroDialog
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedParametro(null);
          }}
          parametro={selectedParametro}
          onSuccess={loadParametros}
        />
      )}
    </div>
  );
}

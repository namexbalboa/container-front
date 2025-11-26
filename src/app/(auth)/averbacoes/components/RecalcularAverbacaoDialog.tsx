"use client";

import { useState } from "react";
import { apiService } from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import type { RecalculoAverbacaoResponse } from "@/types/api";

interface RecalcularAverbacaoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  averbacaoId: number;
  onRecalculoSuccess: () => void;
}

export default function RecalcularAverbacaoDialog({
  isOpen,
  onClose,
  averbacaoId,
  onRecalculoSuccess,
}: RecalcularAverbacaoDialogProps) {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<RecalculoAverbacaoResponse | null>(null);

  const handleRecalcular = async () => {
    setLoading(true);
    try {
      const response = await apiService.recalcularAverbacao(averbacaoId);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Erro ao recalcular averbação");
      }

      setResultado(response.data);

      if (response.data.alterado) {
        showAlert("success", "Averbação recalculada com sucesso!");
      } else {
        showAlert("success", "Valores já estão atualizados. Nenhuma alteração necessária.");
      }
    } catch (error: any) {
      showAlert("error", error.message || "Erro ao recalcular averbação");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = () => {
    onRecalculoSuccess();
    onClose();
    setResultado(null);
  };

  const handleCancelar = () => {
    onClose();
    setResultado(null);
  };

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Recalcular Valores da Averbação
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Os valores serão recalculados com base nos parâmetros atuais do cliente.
          </p>
        </div>

        <div className="p-6">
          {!resultado ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta ação irá recalcular todos os valores
                  de seguro desta averbação utilizando os parâmetros atuais cadastrados
                  para o cliente. Os valores antigos serão substituídos.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRecalcular}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Recalculando..." : "Recalcular"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comparação de Valores */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Comparação de Valores
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                    <div>Campo</div>
                    <div className="text-right">Valor Anterior</div>
                    <div className="text-right">Valor Novo</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-gray-700">Importância Segurada</div>
                    <div className="text-right text-gray-600">
                      {formatCurrency(resultado.valoresAntigos.importanciaSegurada)}
                    </div>
                    <div className="text-right font-medium text-blue-600">
                      {formatCurrency(resultado.valoresNovos.importanciaSegurada)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-gray-700">Prêmio (Valor do Seguro)</div>
                    <div className="text-right text-gray-600">
                      {formatCurrency(resultado.valoresAntigos.premio)}
                    </div>
                    <div className="text-right font-medium text-blue-600">
                      {formatCurrency(resultado.valoresNovos.premio)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-gray-700">IOF (7.38%)</div>
                    <div className="text-right text-gray-600">
                      {formatCurrency(resultado.valoresAntigos.iof)}
                    </div>
                    <div className="text-right font-medium text-blue-600">
                      {formatCurrency(resultado.valoresNovos.iof)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm border-t pt-2">
                    <div className="font-semibold text-gray-700">Prêmio Líquido Total</div>
                    <div className="text-right font-medium text-gray-600">
                      {formatCurrency(resultado.valoresAntigos.premioLiquido)}
                    </div>
                    <div className="text-right font-bold text-blue-700">
                      {formatCurrency(resultado.valoresNovos.premioLiquido)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes do Cálculo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Detalhes do Cálculo por Tipo de Container
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Tipo Container
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                          Quantidade
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                          Valor Médio
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                          Taxa Seguro
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                          Valor Seguro
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {resultado.detalhesCalculo?.porTipo?.map((detalhe, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {detalhe.tipoContainer}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {detalhe.quantidade}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {formatCurrency(detalhe.valorMedio)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {formatPercent(detalhe.taxaSeguro)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                            {formatCurrency(detalhe.valorSeguro)}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                            Nenhum detalhe de cálculo disponível
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumo do Recálculo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-sm text-blue-800">
                    <p className="font-medium mb-1">Resumo do Recálculo</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        Total de containers: {resultado.detalhesCalculo.quantidadeContainers}
                      </li>
                      <li>
                        Containers calculados com sucesso: {resultado.detalhesCalculo.containersCalculados}
                      </li>
                      {resultado.detalhesCalculo.containersComErro > 0 && (
                        <li className="text-yellow-700">
                          Containers com erro: {resultado.detalhesCalculo.containersComErro}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleConfirmar}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

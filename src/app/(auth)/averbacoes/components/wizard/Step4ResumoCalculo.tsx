"use client";

import { useState, useEffect } from "react";
import { Package, DollarSign, TrendingUp, FileText, Info } from "lucide-react";
import { ContainerTripSelection } from "../AverbacaoWizard";
import { formatCurrency } from "@/lib/format-utils";
import { apiService } from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import type { ClienteContainerSeguro } from "@/types/api";

interface Step4ResumoCalculoProps {
  data: {
    clienteId: number | null;
    seguradoraId: number | null;
    periodoInicio: string;
    periodoFim: string;
    numero?: string;
    observacoes?: string;
    selectedTrips: any[];
    containerTrips: ContainerTripSelection[];
  };
  onUpdate: (data: any) => void;
}

export function Step4ResumoCalculo({ data, onUpdate }: Step4ResumoCalculoProps) {
  const [parametrosSeguro, setParametrosSeguro] = useState<ClienteContainerSeguro[]>([]);
  const totalContainers = data.containerTrips.length;

  // Carregar parâmetros de seguro e calcular prêmios ao montar o componente
  useEffect(() => {
    const loadParametrosSeguroECalcular = async () => {
      if (!data.clienteId) return;

      try {
        const response = await apiService.getParametrosSeguroCliente(data.clienteId);
        if (response.success && response.data) {
          const parametros = response.data;
          setParametrosSeguro(parametros);

          console.log(`🔧 Parâmetros carregados:`, {
            totalParametros: parametros.length,
            tiposDisponiveis: parametros.map(p => p.tipoContainer?.tipoContainer),
            totalContainers: data.containerTrips.length
          });

          // Calcular prêmios automaticamente
          const containersAtualizados = data.containerTrips.map((container, index) => {
            const parametro = parametros.find(
              (p) => p.tipoContainer?.tipoContainer === container.tipoContainer && p.ativo
            );

            let valorPremio = 0;
            if (parametro) {
              const valor = Number(parametro.valorContainerDecimal);
              const taxa = Number(parametro.taxaSeguro);
              valorPremio = valor * taxa;

              // Debug: mostrar cálculo dos primeiros containers
              if (index < 3) {
                console.log(`📊 Container ${index + 1}:`, {
                  tipo: container.tipoContainer,
                  valorContainer: valor,
                  taxa: taxa,
                  premio: valorPremio
                });
              }
            } else {
              console.warn(`⚠️ Parâmetro não encontrado para tipo: ${container.tipoContainer}`);
            }

            return {
              ...container,
              valorPremio,
            };
          });

          // Atualizar apenas se houver diferença
          const premiosAtualizados = containersAtualizados.some(
            (c, i) => c.valorPremio !== data.containerTrips[i]?.valorPremio
          );

          if (premiosAtualizados) {
            // Calcular totais
            const valorMercadoriaTotal = containersAtualizados.reduce((sum, ct) => {
              const parametro = parametros.find(
                (p) => p.tipoContainer?.tipoContainer === ct.tipoContainer && p.ativo
              );
              return sum + Number(parametro?.valorContainerDecimal || 0);
            }, 0);

            const valorPremioTotal = containersAtualizados.reduce(
              (sum, ct) => sum + (Number(ct.valorPremio) || 0),
              0
            );

            // Atualizar wizard data com containers E totais
            onUpdate({
              containerTrips: containersAtualizados,
              valorMercadoriaTotal,
              valorPremioTotal
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar parâmetros de seguro:", error);
      }
    };

    loadParametrosSeguroECalcular();
  }, [data.clienteId]);

  // Calcular cobertura total (soma dos valores dos containers)
  const coberturaTotal = data.containerTrips.reduce((sum, ct) => {
    const parametro = parametrosSeguro.find(
      (p) => p.tipoContainer?.tipoContainer === ct.tipoContainer && p.ativo
    );
    return sum + Number(parametro?.valorContainerDecimal || 0);
  }, 0);

  const valorPremioTotal = data.containerTrips.reduce(
    (sum, ct) => {
      const premio = Number(ct.valorPremio) || 0;
      return sum + premio;
    },
    0
  );

  // Debug: verificar se há prêmios zerados
  if (data.containerTrips.length > 0) {
    const premiosZerados = data.containerTrips.filter(ct => !ct.valorPremio || ct.valorPremio === 0);
    if (premiosZerados.length > 0) {
      console.warn(`⚠️ ${premiosZerados.length} containers com prêmio zerado de ${data.containerTrips.length} total`);
    }
    console.log("💰 Cálculo prêmio total:", {
      totalContainers: data.containerTrips.length,
      valorPremioTotal,
      primeirosPremios: data.containerTrips.slice(0, 3).map(ct => ({
        tipo: ct.tipoContainer,
        premio: ct.valorPremio
      }))
    });
  }

  // Agrupar containers por tipo
  const containersPorTipo = data.containerTrips.reduce((acc, ct) => {
    const tipo = ct.tipoContainer || "Não especificado";
    const parametro = parametrosSeguro.find(
      (p) => p.tipoContainer?.tipoContainer === tipo && p.ativo
    );

    if (!acc[tipo]) {
      acc[tipo] = {
        quantidade: 0,
        valorCobertura: 0,
        premioTotal: 0,
      };
    }
    acc[tipo].quantidade += 1;
    acc[tipo].valorCobertura += Number(parametro?.valorContainerDecimal || 0);
    acc[tipo].premioTotal += ct.valorPremio || 0;
    return acc;
  }, {} as Record<string, { quantidade: number; valorCobertura: number; premioTotal: number }>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">Resumo do Cálculo</h3>
        <p className="text-sm text-zinc-600">
          Revise os dados antes de finalizar. Os valores de seguro foram calculados automaticamente.
        </p>
      </div>

      {/* Alerta se prêmios estiverem zerados */}
      {valorPremioTotal === 0 && data.containerTrips.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Aguardando cálculo
              </p>
              <p className="text-sm text-amber-800">
                Os prêmios estão sendo calculados automaticamente com base nos parâmetros de seguro cadastrados para este cliente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta sobre cálculo automático */}
      {valorPremioTotal > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Cálculo Automático de Valores
              </p>
              <p className="text-sm text-blue-800">
                Os valores de seguro (importância segurada, prêmio, IOF e prêmio líquido) serão
                calculados automaticamente com base nos parâmetros cadastrados para este cliente
                e tipo de container. Não é necessário informar esses valores manualmente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-3">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-600">Total de Containers</p>
              <p className="text-2xl font-bold text-zinc-900">{totalContainers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-200 p-3">
              <DollarSign className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700">Cobertura Total</p>
              <p className="text-2xl font-bold text-emerald-900">
                {formatCurrency(coberturaTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-200 p-3">
              <TrendingUp className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Prêmio Total</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(valorPremioTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento por tipo de container */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h4 className="text-base font-semibold text-zinc-900">
            Detalhamento por Tipo de Container
          </h4>
          <p className="text-sm text-zinc-600 mt-1">
            Os valores de seguro serão calculados de acordo com os parâmetros cadastrados para cada tipo
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {Object.entries(containersPorTipo).map(([tipo, dados]) => (
              <div
                key={tipo}
                className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-zinc-50"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{tipo}</p>
                    <p className="text-sm text-zinc-600">
                      {dados.quantidade} container{dados.quantidade !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-xs text-zinc-500">Cobertura</p>
                    <p className="font-semibold text-zinc-900">
                      {formatCurrency(dados.valorCobertura)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Prêmio</p>
                    <p className="font-semibold text-green-700">
                      {formatCurrency(dados.premioTotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de containers */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h4 className="text-base font-semibold text-zinc-900">Detalhamento por Container</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Container
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Navio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Rota
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Cobertura
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Prêmio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {data.containerTrips.map((container) => {
                const parametro = parametrosSeguro.find(
                  (p) => p.tipoContainer?.tipoContainer === container.tipoContainer && p.ativo
                );
                const valorCobertura = parametro?.valorContainerDecimal || 0;

                return (
                  <tr key={container.idContainerTrip} className="hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                      {container.numeroContainer}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {container.tipoContainer || "N/A"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                      {container.navio || "—"}
                      {container.viagem && (
                        <span className="ml-1 text-xs text-zinc-500">
                          ({container.viagem})
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                      {container.portoOrigem || "—"} → {container.portoDestino || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-zinc-900">
                      {formatCurrency(valorCobertura)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-green-700">
                      {container.valorPremio
                        ? formatCurrency(container.valorPremio)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-50">
              <tr className="font-semibold">
                <td colSpan={4} className="px-4 py-3 text-sm text-zinc-900">
                  Total
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-emerald-700">
                  {formatCurrency(coberturaTotal)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-blue-700">
                  {formatCurrency(valorPremioTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Informações da averbação */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-200 p-2">
            <FileText className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Informações da Averbação</p>
            <div className="mt-2 space-y-1 text-sm text-blue-800">
              <p>
                <strong>Período:</strong>{" "}
                {new Date(data.periodoInicio).toLocaleDateString("pt-BR")} até{" "}
                {new Date(data.periodoFim).toLocaleDateString("pt-BR")}
              </p>
              {data.numero && (
                <p>
                  <strong>Número:</strong> {data.numero}
                </p>
              )}
              {data.observacoes && (
                <p>
                  <strong>Observações:</strong> {data.observacoes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Próximos passos */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900 mb-1">
              Próximos Passos
            </p>
            <p className="text-sm text-emerald-800">
              Ao finalizar, a averbação será criada e os valores de seguro (prêmio, IOF e prêmio líquido)
              serão calculados automaticamente usando os parâmetros cadastrados para este cliente.
              Você poderá revisar e recalcular esses valores a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

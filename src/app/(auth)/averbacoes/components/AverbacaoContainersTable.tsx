"use client";

import { formatCurrency, formatDate } from "@/lib/format-utils";
import type { Averbacao, AverbacaoContainerResumo, ClienteContainerSeguro } from "@/types/api";

const toArray = (averbacao: Averbacao): any[] => {
  if (averbacao.containers?.length) {
    // Mapear a estrutura nova da API para o formato esperado
    return averbacao.containers.map((ac: any) => {
      // A estrutura é: averbacao_container -> ce_container -> container_trip e container_registro
      const ceContainer = ac.ceContainer;
      const trip = ceContainer?.containerTrip;
      const registro = ceContainer?.containerRegistro;

      return {
        containerId: registro?.idContainerRegistro ?? ac.idAverbacaoContainer ?? 0,
        containerNumero: registro?.nrContainer ?? "—",
        containerTipo: registro?.tipoContainer?.tipoContainer ?? "—",
        navio: trip?.nomeNavio ?? "—",
        viagem: trip?.numeroViagem ?? "—",
        dataEmbarque: trip?.dataEmbarque,
        dataChegadaPrevista: trip?.dataChegadaPrevista,
        portoOrigem: trip?.portoOrigem?.nomePorto,
        portoDestino: trip?.portoDestino?.nomePorto,
        valorMercadoria: Number(registro?.valorContainer || trip?.valorMercadoria || 0),
        valorPremio: ac.valorPremio ? Number(ac.valorPremio) : null,
      };
    });
  }
  if (averbacao.containerTrips?.length) {
    return averbacao.containerTrips;
  }
  if (averbacao.numeroContainer) {
    return [
      {
        containerId: averbacao.container?.idContainerRegistro ?? 0,
        containerNumero:
          averbacao.container?.nrContainer ?? averbacao.numeroContainer ?? "—",
        containerTipo: averbacao.container?.tipoContainer?.tipoContainer,
        valorMercadoria: averbacao.valorMercadoria,
      },
    ];
  }
  return [];
};

type Props = {
  averbacao: Averbacao;
  parametrosSeguro?: ClienteContainerSeguro[];
};

export function AverbacaoContainersTable({ averbacao, parametrosSeguro = [] }: Props) {
  const containers = toArray(averbacao);

  if (containers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-10 text-center">
        <h3 className="text-sm font-medium text-zinc-800">Nenhum container vinculado</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Ajuste o período ou inclua manualmente IDs de viagem para controlar os containers
          averbados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="max-h-96 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                  Container
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                  Navio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                  Viagem
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                  Embarque
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                  Chegada prevista
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                  Cobertura
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                  Prêmio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {containers.map((container, index) => (
                <tr key={`container-${index}`}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                    {container.containerNumero || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                    {container.containerTipo || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                    {container.navio || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                    {container.viagem || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                    {container.dataEmbarque ? formatDate(container.dataEmbarque) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                    {container.dataChegadaPrevista
                      ? formatDate(container.dataChegadaPrevista)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-zinc-900">
                    {container.valorMercadoria ? formatCurrency(container.valorMercadoria) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-green-700">
                    {container.valorPremio !== null && container.valorPremio !== undefined
                      ? formatCurrency(container.valorPremio)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


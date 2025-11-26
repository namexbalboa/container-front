"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import { generateAverbacaoPdf } from "@/lib/reports/averbacao-report";
import { gerarPDFAverbacao } from "@/lib/pdf/averbacao-pdf";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import type { Averbacao, Cliente, ClienteContainerSeguro } from "@/types/api";

import { AverbacaoContainersTable } from "../components/AverbacaoContainersTable";
import { AverbacaoHistorySection } from "../components/AverbacaoHistorySection";
import RecalcularAverbacaoDialog from "../components/RecalcularAverbacaoDialog";

const statusStyles: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-blue-100 text-blue-700" },
  aprovada: { label: "Aprovada", className: "bg-emerald-100 text-emerald-700" },
  rejeitada: { label: "Rejeitada", className: "bg-rose-100 text-rose-700" },
  cancelada: { label: "Cancelada", className: "bg-zinc-200 text-zinc-600" },
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function DetalheAverbacaoPage() {
  const params = useParams<{ id: string }>();
  const { showAlert } = useAlert();

  const [averbacao, setAverbacao] = useState<Averbacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [recalcularDialogOpen, setRecalcularDialogOpen] = useState(false);
  const [parametrosSeguro, setParametrosSeguro] = useState<ClienteContainerSeguro[]>([]);

  const averbacaoId = Number(params?.id);
  
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
      showAlert("error", "Não foi possível carregar os dados da averbação.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAverbacao();
  }, [averbacaoId, showAlert]);

  // Carregar parâmetros de seguro quando averbação for carregada
  useEffect(() => {
    const loadParametrosSeguro = async () => {
      if (!averbacao?.clienteId) return;

      try {
        const response = await apiService.getParametrosSeguroCliente(averbacao.clienteId);
        if (response.success && response.data) {
          setParametrosSeguro(response.data);
        }
      } catch (error) {
        console.error("Erro ao carregar parâmetros de seguro:", error);
      }
    };

    loadParametrosSeguro();
  }, [averbacao?.clienteId]);

  const containersCount = useMemo(() => {
    if (!averbacao) return 0;
    // Usar o campo calculado do backend
    if (averbacao.quantidadeContainers !== undefined) {
      return averbacao.quantidadeContainers;
    }
    if (averbacao.containers?.length) return averbacao.containers.length;
    if (averbacao.containerTrips?.length) return averbacao.containerTrips.length;
    return averbacao.numeroContainer ? 1 : 0;
  }, [averbacao]);

  // Usar valores diretamente do backend (já calculados e salvos)
  const coberturaTotal = useMemo(() => {
    if (!averbacao) return 0;
    // Usar importância segurada salva no banco
    return toNumber(averbacao.importanciaSegurada || 0);
  }, [averbacao]);

  const premioLiquido = useMemo(() => {
    if (!averbacao) return 0;
    // Usar prêmio líquido salvo no banco
    return toNumber(averbacao.premioLiquido || averbacao.premioComercialLiquido || 0);
  }, [averbacao]);

  // Calcular IOF usando o valor salvo ou calculando se necessário
  const valorIOF = useMemo(() => {
    if (!averbacao) return 0;
    // Usar IOF salvo no banco se disponível
    if (averbacao.iof !== null && averbacao.iof !== undefined) {
      return toNumber(averbacao.iof);
    }
    // Fallback: calcular 7.38% do prêmio líquido
    return premioLiquido * 0.0738;
  }, [averbacao, premioLiquido]);

  // Prêmio total
  const premioTotal = useMemo(() => {
    if (!averbacao) return 0;
    // Usar prêmio total salvo no banco
    if (averbacao.premio !== null && averbacao.premio !== undefined) {
      return toNumber(averbacao.premio);
    }
    // Fallback: somar prêmio líquido + IOF
    return premioLiquido + valorIOF;
  }, [averbacao, premioLiquido, valorIOF]);

  const periodoLabel = useMemo(() => {
    if (!averbacao) return "—";
    if (averbacao.periodoInicio && averbacao.periodoFim) {
      return `${formatDate(averbacao.periodoInicio)} a ${formatDate(averbacao.periodoFim)}`;
    }
    if (averbacao.dataAverbacao) {
      return formatDate(averbacao.dataAverbacao);
    }
    return "—";
  }, [averbacao]);

  // Agrupar containers por tipo para o detalhamento
  const containersPorTipo = useMemo(() => {
    if (!averbacao) return {};

    const containers = averbacao.containers || averbacao.containerTrips || [];

    return containers.reduce((acc, container: any) => {
      // Acessar o tipo do container através da estrutura correta
      const containerTrip = container.containerTrip || container;
      const containerRegistro = containerTrip?.containerRegistro;
      const tipo = containerRegistro?.tipoContainer?.tipoContainer ||
                   container.containerTipo ||
                   "Não especificado";

      if (!acc[tipo]) {
        acc[tipo] = {
          quantidade: 0,
          valorCobertura: 0,
          premioTotal: 0,
        };
      }

      acc[tipo].quantidade += 1;

      // Usar valores reais dos containers salvos no banco
      const valorContainer = toNumber(
        containerRegistro?.valorContainer ||
        containerTrip?.valorMercadoria ||
        container.valorContainer ||
        0
      );

      const valorPremio = toNumber(
        container.valorPremio ||
        containerTrip?.valorPremio ||
        0
      );

      acc[tipo].valorCobertura += valorContainer;
      acc[tipo].premioTotal += valorPremio;

      return acc;
    }, {} as Record<string, { quantidade: number; valorCobertura: number; premioTotal: number }>);
  }, [averbacao]);

  const handleGeneratePdf = async () => {
    if (!averbacao) return;
    setPdfLoading(true);

    try {
      // Buscar dados do relatório da API
      const response = await apiService.getRelatorioAverbacao(averbacao.idAverbacao);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Erro ao buscar dados do relatório");
      }

      // Gerar PDF com os dados do relatório
      gerarPDFAverbacao(response.data);

      showAlert("success", "PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showAlert("error", "Não foi possível gerar o PDF da averbação.");
    } finally {
      setPdfLoading(false);
    }
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
          Verifique se o endereço está correto ou retorne para a listagem.
        </p>
        <div className="mt-6">
          <Link
            href="/averbacoes"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }

  const status = statusStyles[averbacao.status ?? ""] ?? {
    label: averbacao.status ?? "Indefinido",
    className: "bg-zinc-200 text-zinc-700",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-zinc-900">
              Averbação {averbacao.numeroAverbacao ?? averbacao.numero ?? `#${averbacao.idAverbacao}`}
            </h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            Empresa {averbacao.cliente?.razaoSocial ?? `#${averbacao.clienteId}`} | Período:{" "}
            {periodoLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
            className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pdfLoading ? "Gerando PDF..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {/* Cards de resumo principal */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ResumoCard
          label="Total de Containers"
          value={containersCount.toString()}
          highlight={false}
        />
        <ResumoCard
          label="Cobertura Total"
          value={coberturaTotal ? formatCurrency(coberturaTotal) : "—"}
          highlight={true}
          highlightColor="emerald"
        />
        <ResumoCard
          label="Prêmio Líquido"
          value={premioLiquido ? formatCurrency(premioLiquido) : "—"}
          highlight={false}
        />
        <ResumoCard
          label="IOF (7,38%)"
          value={valorIOF ? formatCurrency(valorIOF) : "—"}
          highlight={false}
        />
      </section>

      {/* Cards de informações adicionais */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ResumoCard
          label="Prêmio Total (Líquido + IOF)"
          value={premioTotal ? formatCurrency(premioTotal) : "—"}
          highlight={true}
          highlightColor="blue"
        />
        <ResumoCard
          label="Seguradora"
          value={averbacao.apolice?.seguradora?.nomeSeguradora ?? averbacao.nomeSeguradora ?? "Não associada"}
          highlight={false}
        />
        <ResumoCard
          label="Número da Averbação"
          value={averbacao.numeroAverbacao || averbacao.numero || `#${averbacao.idAverbacao}`}
          highlight={false}
        />
      </section>

      {/* Informações do período e datas */}
      <section className="grid gap-4 md:grid-cols-3">
        <ResumoCard
          label="Período de Vigência"
          value={periodoLabel}
          highlight={false}
        />
        <ResumoCard
          label="Data de Criação"
          value={(averbacao.dataAverbacao || averbacao.dataCriacao || averbacao.criadoEm)
            ? formatDate((averbacao.dataAverbacao || averbacao.dataCriacao || averbacao.criadoEm) as string)
            : "—"}
          highlight={false}
        />
        {(averbacao.dataAprovacao || averbacao.atualizadoEm) && (
          <ResumoCard
            label="Data de Aprovação"
            value={formatDate((averbacao.dataAprovacao || averbacao.atualizadoEm) as string)}
            highlight={false}
          />
        )}
      </section>

      {/* Observações, se houver */}
      {averbacao.observacoes && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500 mb-2">Observações</p>
          <p className="text-sm text-zinc-700">{averbacao.observacoes}</p>
        </section>
      )}

      {/* Detalhamento por tipo de container */}
      {Object.keys(containersPorTipo).length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h3 className="text-base font-semibold text-zinc-900">
              Detalhamento por Tipo de Container
            </h3>
            <p className="text-sm text-zinc-600 mt-1">
              Resumo dos valores calculados para cada tipo de container
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
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
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
        </section>
      )}

      <section className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Containers consolidados</h2>
          <p className="text-sm text-zinc-600">
            Lista dos containers e viagens vinculados ao período selecionado.
          </p>
        </div>
        <AverbacaoContainersTable averbacao={averbacao} parametrosSeguro={parametrosSeguro} />
      </section>

      <AverbacaoHistorySection averbacao={averbacao} />
      
      <RecalcularAverbacaoDialog
        isOpen={recalcularDialogOpen}
        onClose={() => setRecalcularDialogOpen(false)}
        averbacaoId={averbacao.idAverbacao}
        onRecalculoSuccess={loadAverbacao}
      />
    </div>
  );
}

function ResumoCard({
  label,
  value,
  highlight = false,
  highlightColor = "emerald",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: "emerald" | "blue";
}) {
  const highlightStyles = {
    emerald: "border-emerald-200 bg-emerald-50",
    blue: "border-blue-200 bg-blue-50",
  };

  const labelStyles = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
  };

  const valueStyles = {
    emerald: "text-emerald-900",
    blue: "text-blue-900",
  };

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        highlight ? highlightStyles[highlightColor] : "border-zinc-200 bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium ${
          highlight ? labelStyles[highlightColor] : "text-zinc-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-semibold ${
          highlight ? valueStyles[highlightColor] : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}


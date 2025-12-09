"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import { formatDate } from "@/lib/format-utils";
import type { Averbacao, HistoricoAlteracao } from "@/types/api";

type Props = {
  averbacao: Averbacao;
};

const tipoMeta: Record<
  NonNullable<HistoricoAlteracao["tipoAlteracao"]>,
  { label: string; icon: ComponentType<{ className?: string }>; color: string }
> = {
  CRIACAO: {
    label: "Criação",
    icon: PencilSquareIcon,
    color: "bg-blue-100 text-blue-700",
  },
  EDICAO: {
    label: "Edição",
    icon: PencilSquareIcon,
    color: "bg-amber-100 text-amber-700",
  },
  APROVACAO: {
    label: "Aprovação",
    icon: CheckCircleIcon,
    color: "bg-emerald-100 text-emerald-700",
  },
  REJEICAO: {
    label: "Rejeição",
    icon: XCircleIcon,
    color: "bg-rose-100 text-rose-700",
  },
  CANCELAMENTO: {
    label: "Cancelamento",
    icon: XCircleIcon,
    color: "bg-zinc-200 text-zinc-600",
  },
  DOCUMENTO_ADICIONADO: {
    label: "Documento adicionado",
    icon: DocumentTextIcon,
    color: "bg-purple-100 text-purple-700",
  },
  DOCUMENTO_REMOVIDO: {
    label: "Documento removido",
    icon: DocumentTextIcon,
    color: "bg-orange-100 text-orange-700",
  },
};

export function AverbacaoHistorySection({ averbacao }: Props) {
  const { showAlert } = useAlert();
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistorico = async () => {
      if (!averbacao?.idAverbacao) return;
      setLoading(true);
      try {
        const response = await apiService.getHistoricoAverbacao(averbacao.idAverbacao);
        if (response.success && response.data) {
          const registros = response.data.data ?? [];
          if (registros.length > 0) {
            setHistorico(registros);
          } else {
            setHistorico(buildFallbackHistory(averbacao));
          }
        } else {
          setHistorico(buildFallbackHistory(averbacao));
        }
      } catch (error) {
        console.error("Erro ao carregar histórico da averbação:", error);
        showAlert("Não foi possível carregar o histórico de alterações.");
        setHistorico(buildFallbackHistory(averbacao));
      } finally {
        setLoading(false);
      }
    };

    loadHistorico();
  }, [averbacao, showAlert]);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Histórico de alterações</h2>
            <p className="text-sm text-zinc-600">
              Registro de evoluções importantes desde a criação da averbação.
            </p>
          </div>
          <ClockIcon className="h-6 w-6 text-zinc-400" aria-hidden="true" />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-zinc-500">Carregando histórico...</div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {historico.map((item) => {
              const meta = item.tipoAlteracao
                ? tipoMeta[item.tipoAlteracao]
                : {
                    label: "Atualização",
                    icon: PencilSquareIcon,
                    color: "bg-blue-100 text-blue-700",
                  };

              const Icon = meta.icon;
              return (
                <li key={`${item.idHistorico}-${item.dataAlteracao}`} className="p-4">
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${meta.color}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-zinc-900">{meta.label}</h3>
                        <span className="text-xs text-zinc-500">
                          {formatDate(item.dataAlteracao ?? new Date().toISOString())}
                        </span>
                      </div>
                      {item.campoAlterado && (
                        <p className="text-xs text-zinc-500">
                          Campo: <span className="font-medium text-zinc-700">{item.campoAlterado}</span>
                        </p>
                      )}
                      {item.observacoes && (
                        <p className="text-sm text-zinc-600">{item.observacoes}</p>
                      )}
                      <p className="text-xs text-zinc-500">
                        Usuário:{" "}
                        <span className="font-medium text-zinc-700">
                          {item.usuario?.nomeCompleto ?? "Sistema"}
                        </span>
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function buildFallbackHistory(averbacao: Averbacao): HistoricoAlteracao[] {
  const eventos: HistoricoAlteracao[] = [];

  eventos.push({
    idHistorico: Number(`${averbacao.idAverbacao}01`),
    idAverbacao: averbacao.idAverbacao,
    tipoAlteracao: "CRIACAO",
    observacoes: "Averbação cadastrada no sistema.",
    usuarioId: averbacao?.cliente?.idCliente ?? 0,
    dataAlteracao: averbacao.dataCriacao ?? new Date().toISOString(),
  });

  if (averbacao.dataAtualizacao && averbacao.dataAtualizacao !== averbacao.dataCriacao) {
    eventos.push({
      idHistorico: Number(`${averbacao.idAverbacao}02`),
      idAverbacao: averbacao.idAverbacao,
      tipoAlteracao: "EDICAO",
      observacoes: "Dados da averbação atualizados.",
      usuarioId: averbacao?.cliente?.idCliente ?? 0,
      dataAlteracao: averbacao.dataAtualizacao,
    });
  }

  if (averbacao.status === "aprovada" && averbacao.dataAprovacao) {
    eventos.push({
      idHistorico: Number(`${averbacao.idAverbacao}03`),
      idAverbacao: averbacao.idAverbacao,
      tipoAlteracao: "APROVACAO",
      observacoes: "Averbação aprovada.",
      usuarioId: averbacao.usuarioAprovacao ?? 0,
      dataAlteracao: averbacao.dataAprovacao,
    });
  }

  return eventos;
}

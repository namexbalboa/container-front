"use client";

import { useEffect, useState } from "react";

import UploadDocumentos from "@/components/upload-documentos";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import type { Averbacao, DocumentoAverbacao } from "@/types/api";

type Props = {
  averbacao: Averbacao;
};

const statusClassName: Record<string, string> = {
  APROVADO: "bg-emerald-100 text-emerald-700",
  EM_ANALISE: "bg-amber-100 text-amber-700",
  PENDENTE: "bg-blue-100 text-blue-700",
  REJEITADO: "bg-rose-100 text-rose-700",
  CANCELADO: "bg-zinc-200 text-zinc-600",
};

export function AverbacaoDocumentsSection({ averbacao }: Props) {
  const { showAlert } = useAlert();
  const [documentos, setDocumentos] = useState<DocumentoAverbacao[]>([]);
  const [loading, setLoading] = useState(false);

  const isReadOnly = ["APROVADO", "REJEITADO", "CANCELADO"].includes(
    averbacao.status ?? "",
  );

  useEffect(() => {
    const loadDocumentos = async () => {
      if (!averbacao?.idAverbacao) return;

      setLoading(true);
      try {
        const response = await apiService.getDocumentosAverbacao(averbacao.idAverbacao);
        if (response.success && response.data) {
          setDocumentos(response.data);
        } else {
          // Se for 501 (Not Implemented), não mostrar erro - funcionalidade ainda não implementada
          if (response.error?.includes("não implementada") || response.error?.includes("Not Implemented")) {
            console.log("Funcionalidade de documentos ainda não implementada no backend");
            setDocumentos([]);
          } else {
            throw new Error(response.error || "Erro ao carregar documentos");
          }
        }
      } catch (error: any) {
        // Não mostrar erro se a funcionalidade não estiver implementada
        if (error?.message?.includes("Cannot GET") || error?.message?.includes("501")) {
          console.log("Funcionalidade de documentos ainda não implementada no backend");
          setDocumentos([]);
        } else {
          console.error("Erro ao carregar documentos da averbação:", error);
          showAlert("error", "Não foi possível carregar os documentos.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDocumentos();
  }, [averbacao.idAverbacao, showAlert]);

  const headerStatus =
    statusClassName[averbacao.status ?? ""] ?? statusClassName.PENDENTE ?? "bg-zinc-100";

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Documentos anexados</h2>
          <p className="text-sm text-zinc-600">
            Gerencie a documentação comprobatória desta averbação.
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${headerStatus}`}>
          {averbacao.status ?? "N/A"}
        </span>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ResumoItem
              label="Número"
              value={averbacao.numero ?? averbacao.numeroContainer ?? `#${averbacao.idAverbacao}`}
            />
            <ResumoItem
              label="Empresa"
              value={averbacao.cliente?.razaoSocial ?? "—"}
            />
            <ResumoItem
              label="Valor segurado"
              value={
                typeof averbacao.valorMercadoriaTotal === "number"
                  ? formatCurrency(averbacao.valorMercadoriaTotal)
                  : averbacao.valorMercadoria
                    ? formatCurrency(averbacao.valorMercadoria)
                    : "—"
              }
            />
            <ResumoItem
              label="Criada em"
              value={
                averbacao.dataCriacao ? formatDate(averbacao.dataCriacao) : "Data não registrada"
              }
            />
          </div>
        </div>

        <div className="p-5">
          {isReadOnly && (
            <div className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Esta averbação está finalizada. Inclusões e exclusões de documentos estão bloqueadas.
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              Carregando documentos...
            </div>
          ) : (
            <UploadDocumentos
              averbacaoId={averbacao.idAverbacao}
              documentos={documentos}
              onDocumentosChange={setDocumentos}
              disabled={isReadOnly}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function ResumoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}


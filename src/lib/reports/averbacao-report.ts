import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatCurrency, formatDate } from "@/lib/format-utils";
import type { Averbacao, AverbacaoContainerResumo, Cliente } from "@/types/api";

type GenerateAverbacaoPdfOptions = {
  empresa: Cliente;
  periodo: {
    dataInicio: string;
    dataFim: string;
  };
  averbacoes: Averbacao[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  CANCELADO: "Cancelado",
};

const formatCnpj = (value?: string) => {
  if (!value) return "N/A";

  const digits = value.replace(/\D/g, "").padStart(14, "0");
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getStatusLabel = (status?: string) => STATUS_LABEL[status ?? ""] ?? (status ?? "N/A");

export function generateAverbacaoPdf({
  empresa,
  periodo,
  averbacoes,
}: GenerateAverbacaoPdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const marginX = 48;
  let cursorY = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório de Averbações", marginX, cursorY);

  cursorY += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Empresa: ${empresa.razaoSocial}`, marginX, cursorY);

  cursorY += 16;
  if (empresa.cnpj) {
    doc.text(`CNPJ: ${formatCnpj(empresa.cnpj)}`, marginX, cursorY);
    cursorY += 16;
  }

  doc.text(
    `Período: ${formatDate(periodo.dataInicio)} até ${formatDate(periodo.dataFim)}`,
    marginX,
    cursorY,
  );

  cursorY += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Resumo do período", marginX, cursorY);

  const totalContainers = averbacoes.reduce((acc, item) => {
    const quantidade =
      item.containers?.length ??
      item.containerTrips?.length ??
      (item.numeroContainer || item.numero ? 1 : 0);
    return acc + (quantidade || 0);
  }, 0);

  const totalValor = averbacoes.reduce((acc, item) => {
    if (typeof item.valorMercadoriaTotal === "number") {
      return acc + toNumber(item.valorMercadoriaTotal);
    }
    if (item.containers?.length) {
      return (
        acc +
        item.containers.reduce(
          (subtotal, container) => subtotal + toNumber(container.valorMercadoria),
          0,
        )
      );
    }
    if (item.containerTrips?.length) {
      return (
        acc +
        item.containerTrips.reduce(
          (subtotal, container) => subtotal + toNumber(container.valorMercadoria),
          0,
        )
      );
    }
    return acc + toNumber(item.valorMercadoria);
  }, 0);

  const totalsPorStatus = averbacoes.reduce<Record<string, { quantidade: number; valor: number }>>(
    (acc, item) => {
      const key = item.status ?? "OUTROS";
      if (!acc[key]) {
        acc[key] = { quantidade: 0, valor: 0 };
      }
      acc[key].quantidade += 1;
      if (typeof item.valorMercadoriaTotal === "number") {
        acc[key].valor += toNumber(item.valorMercadoriaTotal);
      } else if (item.containers?.length) {
        acc[key].valor += item.containers.reduce(
          (subtotal, container) => subtotal + toNumber(container.valorMercadoria),
          0,
        );
      } else if (item.containerTrips?.length) {
        acc[key].valor += item.containerTrips.reduce(
          (subtotal, container) => subtotal + toNumber(container.valorMercadoria),
          0,
        );
      } else {
        acc[key].valor += toNumber(item.valorMercadoria);
      }
      return acc;
    },
    {},
  );

  const seguradoras = Array.from(
    new Set(
      averbacoes
        .map((item) => item.seguradora?.nomeSeguradora ?? (item as any)?.seguradoraNome)
        .filter(Boolean),
    ),
  );

  cursorY += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const summaryLines: string[] = [
    `Total de containers averbados: ${totalContainers}`,
    `Valor total segurado: ${formatCurrency(totalValor)}`,
    `Seguradoras envolvidas: ${seguradoras.length ? seguradoras.join(", ") : "N/A"}`,
  ];

  summaryLines.forEach((line) => {
    doc.text(line, marginX, cursorY);
    cursorY += 16;
  });

  Object.entries(totalsPorStatus).forEach(([status, dados]) => {
    const statusLabel = getStatusLabel(status);
    doc.text(
      `${statusLabel}: ${dados.quantidade} (${formatCurrency(dados.valor)})`,
      marginX + 12,
      cursorY,
    );
    cursorY += 16;
  });

  cursorY += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Detalhamento por container", marginX, cursorY);

  cursorY += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const detailRows = averbacoes.flatMap((item) => {
    const containers =
      item.containers && item.containers.length > 0
        ? item.containers
        : item.containerTrips && item.containerTrips.length > 0
          ? item.containerTrips
          : [item];

    return containers.map((container) => {
      const containerNumero =
        (container as AverbacaoContainerResumo).containerNumero ??
        (container as any)?.numeroContainer ??
        item.numeroContainer ??
        item.numero ??
        "N/A";

      const tipo =
        (container as AverbacaoContainerResumo).containerTipo ??
        (container as any)?.tipoContainer ??
        (item as any)?.tipoContainer ??
        "N/A";

      const navio =
        (container as AverbacaoContainerResumo).navio ??
        (container as any)?.navio ??
        (container as any)?.embarcacao ??
        (item as any)?.navio ??
        (item as any)?.detalhes?.navio ??
        "N/A";

      const viagem =
        (container as AverbacaoContainerResumo).viagem ??
        (container as any)?.viagem ??
        (container as any)?.numeroViagem ??
        (item as any)?.viagem ??
        (item as any)?.detalhes?.viagem ??
        "N/A";

      const data =
        (container as AverbacaoContainerResumo).dataEmbarque ??
        (container as any)?.dataEmbarque ??
        item.periodoInicio ??
        item.dataAverbacao ??
        item.dataCriacao ??
        item.dataAtualizacao;

      const valor =
        (container as AverbacaoContainerResumo).valorMercadoria ??
        (container as any)?.valorMercadoria ??
        item.valorMercadoriaTotal ??
        item.valorMercadoria;

      return [
        containerNumero,
        tipo,
        navio,
        viagem,
        data ? formatDate(data) : "N/A",
        formatCurrency(toNumber(valor)),
        item.seguradora?.nomeSeguradora ?? (item as any)?.seguradoraNome ?? "N/A",
        getStatusLabel(item.status),
      ];
    });
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [
      ["Container", "Tipo", "Navio", "Viagem", "Data", "Valor", "Seguradora", "Status"],
    ],
    body: detailRows,
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [24, 91, 189],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  const filename = `averbacoes-${empresa.razaoSocial.replace(/\s+/g, "-").toLowerCase()}-${periodo.dataInicio}-${periodo.dataFim}.pdf`;
  doc.save(filename);
}

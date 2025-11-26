import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AverbacaoRelatorio } from '@/types/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mapeamento de modais
const MODAL_MAP: Record<string, string> = {
  T: 'Terrestre',
  M: 'Marítimo',
  A: 'Aéreo',
};

// Formatar moeda
function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formatar data
function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
}

// Formatar porcentagem
function formatPercentage(value?: number): string {
  if (value === undefined || value === null) return '0%';
  return `${(value * 100).toFixed(2)}%`;
}

// Garantir que o valor seja uma string válida para o PDF
function safeString(value: any): string {
  if (value === null || value === undefined) return '-';
  return String(value);
}

export function gerarPDFAverbacao(relatorio: AverbacaoRelatorio): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let yPosition = margin;

  // CABEÇALHO
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DE EMBARQUES - IMPORTAÇÃO - SEGURO DEMURRAGE', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 10;

  // Informações do cabeçalho em duas colunas
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const col1X = margin;
  const col2X = pageWidth / 2 + 5;
  const lineHeight = 5;

  // Coluna 1
  doc.setFont('helvetica', 'bold');
  doc.text('APÓLICE:', col1X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(safeString(relatorio.apolice), col1X + 25, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('FILIAL:', col2X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(safeString(relatorio.filial), col2X + 20, yPosition);
  yPosition += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('MÊS REFERÊNCIA:', col1X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(safeString(relatorio.mesReferencia), col1X + 35, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('CNPJ FILIAL:', col2X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(safeString(relatorio.cnpjFilial), col2X + 25, yPosition);
  yPosition += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('CORRETOR:', col1X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(safeString(relatorio.corretor), col1X + 25, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('SEGURADORA:', col2X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(safeString(relatorio.seguradora), col2X + 30, yPosition);
  yPosition += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('SEGURADO:', col1X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(safeString(relatorio.segurado), col1X + 25, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('CNPJ:', col2X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(safeString(relatorio.cnpj), col2X + 15, yPosition);
  yPosition += 8;

  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // VALORES CONSOLIDADOS
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('VALORES EM R$', margin, yPosition);
  yPosition += 6;

  doc.setFontSize(9);
  const valueCol1X = margin;
  const valueCol2X = pageWidth / 3;
  const valueCol3X = (pageWidth / 3) * 2;

  // Primeira linha de valores
  doc.setFont('helvetica', 'bold');
  doc.text('Importância Segurada:', valueCol1X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(relatorio.importanciaSegurada), valueCol1X + 50, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Prêmio Comercial:', valueCol2X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(relatorio.premioComercial), valueCol2X + 40, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Prêmio Líquido:', valueCol3X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(relatorio.premioLiquido), valueCol3X + 30, yPosition);
  yPosition += lineHeight;

  // Segunda linha de valores
  doc.setFont('helvetica', 'bold');
  doc.text('Qtd. de Averbações:', valueCol1X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(String(relatorio.quantidadeAverbacoes), valueCol1X + 50, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Prêmio Comercial Líquido:', valueCol2X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(relatorio.premioComercialLiquido), valueCol2X + 50, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('IOF:', valueCol3X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(relatorio.iof), valueCol3X + 10, yPosition);
  yPosition += lineHeight;

  // Terceira linha de valores
  doc.setFont('helvetica', 'bold');
  doc.text('Qtd. de Containers:', valueCol1X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(String(relatorio.quantidadeContainers), valueCol1X + 50, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Prêmio Mínimo:', valueCol2X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(relatorio.premioMinimo), valueCol2X + 40, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Custo Apólice:', valueCol3X, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(relatorio.custoApolice), valueCol3X + 30, yPosition);
  yPosition += 8;

  // TABELA DE EMBARQUES
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RELAÇÃO DE EMBARQUES', margin, yPosition);
  yPosition += 4;

  // Preparar dados da tabela
  const tableData = relatorio.embarques.map((embarque) => [
    embarque.numeroAverbacao || '-',
    embarque.nrContainer || '-',
    embarque.tipoContainer || '-',
    embarque.medida || '-',
    formatDate(embarque.dataEmbarque),
    embarque.portoOrigem || '-',
    embarque.portoDestino || '-',
    embarque.modal ? MODAL_MAP[embarque.modal] || embarque.modal : '-',
    embarque.nomeNavio || '-',
    formatDate(embarque.dataChegada),
    embarque.freeTime ? `${embarque.freeTime} dias` : '-',
    formatCurrency(embarque.valorContainer),
    formatPercentage(embarque.taxaSeguro),  // Taxa específica do container
    formatCurrency(embarque.premio),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [[
      'Averbação',
      'Container',
      'Tipo',
      'Medida',
      'Dt. Embarque',
      'Porto Origem',
      'Porto Destino',
      'Modal',
      'Navio',
      'Dt. Chegada',
      'Free-Time',
      'Valor',
      'Taxa',
      'Prêmio',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 12 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'left', cellWidth: 25 },
      6: { halign: 'left', cellWidth: 25 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'left', cellWidth: 22 },
      9: { halign: 'center', cellWidth: 18 },
      10: { halign: 'center', cellWidth: 15 },
      11: { halign: 'right', cellWidth: 22 },
      12: { halign: 'center', cellWidth: 12 },
      13: { halign: 'right', cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Rodapé
      const pageCount = doc.getNumberOfPages();
      const pageCurrent = doc.getCurrentPageInfo().pageNumber;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${pageCurrent} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );

      doc.text(
        `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
        pageWidth - margin,
        pageHeight - 5,
        { align: 'right' }
      );
    },
  });

  // Abrir PDF em nova guia com nome identificador da averbação
  // Formato: [NumeroAverbacao].pdf
  const fileName = `${relatorio.numeroAverbacao}.pdf`;

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');

  // Limpar o URL após um tempo para liberar memória
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
}

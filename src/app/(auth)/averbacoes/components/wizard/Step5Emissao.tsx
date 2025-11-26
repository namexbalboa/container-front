"use client";

import { useState, useEffect } from "react";
import {
  FileCheck,
  Loader2,
  Mail,
  MessageCircle,
  Download,
  Eye,
  Check,
  X,
  Plus
} from "lucide-react";
import { ContainerTripSelection } from "../AverbacaoWizard";
import { formatCurrency } from "@/lib/format-utils";
import { apiService } from "@/lib/api";
import { Cliente, ClienteContainerSeguro, AverbacaoRelatorio } from "@/types/api";
import { gerarPDFAverbacao } from "@/lib/pdf/averbacao-pdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Step5EmissaoProps {
  data: {
    clienteId: number | null;
    seguradoraId: number | null;
    periodoInicio: string;
    periodoFim: string;
    numero?: string;
    observacoes?: string;
    selectedTrips: any[];
    containerTrips: ContainerTripSelection[];
    valorMercadoriaTotal: number;
    valorPremioTotal: number;
  };
  isSubmitting: boolean;
  onSubmit: () => void;
}

type ChannelType = "email" | "whatsapp";

interface ContactInput {
  id: string;
  value: string;
  type: "email" | "phone";
}

interface ChannelContacts {
  email: ContactInput[];
  whatsapp: ContactInput[];
}

export function Step5Emissao({ data, isSubmitting, onSubmit }: Step5EmissaoProps) {
  // Debug: Log data received in Step5
  console.log("📋 Step5 - Dados recebidos:", {
    totalContainers: data.containerTrips.length,
    valorMercadoriaTotal: data.valorMercadoriaTotal,
    valorPremioTotal: data.valorPremioTotal,
    primeiros3Containers: data.containerTrips.slice(0, 3).map(ct => ({
      tipo: ct.tipoContainer,
      valorPremio: ct.valorPremio
    }))
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<Set<ChannelType>>(new Set());
  const [channelContacts, setChannelContacts] = useState<ChannelContacts>({
    email: [],
    whatsapp: [],
  });
  const [newContactValues, setNewContactValues] = useState<Record<string, string>>({
    email: "",
    whatsapp: "",
  });
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoadingCliente, setIsLoadingCliente] = useState(false);
  const [parametrosSeguro, setParametrosSeguro] = useState<ClienteContainerSeguro[]>([]);

  // Carregar dados do cliente
  useEffect(() => {
    const loadCliente = async () => {
      if (!data.clienteId) return;

      setIsLoadingCliente(true);
      try {
        const response = await apiService.getCliente(data.clienteId);
        setCliente(response.data);

        // Preencher automaticamente o email do cliente
        if (response.data.email) {
          const clienteEmailContact: ContactInput = {
            id: "cliente-email",
            value: response.data.email,
            type: "email",
          };
          setChannelContacts((prev) => ({
            ...prev,
            email: [clienteEmailContact],
          }));
          // Selecionar automaticamente o canal de email
          setSelectedChannels((prev) => new Set(prev).add("email"));
        }

        // Preencher automaticamente o telefone do cliente (se houver)
        if (response.data.telefone) {
          const clientePhoneContact: ContactInput = {
            id: "cliente-phone",
            value: response.data.telefone,
            type: "phone",
          };
          setChannelContacts((prev) => ({
            ...prev,
            whatsapp: [clientePhoneContact],
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar cliente:", error);
      } finally {
        setIsLoadingCliente(false);
      }
    };

    loadCliente();
  }, [data.clienteId]);

  // Carregar parâmetros de seguro
  useEffect(() => {
    const loadParametrosSeguro = async () => {
      if (!data.clienteId) return;

      try {
        const response = await apiService.getParametrosSeguroCliente(data.clienteId);
        if (response.success && response.data) {
          setParametrosSeguro(response.data);
        }
      } catch (error) {
        console.error("Erro ao carregar parâmetros de seguro:", error);
      }
    };

    loadParametrosSeguro();
  }, [data.clienteId]);

  // Função para gerar PDF de pré-visualização
  const handleGeneratePDFPreview = async () => {
    if (!cliente || !data.clienteId) {
      console.error("Cliente não carregado");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Montar dados simulados para o relatório
      const relatorioSimulado: AverbacaoRelatorio = {
        // Cabeçalho
        apolice: "PRÉVIA",
        filial: cliente.nomeFantasia || cliente.razaoSocial,
        cnpjFilial: cliente.cnpj,
        mesReferencia: format(new Date(data.periodoInicio), "MMMM 'de' yyyy", { locale: ptBR }),
        corretor: "N/A",
        cpfCnpjCorretor: "",
        comissaoCorretor: 0,
        segurado: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia,
        cnpj: cliente.cnpj,
        seguradora: "A definir",

        // Dados da averbação
        numeroAverbacao: "PRÉVIA",
        dataAverbacao: new Date().toISOString(),
        periodoInicio: data.periodoInicio,
        periodoFim: data.periodoFim,
        status: "pendente" as const,

        // Valores consolidados
        importanciaSegurada: data.valorMercadoriaTotal,
        quantidadeAverbacoes: 1,
        quantidadeContainers: data.containerTrips.length,
        premioComercial: data.valorPremioTotal,
        premioComercialLiquido: data.valorPremioTotal,
        premioMinimo: 0,
        premioLiquido: data.valorPremioTotal,
        taxa: 0,
        premio: data.valorPremioTotal,
        iof: data.valorPremioTotal * 0.0738,
        adicionalFracionamento: 0,
        custoApolice: 0,

        // Tabela de embarques
        embarques: data.containerTrips.map((ct) => {
          const parametro = parametrosSeguro.find(
            (p) => p.tipoContainer?.tipoContainer === ct.tipoContainer && p.ativo
          );

          return {
            numeroAverbacao: "PRÉVIA",
            nrContainer: ct.numeroContainer || "N/A",
            tipoContainer: ct.tipoContainer || "N/A",
            descricaoTipo: ct.tipoContainer,
            medida: "",
            dataEmbarque: ct.dataEmbarque || new Date().toISOString(),
            portoOrigem: ct.portoOrigem || "N/A",
            portoDestino: ct.portoDestino || "N/A",
            modal: "M" as const,
            nomeNavio: ct.navio || "N/A",
            dataChegada: ct.dataChegadaPrevista,
            freeTime: 0,
            valorContainer: parametro ? Number(parametro.valorContainerDecimal) : 0,
            taxaSeguro: parametro ? Number(parametro.taxaSeguro) : 0,
            statusViagem: ct.statusViagem,
            premio: ct.valorPremio || 0,
          };
        }),

        // Totalizadores
        totalizadores: {
          valorTotalMercadorias: data.valorMercadoriaTotal,
          premioTotal: data.valorPremioTotal,
        },
      };

      // Gerar o PDF usando a função existente que já abre em nova aba
      gerarPDFAverbacao(relatorioSimulado);

    } catch (error) {
      console.error("Erro ao gerar PDF de pré-visualização:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleChannelToggle = (channel: ChannelType) => {
    setSelectedChannels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(channel)) {
        newSet.delete(channel);
        // Limpar contatos ao desselecionar
        if (channel === "email" || channel === "whatsapp") {
          setChannelContacts((prevContacts) => ({
            ...prevContacts,
            [channel]: [],
          }));
        }
      } else {
        newSet.add(channel);
      }
      return newSet;
    });
  };

  const handleAddContact = (channel: "email" | "whatsapp") => {
    const value = newContactValues[channel]?.trim();
    if (!value) return;

    const contactType = channel === "email" ? "email" : "phone";
    const newContact: ContactInput = {
      id: Date.now().toString(),
      value,
      type: contactType,
    };

    setChannelContacts((prev) => ({
      ...prev,
      [channel]: [...prev[channel], newContact],
    }));

    setNewContactValues((prev) => ({
      ...prev,
      [channel]: "",
    }));
  };

  const handleRemoveContact = (channel: "email" | "whatsapp", id: string) => {
    setChannelContacts((prev) => ({
      ...prev,
      [channel]: prev[channel].filter((c) => c.id !== id),
    }));
  };

  const getChannelConfig = (channel: ChannelType) => {
    switch (channel) {
      case "email":
        return {
          icon: Mail,
          title: "Enviar por E-mail",
          color: "blue",
          description: "Envie a averbação por e-mail para os destinatários",
          placeholder: "Digite o e-mail e pressione Enter",
          inputType: "email" as const,
        };
      case "whatsapp":
        return {
          icon: MessageCircle,
          title: "Enviar por WhatsApp",
          color: "green",
          description: "Compartilhe a averbação via WhatsApp",
          placeholder: "Digite o telefone (com DDD) e pressione Enter",
          inputType: "tel" as const,
        };
      default:
        return null;
    }
  };

  // Build submission messages
  const getSubmissionMessages = () => {
    const messages: string[] = [];
    if (selectedChannels.has("email") && channelContacts.email.length > 0) {
      messages.push(`Enviando e-mail para ${channelContacts.email.length} destinatário(s)`);
    }
    if (selectedChannels.has("whatsapp") && channelContacts.whatsapp.length > 0) {
      messages.push(`Preparando envio via WhatsApp para ${channelContacts.whatsapp.length} contato(s)`);
    }
    return messages;
  };

  // Build attention message
  const getAttentionMessage = () => {
    const actions: string[] = [];
    if (selectedChannels.has("email") && channelContacts.email.length > 0) {
      actions.push(` enviado por e-mail para ${channelContacts.email.length} destinatário(s)`);
    }
    if (selectedChannels.has("whatsapp") && channelContacts.whatsapp.length > 0) {
      actions.push(` compartilhado via WhatsApp com ${channelContacts.whatsapp.length} contato(s)`);
    }

    if (actions.length === 0) {
      return " e você poderá compartilhar posteriormente.";
    } else if (actions.length === 1) {
      return ` e${actions[0]}.`;
    } else {
      const lastAction = actions.pop();
      return ` e${actions.join(",")} e${lastAction}.`;
    }
  };

  if (isSubmitting) {
    const messages = getSubmissionMessages();

    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-16 w-16 animate-spin text-emerald-600" />
        <h3 className="mt-4 text-lg font-semibold text-zinc-900">
          Criando averbação...
        </h3>
        {messages.length > 0 ? (
          <div className="mt-2 space-y-1 text-center">
            {messages.map((msg, index) => (
              <p key={index} className="text-sm text-zinc-600">{msg}</p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">
            Aguarde enquanto processamos sua solicitação.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="rounded-full bg-emerald-100 p-4">
          <FileCheck className="h-12 w-12 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-zinc-900">Emissão da Averbação</h3>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Pré-visualize e escolha como deseja compartilhar a averbação
        </p>
      </div>

      {/* Pré-visualização */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-zinc-900">Documento da Averbação</h4>
            <p className="mt-1 text-sm text-zinc-600">
              Visualize o documento antes de finalizar
            </p>
          </div>
          <button
            type="button"
            onClick={handleGeneratePDFPreview}
            disabled={isGeneratingPDF || isLoadingCliente || !cliente}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Pré-visualizar PDF
              </>
            )}
          </button>
        </div>

        {/* Resumo rápido */}
        <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-zinc-50 p-4">
          <div>
            <p className="text-xs font-medium text-zinc-600">Containers</p>
            <p className="mt-1 text-lg font-bold text-zinc-900">
              {data.containerTrips.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-600">Total Cobertura</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">
              {formatCurrency(data.containerTrips.reduce((sum, ct) => {
                const parametro = parametrosSeguro.find(
                  (p) => p.tipoContainer?.tipoContainer === ct.tipoContainer && p.ativo
                );
                return sum + Number(parametro?.valorContainerDecimal || 0);
              }, 0))}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-600">Valor Prêmio</p>
            <p className="mt-1 text-lg font-bold text-blue-700">
              {formatCurrency(data.valorPremioTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Canais de Compartilhamento */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h4 className="text-base font-semibold text-zinc-900">
          Como deseja compartilhar?
        </h4>
        <p className="mt-1 text-sm text-zinc-600">
          Selecione um ou mais canais para enviar a averbação
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* E-mail */}
          <button
            type="button"
            onClick={() => handleChannelToggle("email")}
            className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition ${
              selectedChannels.has("email")
                ? "border-blue-500 bg-blue-50"
                : "border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
            }`}
          >
            <Mail className={`h-8 w-8 ${selectedChannels.has("email") ? "text-blue-600" : "text-zinc-400"}`} />
            <span className={`text-sm font-medium ${selectedChannels.has("email") ? "text-blue-900" : "text-zinc-700"}`}>
              E-mail
            </span>
            {selectedChannels.has("email") && channelContacts.email.length > 0 && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                {channelContacts.email.length}
              </span>
            )}
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => handleChannelToggle("whatsapp")}
            className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition ${
              selectedChannels.has("whatsapp")
                ? "border-green-500 bg-green-50"
                : "border-zinc-200 bg-white hover:border-green-300 hover:bg-green-50/50"
            }`}
          >
            <MessageCircle className={`h-8 w-8 ${selectedChannels.has("whatsapp") ? "text-green-600" : "text-zinc-400"}`} />
            <span className={`text-sm font-medium ${selectedChannels.has("whatsapp") ? "text-green-900" : "text-zinc-700"}`}>
              WhatsApp
            </span>
            {selectedChannels.has("whatsapp") && channelContacts.whatsapp.length > 0 && (
              <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                {channelContacts.whatsapp.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Adicionar Contatos - Apenas para Email e WhatsApp */}
      {selectedChannels.has("email") && (
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-blue-900">
                {getChannelConfig("email")?.title}
              </h5>
              <p className="mt-1 text-sm text-blue-700">
                {getChannelConfig("email")?.description}
              </p>

              {/* Input para adicionar contatos */}
              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  value={newContactValues.email || ""}
                  onChange={(e) => setNewContactValues((prev) => ({ ...prev, email: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddContact("email");
                    }
                  }}
                  placeholder={getChannelConfig("email")?.placeholder}
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  onClick={() => handleAddContact("email")}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>

              {/* Lista de contatos adicionados */}
              {channelContacts.email.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-zinc-600">
                    {channelContacts.email.length} destinatário(s) adicionado(s):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {channelContacts.email.map((contact) => (
                      <div
                        key={contact.id}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        <Check className="h-3 w-3" />
                        <span>{contact.value}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveContact("email", contact.id)}
                          className="ml-1 rounded-full hover:bg-white/50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedChannels.has("whatsapp") && (
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-green-900">
                {getChannelConfig("whatsapp")?.title}
              </h5>
              <p className="mt-1 text-sm text-green-700">
                {getChannelConfig("whatsapp")?.description}
              </p>

              {/* Input para adicionar contatos */}
              <div className="mt-4 flex gap-2">
                <input
                  type="tel"
                  value={newContactValues.whatsapp || ""}
                  onChange={(e) => setNewContactValues((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddContact("whatsapp");
                    }
                  }}
                  placeholder={getChannelConfig("whatsapp")?.placeholder}
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  onClick={() => handleAddContact("whatsapp")}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>

              {/* Lista de contatos adicionados */}
              {channelContacts.whatsapp.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-zinc-600">
                    {channelContacts.whatsapp.length} contato(s) adicionado(s):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {channelContacts.whatsapp.map((contact) => (
                      <div
                        key={contact.id}
                        className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                      >
                        <Check className="h-3 w-3" />
                        <span>{contact.value}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveContact("whatsapp", contact.id)}
                          className="ml-1 rounded-full hover:bg-white/50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Informações da averbação */}
      {(selectedChannels.has("email") || selectedChannels.has("whatsapp")) && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Informação:</strong> O documento será gerado
            {getAttentionMessage()}
          </p>
        </div>
      )}

      {/* Botão Grande Central */}
      <div className="flex items-center justify-center py-8">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-18 py-6 text-lg font-bold text-white shadow-2xl transition-all hover:from-emerald-700 hover:to-emerald-600 hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-emerald-600 disabled:hover:to-emerald-500"
        >
          <span className="relative z-10 flex items-center gap-3 text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="h-7 w-7 animate-spin text-white" />
                Criando Averbação...
              </>
            ) : (
              <>
                <FileCheck className="h-7 w-7 text-white" />
                Criar Averbação
              </>
            )}
          </span>
          {!isSubmitting && (
            <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          )}
        </button>
      </div>

    </div>
  );
}

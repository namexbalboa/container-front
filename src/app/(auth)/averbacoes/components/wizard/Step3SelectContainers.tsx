"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Ship, Package, Search, CheckSquare, Square } from "lucide-react";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { ContainerTripSelection } from "../AverbacaoWizard";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import type { ContainerTrip, ClienteContainerSeguro } from "@/types/api";

interface Step3SelectContainersProps {
  data: {
    clienteId: number | null;
    periodoInicio: string;
    periodoFim: string;
    selectedTrips: ContainerTrip[];
    containerTrips: ContainerTripSelection[];
  };
  onUpdate: (data: any) => void;
}

export function Step3SelectContainers({ data, onUpdate }: Step3SelectContainersProps) {
  const { data: session } = useSession();
  const { showAlert } = useAlert();

  const [availableContainers, setAvailableContainers] = useState<ContainerTrip[]>([]);
  const [isLoadingContainers, setIsLoadingContainers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<ContainerTripSelection | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"available" | "selected">("available");
  const [parametrosSeguro, setParametrosSeguro] = useState<ClienteContainerSeguro[]>([]);
  const [isLoadingParametros, setIsLoadingParametros] = useState(false);

  // Função para buscar parâmetros de seguro do cliente
  const loadParametrosSeguro = async (clienteId: number) => {
    if (isLoadingParametros || parametrosSeguro.length > 0) return;

    setIsLoadingParametros(true);
    try {
      const response = await apiService.getParametrosSeguroCliente(clienteId);
      if (response.success && response.data) {
        setParametrosSeguro(response.data);
        console.log(`[Step3] Carregados ${response.data.length} parâmetros de seguro`);
      }
    } catch (error) {
      console.error("Erro ao carregar parâmetros de seguro:", error);
      showAlert("warning", "Não foi possível carregar os parâmetros de seguro. Os valores de prêmio não serão calculados automaticamente.");
    } finally {
      setIsLoadingParametros(false);
    }
  };

  // Função para calcular o prêmio baseado no tipo de container (seguro de casco)
  const calcularPremio = (tipoContainer: string | undefined): number => {
    console.log(`[Step3 calcularPremio] Tentando calcular para tipo="${tipoContainer}", parametros.length=${parametrosSeguro.length}`);

    if (!tipoContainer || parametrosSeguro.length === 0) {
      console.log(`[Step3 calcularPremio] Retornando 0: tipoContainer=${!!tipoContainer}, parametros=${parametrosSeguro.length}`);
      return 0;
    }

    // Log de todos os parâmetros disponíveis
    console.log(`[Step3 calcularPremio] Parâmetros disponíveis:`, parametrosSeguro.map(p => ({
      idTipo: p.idTipoContainer,
      tipo: p.tipoContainer?.tipoContainer,
      valorContainer: p.valorContainerDecimal,
      taxa: p.taxaSeguro,
      ativo: p.ativo
    })));

    // Buscar o parâmetro correspondente ao tipo de container
    const parametro = parametrosSeguro.find(
      (p) => p.tipoContainer?.tipoContainer === tipoContainer && p.ativo
    );

    if (!parametro) {
      console.warn(`[Step3 calcularPremio] ⚠️ Parâmetro não encontrado para tipo: "${tipoContainer}"`);
      console.warn(`[Step3 calcularPremio] Tipos disponíveis:`, parametrosSeguro.map(p => `"${p.tipoContainer?.tipoContainer}"`));
      return 0;
    }

    // Calcular prêmio: valorContainer * taxaSeguro (seguro de casco)
    const premio = parametro.valorContainerDecimal * parametro.taxaSeguro;
    console.log(`[Step3 calcularPremio] ✅ Calculado prêmio: R$ ${premio.toFixed(2)} = R$ ${parametro.valorContainerDecimal} × ${parametro.taxaSeguro} (${(parametro.taxaSeguro * 100).toFixed(4)}%)`);
    return premio;
  };

  // Carregar parâmetros de seguro quando o clienteId estiver disponível
  useEffect(() => {
    if (data.clienteId) {
      loadParametrosSeguro(data.clienteId);
    }
  }, [data.clienteId]);

  // Carregar containers das viagens selecionadas
  useEffect(() => {
    if (!data.selectedTrips || data.selectedTrips.length === 0) {
      setAvailableContainers([]);
      return;
    }

    const loadContainers = async () => {
      setIsLoadingContainers(true);
      try {
        // Extrair todos os containers das viagens selecionadas
        const allContainers: ContainerTrip[] = [];

        data.selectedTrips.forEach(trip => {
          if (trip.containers && Array.isArray(trip.containers)) {
            // Cada CeContainer precisa ser convertido para ContainerTrip
            // para ser usado na seleção
            trip.containers.forEach((ceContainer, index) => {
              // Buscar o valor do container (se existir) do containerRegistro
              // Se não existir, usar 0 (não dividir o valor da viagem)
              let valorContainer = 0;
              if (ceContainer.containerRegistro?.valorContainer) {
                const rawValue = ceContainer.containerRegistro.valorContainer;
                // Converter para número (pode vir como string do DB)
                valorContainer = typeof rawValue === 'string'
                  ? parseFloat(rawValue)
                  : Number(rawValue);

                // Log para debug
                console.log(`[Step3] Container ${ceContainer.nrContainer}: valorContainer = ${valorContainer}`);
              }

              // Criar um ContainerTrip "virtual" combinando dados do CeContainer e da viagem
              const virtualContainerTrip: ContainerTrip = {
                // IMPORTANTE: Usar idCeContainer como ID principal para evitar duplicatas
                // O idCeContainer é único para cada container em cada viagem
                idContainerTrip: ceContainer.idCeContainer,
                idContainerRegistro: ceContainer.idContainerRegistro,
                idCliente: trip.idCliente,

                // Dados da viagem (CE)
                numeroCE: trip.numeroCE,
                numeroCEMaster: trip.numeroCEMaster,
                numeroConhecimento: trip.numeroConhecimento,
                origemDados: trip.origemDados,
                statusViagem: trip.statusViagem,
                modal: trip.modal,

                // Dados do navio/viagem
                nomeNavio: trip.nomeNavio,
                numeroViagem: trip.numeroViagem,
                navioImo: trip.navioImo,
                armador: trip.armador,

                // Datas
                dataEmbarque: trip.dataEmbarque,
                dataChegadaPrevista: trip.dataChegadaPrevista,
                dataChegada: trip.dataChegada,

                // Portos
                idPortoOrigem: trip.idPortoOrigem,
                idPortoDestino: trip.idPortoDestino,
                portoOrigem: trip.portoOrigem,
                portoDestino: trip.portoDestino,

                // Dados do container (do CeContainer)
                numeroContainer: ceContainer.nrContainer,
                tipoContainer: ceContainer.tipoContainer?.tipoContainer || undefined,

                // Campos legados para compatibilidade
                navio: trip.nomeNavio,
                viagem: trip.numeroViagem,

                // Valor da mercadoria: usa o valorContainer se existir, senão 0
                valorMercadoria: valorContainer,

                // Auditoria
                dataCriacao: trip.dataCriacao,
                dataAtualizacao: trip.dataAtualizacao,
              };

              allContainers.push(virtualContainerTrip);
            });
          }
        });

        const containersWithValue = allContainers.filter(c => c.valorMercadoria && c.valorMercadoria > 0);
        console.log(`[Step3] Carregados ${allContainers.length} containers de ${data.selectedTrips.length} viagens`);
        console.log(`[Step3] ${containersWithValue.length} containers possuem valor cadastrado`);
        setAvailableContainers(allContainers);

        // Selecionar todos os containers automaticamente se não houver seleção prévia
        if (data.containerTrips.length === 0 && allContainers.length > 0) {
          const allSelected: ContainerTripSelection[] = allContainers.map((container) => {
            const valorPremio = calcularPremio(container.tipoContainer);
            const valorMercadoria = container.valorMercadoria || 0;

            return {
              idContainerTrip: container.idContainerTrip,
              numeroContainer: container.numeroContainer || "",
              tipoContainer: container.tipoContainer,
              navio: container.nomeNavio || container.navio || "",
              viagem: container.numeroViagem || container.viagem || "",
              portoOrigem: container.portoOrigem?.nomePorto || "",
              portoDestino: container.portoDestino?.nomePorto || "",
              dataEmbarque: container.dataEmbarque || "",
              dataChegadaPrevista: container.dataChegadaPrevista || container.dataChegada || "",
              valorMercadoria,
              valorPremio,
            };
          });
          onUpdate({ containerTrips: allSelected });
          console.log(`[Step3] Todos os ${allSelected.length} containers foram selecionados automaticamente com prêmio calculado`);
        }
      } catch (error) {
        console.error("Erro ao carregar containers das viagens:", error);
        showAlert("Erro ao carregar containers das viagens selecionadas.");
      } finally {
        setIsLoadingContainers(false);
      }
    };

    loadContainers();
  }, [data.selectedTrips, showAlert]);

  const handleToggleContainer = (container: ContainerTrip) => {
    const isSelected = data.containerTrips.some(
      (ct) => ct.idContainerTrip === container.idContainerTrip
    );

    if (isSelected) {
      // Remove
      const updatedTrips = data.containerTrips.filter(
        (ct) => ct.idContainerTrip !== container.idContainerTrip
      );
      onUpdate({ containerTrips: updatedTrips });
    } else {
      // Adiciona convertendo ContainerTrip para ContainerTripSelection com prêmio calculado
      const valorPremio = calcularPremio(container.tipoContainer);
      const valorMercadoria = container.valorMercadoria || 0;

      const newTrip: ContainerTripSelection = {
        idContainerTrip: container.idContainerTrip,
        numeroContainer: container.numeroContainer || "",
        tipoContainer: container.tipoContainer,
        navio: container.nomeNavio || container.navio || "",
        viagem: container.numeroViagem || container.viagem || "",
        portoOrigem: container.portoOrigem?.nomePorto || "",
        portoDestino: container.portoDestino?.nomePorto || "",
        dataEmbarque: container.dataEmbarque || "",
        dataChegadaPrevista: container.dataChegadaPrevista || container.dataChegada || "",
        valorMercadoria,
        valorPremio,
      };
      onUpdate({ containerTrips: [...data.containerTrips, newTrip] });
    }
  };

  const handleToggleAll = () => {
    const filtered = getFilteredAvailableContainers();

    // Verificar se todos os trips filtrados já estão selecionados
    const allFilteredSelected = filtered.every((container) =>
      data.containerTrips.some((ct) => ct.idContainerTrip === container.idContainerTrip)
    );

    if (allFilteredSelected) {
      // Desselecionar todos os trips filtrados
      const filteredIds = filtered.map((c) => c.idContainerTrip);
      const updatedTrips = data.containerTrips.filter(
        (ct) => !filteredIds.includes(ct.idContainerTrip)
      );
      onUpdate({ containerTrips: updatedTrips });
    } else {
      // Selecionar todos os trips filtrados
      const newTrips: ContainerTripSelection[] = filtered.map((container) => {
        const valorPremio = calcularPremio(container.tipoContainer);
        const valorMercadoria = container.valorMercadoria || 0;

        return {
          idContainerTrip: container.idContainerTrip,
          numeroContainer: container.numeroContainer || "",
          tipoContainer: container.tipoContainer,
          navio: container.nomeNavio || container.navio || "",
          viagem: container.numeroViagem || container.viagem || "",
          portoOrigem: container.portoOrigem?.nomePorto || "",
          portoDestino: container.portoDestino?.nomePorto || "",
          dataEmbarque: container.dataEmbarque || "",
          dataChegadaPrevista: container.dataChegadaPrevista || container.dataChegada || "",
          valorMercadoria,
          valorPremio,
        };
      });

      // Merge com os já selecionados, evitando duplicatas
      const merged = [...data.containerTrips];
      newTrips.forEach((newTrip) => {
        if (!merged.some((ct) => ct.idContainerTrip === newTrip.idContainerTrip)) {
          merged.push(newTrip);
        }
      });

      onUpdate({ containerTrips: merged });
    }
  };

  const handleSelectAll = () => {
    const filtered = getFilteredAvailableContainers();
    const newTrips: ContainerTripSelection[] = filtered.map((container) => {
      const valorPremio = calcularPremio(container.tipoContainer);
      const valorMercadoria = container.valorMercadoria || 0;

      return {
        idContainerTrip: container.idContainerTrip,
        numeroContainer: container.numeroContainer || "",
        tipoContainer: container.tipoContainer,
        navio: container.nomeNavio || container.navio || "",
        viagem: container.numeroViagem || container.viagem || "",
        portoOrigem: container.portoOrigem?.nomePorto || "",
        portoDestino: container.portoDestino?.nomePorto || "",
        dataEmbarque: container.dataEmbarque || "",
        dataChegadaPrevista: container.dataChegadaPrevista || container.dataChegada || "",
        valorMercadoria,
        valorPremio,
      };
    });

    // Merge com os já selecionados, evitando duplicatas
    const merged = [...data.containerTrips];
    newTrips.forEach((newTrip) => {
      if (!merged.some((ct) => ct.idContainerTrip === newTrip.idContainerTrip)) {
        merged.push(newTrip);
      }
    });

    onUpdate({ containerTrips: merged });
  };

  const handleDeselectAll = () => {
    onUpdate({ containerTrips: [] });
  };

  const handleAddManual = () => {
    setEditingContainer(null);
    setIsModalOpen(true);
  };

  const handleEditContainer = (container: ContainerTripSelection) => {
    setEditingContainer(container);
    setIsModalOpen(true);
  };

  const handleDeleteContainer = (idContainerTrip: number) => {
    const updatedTrips = data.containerTrips.filter(
      (ct) => ct.idContainerTrip !== idContainerTrip
    );
    onUpdate({ containerTrips: updatedTrips });
  };

  const handleSaveContainer = (container: ContainerTripSelection) => {
    let updatedTrips: ContainerTripSelection[];

    if (editingContainer) {
      // Editing existing
      updatedTrips = data.containerTrips.map((ct) =>
        ct.idContainerTrip === container.idContainerTrip ? container : ct
      );
    } else {
      // Adding new
      updatedTrips = [...data.containerTrips, container];
    }

    onUpdate({ containerTrips: updatedTrips });
    setIsModalOpen(false);
  };

  const getFilteredAvailableContainers = () => {
    return availableContainers.filter((trip) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (trip.numeroContainer?.toLowerCase() || "").includes(searchLower) ||
        (trip.tipoContainer?.toLowerCase() || "").includes(searchLower) ||
        (trip.nomeNavio?.toLowerCase() || "").includes(searchLower) ||
        (trip.navio?.toLowerCase() || "").includes(searchLower) ||
        (trip.numeroViagem?.toLowerCase() || "").includes(searchLower) ||
        (trip.viagem?.toLowerCase() || "").includes(searchLower) ||
        (trip.portoOrigem?.nomePorto?.toLowerCase() || "").includes(searchLower) ||
        (trip.portoDestino?.nomePorto?.toLowerCase() || "").includes(searchLower) ||
        (trip.numeroCE?.toLowerCase() || "").includes(searchLower)
      );
    });
  };

  const filteredSelectedContainers = data.containerTrips.filter((ct) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ct.numeroContainer.toLowerCase().includes(searchLower) ||
      ct.navio?.toLowerCase().includes(searchLower) ||
      ct.viagem?.toLowerCase().includes(searchLower) ||
      ct.portoOrigem?.toLowerCase().includes(searchLower) ||
      ct.portoDestino?.toLowerCase().includes(searchLower)
    );
  });

  const totalValorMercadoria = data.containerTrips.reduce(
    (sum, ct) => sum + (ct.valorMercadoria || 0),
    0
  );

  const totalValorPremio = data.containerTrips.reduce(
    (sum, ct) => sum + (ct.valorPremio || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Seleção de Containers</h3>
          <p className="text-sm text-zinc-600">
            Selecione os containers cadastrados ou adicione manualmente.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddManual}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Adicionar Manual
        </button>
      </div>


      {/* Tabs - Estilo navegador ocupando toda largura */}
      <div className={`flex items-stretch -mx-6 -mt-6 ${
        viewMode === "available" ? "bg-blue-50" : "bg-emerald-50"
      }`}>
        <button
          type="button"
          onClick={() => setViewMode("available")}
          className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold transition-all relative ${
            viewMode === "available"
              ? "text-blue-800"
              : "bg-white/60 text-zinc-500 hover:bg-white/80 hover:text-zinc-700 rounded-tl-lg"
          }`}
        >
          <Package className={`h-5 w-5 ${viewMode === "available" ? "text-blue-600" : ""}`} />
          <span>Containers Disponíveis</span>
          <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold min-w-[28px] ${
            viewMode === "available"
              ? "bg-blue-600 text-white"
              : "bg-zinc-300 text-zinc-600"
          }`}>
            {availableContainers.length}
          </span>
          {viewMode === "available" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setViewMode("selected")}
          className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold transition-all relative ${
            viewMode === "selected"
              ? "text-emerald-800"
              : "bg-white/60 text-zinc-500 hover:bg-white/80 hover:text-zinc-700 rounded-tr-lg"
          }`}
        >
          <CheckSquare className={`h-5 w-5 ${viewMode === "selected" ? "text-emerald-600" : ""}`} />
          <span>Selecionados</span>
          <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold min-w-[28px] ${
            viewMode === "selected"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-300 text-zinc-600"
          }`}>
            {data.containerTrips.length}
          </span>
          {viewMode === "selected" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" />
          )}
        </button>
      </div>

      {/* Background da aba ativa - funde com o conteúdo */}
      <div className={`-mx-6 px-6 pt-6 pb-6 space-y-4 ${
        viewMode === "available"
          ? "bg-blue-50"
          : "bg-emerald-50"
      }`}>

      {/* Search and Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número, tipo, navio, viagem ou porto..."
            className="block w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        {viewMode === "available" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isLoadingContainers}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white disabled:opacity-50"
            >
              Selecionar Todos
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={data.containerTrips.length === 0}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white disabled:opacity-50"
            >
              Limpar Seleção
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoadingContainers ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          Carregando containers disponíveis...
        </div>
      ) : viewMode === "available" ? (
        <AvailableContainersView
          containers={getFilteredAvailableContainers()}
          selectedContainers={data.containerTrips}
          onToggle={handleToggleContainer}
          onToggleAll={handleToggleAll}
        />
      ) : (
        <SelectedContainersView
          containers={filteredSelectedContainers}
          onEdit={handleEditContainer}
          onDelete={handleDeleteContainer}
        />
      )}
      </div>

      {isModalOpen && (
        <ContainerTripModal
          container={editingContainer}
          onSave={handleSaveContainer}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// Componente para visualização de containers disponíveis
interface AvailableContainersViewProps {
  containers: ContainerTrip[];
  selectedContainers: ContainerTripSelection[];
  onToggle: (container: ContainerTrip) => void;
  onToggleAll: () => void;
}

function AvailableContainersView({
  containers,
  selectedContainers,
  onToggle,
  onToggleAll,
}: AvailableContainersViewProps) {
  if (containers.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 py-12 text-center">
        <Package className="mx-auto h-12 w-12 text-zinc-400" />
        <h4 className="mt-3 text-sm font-semibold text-zinc-900">
          Nenhum container disponível
        </h4>
        <p className="mt-1 text-sm text-zinc-600">
          Não foram encontrados containers para os critérios selecionados.
        </p>
      </div>
    );
  }

  // Verificar se todos os trips visíveis estão selecionados
  const allSelected = containers.length > 0 && containers.every((container) =>
    selectedContainers.some((ct) => ct.idContainerTrip === container.idContainerTrip)
  );

  // Verificar se alguns (mas não todos) estão selecionados
  const someSelected = !allSelected && containers.some((container) =>
    selectedContainers.some((ct) => ct.idContainerTrip === container.idContainerTrip)
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="w-12 px-4 py-3 text-center align-middle">
              <div className="flex items-center justify-center h-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAll();
                  }}
                  className="inline-flex items-center justify-center"
                  title={allSelected ? "Desselecionar todos" : "Selecionar todos"}
                >
                  {allSelected ? (
                    <CheckSquare className="h-5 w-5 text-emerald-600" />
                  ) : someSelected ? (
                    <CheckSquare className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Square className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                  )}
                </button>
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Container
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Navio / Viagem
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Rota
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Data Embarque
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Valor Mercadoria
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {containers.map((trip) => {
            const isSelected = selectedContainers.some(
              (ct) => ct.idContainerTrip === trip.idContainerTrip
            );

            return (
              <tr
                key={trip.idContainerTrip}
                onClick={() => onToggle(trip)}
                className={`cursor-pointer transition ${
                  isSelected ? "bg-emerald-50" : "hover:bg-zinc-50"
                }`}
              >
                <td className="px-4 py-3 text-center align-middle">
                  <div className="flex items-center justify-center">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Square className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                  {trip.numeroContainer || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                  {trip.tipoContainer || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                  {trip.nomeNavio || trip.navio || "—"}
                  {(trip.numeroViagem || trip.viagem) && (
                    <span className="ml-1 text-xs text-zinc-500">
                      ({trip.numeroViagem || trip.viagem})
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                  {trip.portoOrigem?.nomePorto || "—"} → {trip.portoDestino?.nomePorto || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                  {trip.dataEmbarque ? formatDate(trip.dataEmbarque) : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-700">
                  {trip.valorMercadoria ? formatCurrency(trip.valorMercadoria) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Componente para visualização de containers selecionados
interface SelectedContainersViewProps {
  containers: ContainerTripSelection[];
  onEdit: (container: ContainerTripSelection) => void;
  onDelete: (id: number) => void;
}

function SelectedContainersView({
  containers,
  onEdit,
  onDelete,
}: SelectedContainersViewProps) {
  if (containers.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 py-12 text-center">
        <Package className="mx-auto h-12 w-12 text-zinc-400" />
        <h4 className="mt-3 text-sm font-semibold text-zinc-900">
          Nenhum container selecionado
        </h4>
        <p className="mt-1 text-sm text-zinc-600">
          Vá para a aba "Containers Disponíveis" para selecionar containers.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Container
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Navio / Viagem
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Origem → Destino
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Embarque
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Valor Mercadoria
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Prêmio
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {containers.map((container) => (
            <tr key={container.idContainerTrip} className="hover:bg-zinc-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                {container.numeroContainer}
                {container.tipoContainer && (
                  <span className="ml-2 text-xs text-zinc-500">
                    ({container.tipoContainer})
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                {container.navio && (
                  <div className="flex items-center gap-1">
                    <Ship className="h-3 w-3 text-zinc-400" />
                    <span>{container.navio}</span>
                  </div>
                )}
                {container.viagem && (
                  <div className="text-xs text-zinc-500">{container.viagem}</div>
                )}
                {!container.navio && !container.viagem && (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                {container.portoOrigem || "—"} → {container.portoDestino || "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                {container.dataEmbarque ? formatDate(container.dataEmbarque) : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-700">
                {container.valorMercadoria ? formatCurrency(container.valorMercadoria) : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-700">
                {container.valorPremio ? formatCurrency(container.valorPremio) : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(container)}
                    className="text-emerald-600 transition hover:text-emerald-700"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(container.idContainerTrip)}
                    className="text-rose-600 transition hover:text-rose-700"
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
  );
}

// Modal para adicionar/editar container
interface ContainerTripModalProps {
  container: ContainerTripSelection | null;
  onSave: (container: ContainerTripSelection) => void;
  onClose: () => void;
}

function ContainerTripModal({ container, onSave, onClose }: ContainerTripModalProps) {
  const isEdit = !!container;

  const [formData, setFormData] = useState<ContainerTripSelection>(
    container || {
      idContainerTrip: Date.now(),
      numeroContainer: "",
      navio: "",
      viagem: "",
      portoOrigem: "",
      portoDestino: "",
      dataEmbarque: "",
      dataChegadaPrevista: "",
      valorMercadoria: 0,
      valorPremio: 0,
      tipoContainer: "",
    }
  );

  const handleChange = (field: keyof ContainerTripSelection, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? "Editar Container" : "Adicionar Container"}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">
                Número do Container <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.numeroContainer}
                onChange={(e) => handleChange("numeroContainer", e.target.value)}
                required
                placeholder="Ex: ABCD1234567"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Tipo de Container</label>
              <input
                type="text"
                value={formData.tipoContainer || ""}
                onChange={(e) => handleChange("tipoContainer", e.target.value)}
                placeholder="Ex: 40' HC"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Navio</label>
              <input
                type="text"
                value={formData.navio || ""}
                onChange={(e) => handleChange("navio", e.target.value)}
                placeholder="Nome do navio"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Viagem</label>
              <input
                type="text"
                value={formData.viagem || ""}
                onChange={(e) => handleChange("viagem", e.target.value)}
                placeholder="Número da viagem"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Porto de Origem</label>
              <input
                type="text"
                value={formData.portoOrigem || ""}
                onChange={(e) => handleChange("portoOrigem", e.target.value)}
                placeholder="Ex: Santos"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Porto de Destino</label>
              <input
                type="text"
                value={formData.portoDestino || ""}
                onChange={(e) => handleChange("portoDestino", e.target.value)}
                placeholder="Ex: Rotterdam"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Data de Embarque</label>
              <input
                type="date"
                value={formData.dataEmbarque || ""}
                onChange={(e) => handleChange("dataEmbarque", e.target.value)}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">
                Data de Chegada Prevista
              </label>
              <input
                type="date"
                value={formData.dataChegadaPrevista || ""}
                onChange={(e) => handleChange("dataChegadaPrevista", e.target.value)}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Valor da Mercadoria</label>
              <input
                type="number"
                step="0.01"
                value={formData.valorMercadoria || ""}
                onChange={(e) => handleChange("valorMercadoria", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Valor do Prêmio</label>
              <input
                type="number"
                step="0.01"
                value={formData.valorPremio || ""}
                onChange={(e) => handleChange("valorPremio", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            {isEdit ? "Salvar Alterações" : "Adicionar"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

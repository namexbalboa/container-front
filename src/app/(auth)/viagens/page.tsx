"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Ship, Package, Calendar, MapPin, Container as ContainerIcon } from "lucide-react";
import { MagnifyingGlassIcon, EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ContainerTrip, StatusViagem, Modal, OrigemDados, ContainerTripFilters, Container } from "@/types/api";
import { apiService } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAlert } from "@/contexts/AlertContext";
import { usePermissions } from "@/hooks/use-permissions";
import type { ModuloSistema } from "@/types/api";

export default function ViagensPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { permissions, canUpdate, canDelete } = usePermissions();
  const [viagens, setViagens] = useState<ContainerTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalFilter, setModalFilter] = useState<string>("all");
  const [origemFilter, setOrigemFilter] = useState<string>("all");

  const tripModules: ModuloSistema[] = ["CONTAINERS"];
  const canEditTrip = tripModules.some((module) => canUpdate(module));
  const canRemoveTrip = tripModules.some((module) => canDelete(module));
  const shouldEnforcePermissions = permissions.length > 0;

  // Estado para o modal de containers
  const [selectedContainers, setSelectedContainers] = useState<Array<{
    idCeContainer: number;
    nrContainer: string;
    sequencia: number;
    ativo: boolean;
    tipoContainer?: string;
  }>>([]);
  const [selectedViagemCE, setSelectedViagemCE] = useState<string>("");
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [loadingContainers, setLoadingContainers] = useState(false);

  useEffect(() => {
    loadViagens();
  }, [statusFilter, modalFilter, origemFilter]);

  async function loadViagens() {
    try {
      setLoading(true);
      const filters: ContainerTripFilters = {};

      if (statusFilter !== "all") filters.statusViagem = statusFilter as StatusViagem;
      if (modalFilter !== "all") filters.modal = modalFilter as Modal;
      if (origemFilter !== "all") filters.origemDados = origemFilter as OrigemDados;

      const response = await apiService.getTrips(filters);

      // Handle both paginated and direct array responses
      const trips = response.data?.items || (Array.isArray(response.data) ? response.data : []);
      setViagens(trips);
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: StatusViagem) {
    const statusConfig: Record<
      StatusViagem,
      { label: string; className: string }
    > = {
      planejada: { label: "Planejada", className: "bg-blue-500" },
      em_transito: { label: "Em Trânsito", className: "bg-yellow-500" },
      chegada: { label: "Chegada", className: "bg-green-500" },
      descarregado: { label: "Descarregado", className: "bg-purple-500" },
      finalizada: { label: "Finalizada", className: "bg-gray-500" },
      cancelada: { label: "Cancelada", className: "bg-red-500" },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  }

  function getModalIcon(modal: Modal) {
    switch (modal) {
      case "M":
        return <Ship className="h-4 w-4" />;
      case "T":
        return <Package className="h-4 w-4" />;
      case "A":
        return <Package className="h-4 w-4" />;
    }
  }

  function getOrigemBadge(origem: OrigemDados) {
    const config: Record<OrigemDados, { label: string; className: string }> = {
      SISCOMEX: { label: "SISCOMEX", className: "bg-emerald-500" },
      MANUAL: { label: "Manual", className: "bg-blue-500" },
      API: { label: "API", className: "bg-purple-500" },
    };

    const conf = config[origem];
    return <Badge className={conf.className}>{conf.label}</Badge>;
  }

  const filteredViagens = viagens.filter((viagem) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      viagem.numeroCE?.toLowerCase().includes(search) ||
      viagem.numeroConhecimento?.toLowerCase().includes(search) ||
      viagem.nomeNavio?.toLowerCase().includes(search) ||
      viagem.armador?.toLowerCase().includes(search)
    );
  });

  async function handleDelete(viagem: ContainerTrip) {
    if (!shouldEnforcePermissions || canRemoveTrip) {
      const tripLabel = viagem.numeroCE || viagem.numeroConhecimento || `ID ${viagem.idContainerTrip}`;
      const confirmed = window.confirm(`Tem certeza que deseja excluir a viagem "${tripLabel}"?`);

      if (!confirmed) return;

      try {
        const response = await apiService.deleteTrip(viagem.idContainerTrip);

        if (!response.success) {
          throw new Error(response.message || "Não foi possível excluir a viagem.");
        }

        showAlert("Viagem excluída com sucesso.");
        loadViagens(); // Recarrega a lista
      } catch (error) {
        console.error("Erro ao excluir viagem:", error);
        const message = error instanceof Error ? error.message : "Erro inesperado ao excluir a viagem.";
        showAlert(message);
      }
    } else {
      showAlert("Você não tem permissão para excluir viagens.");
    }
  }

  async function handleViewContainers(numeroCE: string) {
    if (!numeroCE) {
      showAlert("Número CE não disponível para esta viagem.");
      return;
    }

    try {
      setLoadingContainers(true);
      setContainerModalOpen(true);
      setSelectedViagemCE(numeroCE);

      const response = await apiService.getContainersByCE(numeroCE);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Não foi possível carregar os containers.");
      }

      setSelectedContainers(response.data.containers || []);
    } catch (error) {
      console.error("Erro ao carregar containers:", error);
      const message = error instanceof Error ? error.message : "Erro inesperado ao carregar os containers.";
      showAlert(message);
      setContainerModalOpen(false);
    } finally {
      setLoadingContainers(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Viagens de Containers</h1>
          <p className="text-muted-foreground">
            Gerencie e monitore as viagens dos containers
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo de busca em linha separada */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Buscar</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="CE, BL, Navio, Armador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtros em grid de 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="planejada">Planejada</SelectItem>
                  <SelectItem value="em_transito">Em Trânsito</SelectItem>
                  <SelectItem value="chegada">Chegada</SelectItem>
                  <SelectItem value="descarregado">Descarregado</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Modal</label>
              <Select value={modalFilter} onValueChange={setModalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="M">Marítimo</SelectItem>
                  <SelectItem value="T">Terrestre</SelectItem>
                  <SelectItem value="A">Aéreo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Origem</label>
              <Select value={origemFilter} onValueChange={setOrigemFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="SISCOMEX">SISCOMEX</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Viagens */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredViagens.length} viagen
            {filteredViagens.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Clique em uma viagem para ver os detalhes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredViagens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma viagem encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CE / BL</TableHead>
                    <TableHead>Navio</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Embarque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Modal</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredViagens.map((viagem) => (
                    <TableRow
                      key={viagem.idContainerTrip}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="space-y-1">
                          {viagem.numeroCE && (
                            <div className="font-medium">{viagem.numeroCE}</div>
                          )}
                          {viagem.numeroConhecimento && (
                            <div className="text-sm text-muted-foreground">
                              {viagem.numeroConhecimento}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {viagem.nomeNavio || "N/A"}
                          </div>
                          {viagem.armador && (
                            <div className="text-sm text-muted-foreground">
                              {viagem.armador}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            {viagem.portoOrigemCodigo || "???"} →{" "}
                            {viagem.portoDestinoCodigo || "???"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(
                            new Date(viagem.dataEmbarque),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(viagem.statusViagem)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getModalIcon(viagem.modal)}
                          <span className="text-sm">
                            {viagem.modal === "M"
                              ? "Marítimo"
                              : viagem.modal === "T"
                                ? "Terrestre"
                                : "Aéreo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getOrigemBadge(viagem.origemDados)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/viagens/${viagem.idContainerTrip}`)}
                            title="Ver Detalhes da Viagem"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewContainers(viagem.numeroCE || "")}
                            title="Ver Containers"
                            disabled={!viagem.numeroCE}
                          >
                            <ContainerIcon className="h-4 w-4" />
                          </Button>
                          {(!shouldEnforcePermissions || canEditTrip) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/viagens/${viagem.idContainerTrip}/editar`)}
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {(!shouldEnforcePermissions || canRemoveTrip) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(viagem);
                              }}
                              title="Deletar"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Lista de Containers */}
      <Dialog open={containerModalOpen} onOpenChange={setContainerModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Containers da Viagem</DialogTitle>
            <DialogDescription>
              {selectedViagemCE && `CE Mercante: ${selectedViagemCE}`}
            </DialogDescription>
          </DialogHeader>

          {loadingContainers ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : selectedContainers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Total: {selectedContainers.length} container{selectedContainers.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Seq.</TableHead>
                      <TableHead>Número do Container (ISO 6346)</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedContainers.map((container) => (
                      <TableRow key={container.idCeContainer}>
                        <TableCell className="font-medium">
                          {container.sequencia}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {container.nrContainer}
                        </TableCell>
                        <TableCell>
                          {container.tipoContainer || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={container.ativo ? "default" : "secondary"}
                            className={container.ativo ? "bg-green-600" : "bg-gray-500"}
                          >
                            {container.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-xs text-muted-foreground border-t pt-3">
                <p>
                  <strong>Nota:</strong> Os containers listados seguem o padrão ISO 6346
                  (4 letras + 7 dígitos) e são vinculados ao CE Mercante desta viagem.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ContainerIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum container encontrado para esta viagem</p>
              <p className="text-xs mt-2">
                Os containers podem ser adicionados ao editar a viagem
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

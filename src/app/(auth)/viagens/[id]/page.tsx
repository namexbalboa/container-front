"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Ship,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Database,
  User,
  Building,
  Pencil,
  Trash,
} from "lucide-react";
import { ContainerTrip } from "@/types/api";
import type { ModuloSistema } from "@/types/api";
import { useApi } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { useAlert } from "@/contexts/AlertContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ViagemDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const api = useApi();
  const { showAlert } = useAlert();
  const { permissions, canRead, canUpdate, canDelete } = usePermissions();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params.id;
  const viagemId = Number(rawId);
  const [viagem, setViagem] = useState<ContainerTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tripModules: ModuloSistema[] = ["CONTAINERS"];
  const hasReadPermission = tripModules.some((module) => canRead(module));
  const canEditTrip = tripModules.some((module) => canUpdate(module));
  const canRemoveTrip = tripModules.some((module) => canDelete(module));
  const shouldEnforcePermissions = permissions.length > 0;
  const allowEdit = !shouldEnforcePermissions || canEditTrip;
  const allowDelete = !shouldEnforcePermissions || canRemoveTrip;

  const loadViagem = useCallback(async () => {
    if (Number.isNaN(viagemId)) {
      setError("Identificador da viagem inválido.");
      setViagem(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.getTrip(viagemId);

      if (response.success && response.data) {
        setViagem(response.data);
      } else {
        throw new Error(response.message || "Não foi possível carregar a viagem.");
      }
    } catch (error) {
      console.error("Erro ao carregar viagem:", error);
      setViagem(null);
      setError(error instanceof Error ? error.message : "Erro inesperado ao carregar a viagem.");
    } finally {
      setLoading(false);
    }
  }, [api, viagemId]);

  useEffect(() => {
    if (shouldEnforcePermissions && !hasReadPermission) {
      setLoading(false);
      return;
    }
    loadViagem();
  }, [shouldEnforcePermissions, hasReadPermission, loadViagem]);

  const handleDelete = async () => {
    if (!viagem) return;

    if (shouldEnforcePermissions && !canRemoveTrip) {
      showAlert("Você não tem permissão para excluir viagens.");
      return;
    }

    const tripLabel = viagem.numeroCE || viagem.numeroConhecimento || `ID ${viagem.idContainerTrip}`;
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(`Tem certeza que deseja excluir a viagem "${tripLabel}"?`)
        : false;

    if (!confirmed) {
      return;
    }

    try {
      const response = await api.deleteTrip(viagemId);

      if (!response.success) {
        throw new Error(response.message || "Não foi possível excluir a viagem.");
      }

      showAlert("Viagem excluída com sucesso.");
      router.push("/viagens");
    } catch (error) {
      console.error("Erro ao excluir viagem:", error);
      const message = error instanceof Error ? error.message : "Erro inesperado ao excluir a viagem.";
      showAlert(message);
    }
  };

  if (shouldEnforcePermissions && !hasReadPermission) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-lg font-semibold text-gray-900">Acesso negado</p>
            <p className="text-sm text-muted-foreground">
              Você não possui permissão para visualizar as viagens de containers.
            </p>
            <Button onClick={() => router.push("/viagens")}>Voltar para viagens</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-semibold text-gray-900">Não foi possível carregar a viagem</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push("/viagens")}>Voltar</Button>
              <Button variant="outline" onClick={loadViagem}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!viagem) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Viagem não encontrada</p>
            <Button onClick={() => router.push("/viagens")} className="mt-4">
              Voltar para viagens
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function formatCurrency(value: number | null | undefined, currency: string = "BRL") {
    if (!value) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/viagens")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {viagem.numeroCE || viagem.numeroConhecimento || "Viagem"}
            </h1>
            <p className="text-muted-foreground">
              Detalhes da viagem de container
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-2">
            <Badge
              className={
                viagem.statusViagem === "planejada"
                  ? "bg-blue-500"
                  : viagem.statusViagem === "em_transito"
                    ? "bg-yellow-500"
                    : viagem.statusViagem === "chegada"
                      ? "bg-green-500"
                      : viagem.statusViagem === "finalizada"
                        ? "bg-gray-500"
                        : "bg-red-500"
              }
            >
              {viagem.statusViagem}
            </Badge>
            <Badge
              className={
                viagem.origemDados === "SISCOMEX"
                  ? "bg-emerald-500"
                  : viagem.origemDados === "MANUAL"
                    ? "bg-blue-500"
                    : "bg-purple-500"
              }
            >
              {viagem.origemDados}
            </Badge>
          </div>
          {(allowEdit || allowDelete) && (
            <div className="flex items-center gap-2">
              {allowEdit && (
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => router.push(`/viagens/${viagem.idContainerTrip}/editar`)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {allowDelete && (
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={handleDelete}
                >
                  <Trash className="h-4 w-4" />
                  Excluir
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {viagem.numeroCE && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Número CE
                </label>
                <p className="text-lg">{viagem.numeroCE}</p>
              </div>
            )}
            {viagem.numeroConhecimento && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Número de Conhecimento (BL)
                </label>
                <p className="text-lg">{viagem.numeroConhecimento}</p>
              </div>
            )}
            {viagem.tipoConhecimento && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo de Conhecimento
                </label>
                <p>{viagem.tipoConhecimento}</p>
              </div>
            )}
            {viagem.booking && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Booking
                </label>
                <p>{viagem.booking}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Embarcação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Embarcação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Navio
              </label>
              <p className="text-lg">{viagem.nomeNavio || "N/A"}</p>
            </div>
            {viagem.numeroViagem && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Número da Viagem
                </label>
                <p>{viagem.numeroViagem}</p>
              </div>
            )}
            {viagem.armador && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Armador
                </label>
                <p>{viagem.armador}</p>
              </div>
            )}
            {viagem.navioImo && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  IMO
                </label>
                <p>{viagem.navioImo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rota */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Rota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Porto de Origem
              </label>
              <p className="text-lg">
                {viagem.portoOrigemCodigo || viagem.portoOrigem?.nomePorto || "N/A"}
              </p>
              {viagem.terminalCarregamento && (
                <p className="text-sm text-muted-foreground">
                  {viagem.terminalCarregamento}
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <div className="h-px w-full bg-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Porto de Destino
              </label>
              <p className="text-lg">
                {viagem.portoDestinoCodigo || viagem.portoDestino?.nomePorto || "N/A"}
              </p>
              {viagem.terminalDescarga && (
                <p className="text-sm text-muted-foreground">
                  {viagem.terminalDescarga}
                </p>
              )}
            </div>
            {viagem.houveTransbordo && (
              <>
                <Separator />
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-sm font-medium">Transbordo</p>
                  {viagem.portoTransbordo && (
                    <p className="text-sm text-muted-foreground">
                      Porto: {viagem.portoTransbordo}
                    </p>
                  )}
                  {viagem.navioTransbordo && (
                    <p className="text-sm text-muted-foreground">
                      Navio: {viagem.navioTransbordo}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Data de Embarque
              </label>
              <p className="text-lg">
                {format(new Date(viagem.dataEmbarque), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
            {viagem.dataChegadaPrevista && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Chegada Prevista
                </label>
                <p>
                  {format(new Date(viagem.dataChegadaPrevista), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
            {viagem.dataChegada && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Chegada Real
                </label>
                <p>
                  {format(new Date(viagem.dataChegada), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
            {viagem.dataDescarregamento && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Data de Descarregamento
                </label>
                <p>
                  {format(new Date(viagem.dataDescarregamento), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carga */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Carga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Descrição
                </label>
                <p>{viagem.descricaoMercadoria || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Quantidade de Volumes
                </label>
                <p>{viagem.quantidadeVolumes || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Categoria
                </label>
                <p>{viagem.categoriaCarga || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Peso Bruto (kg)
                </label>
                <p>{viagem.pesoBrutoKg?.toLocaleString("pt-BR") || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Cubagem (m³)
                </label>
                <p>{viagem.cubagem || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Valor da Mercadoria
                </label>
                <p className="text-lg font-semibold">
                  {formatCurrency(viagem.valorMercadoria, viagem.moedaMercadoria || "BRL")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Embarcador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{viagem.embarcadorNome || "N/A"}</p>
              {viagem.embarcadorCNPJ && (
                <p className="text-sm text-muted-foreground">
                  CNPJ: {viagem.embarcadorCNPJ}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Consignatário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{viagem.consignatarioNome || "N/A"}</p>
              {viagem.consignatarioCNPJ && (
                <p className="text-sm text-muted-foreground">
                  CNPJ: {viagem.consignatarioCNPJ}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Frete */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Frete e Taxas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Valor do Frete
                </label>
                <p className="text-lg font-semibold">
                  {formatCurrency(viagem.valorFrete, viagem.moedaFrete || "USD")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Modalidade
                </label>
                <p>{viagem.modalidadeFrete || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo de Pagamento
                </label>
                <p>{viagem.tipoPagamentoFrete || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Free Time (dias)
                </label>
                <p>{viagem.freeTime || "N/A"}</p>
              </div>
            </div>

            {viagem.taxasAdicionais && viagem.taxasAdicionais.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-medium mb-3">Taxas Adicionais</h4>
                  <div className="space-y-2">
                    {viagem.taxasAdicionais.map((taxa, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 bg-muted/50 rounded"
                      >
                        <div>
                          <p className="font-medium">{taxa.tipo}</p>
                          <p className="text-sm text-muted-foreground">
                            {taxa.pagamento}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(taxa.valor, taxa.moeda)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Containers */}
        {viagem.containers && viagem.containers.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Containers ({viagem.containers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {viagem.containers.map((container) => (
                  <div
                    key={container.idCeContainer}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {container.sequencia}
                        </span>
                        <div>
                          <p className="font-mono font-semibold text-lg">
                            {container.nrContainer}
                          </p>
                          {container.tipoContainer && (
                            <p className="text-sm text-muted-foreground">
                              {container.tipoContainer.tipoContainer} - {container.tipoContainer.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {container.tipoContainer && (
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Capacidade</p>
                          <p className="font-medium">
                            {container.tipoContainer.pesoMaximoKg} kg
                          </p>
                          <p className="text-muted-foreground">
                            {container.tipoContainer.volumeM3} m³
                          </p>
                        </div>
                      )}
                      <Badge
                        variant={container.ativo ? "default" : "secondary"}
                      >
                        {container.statusContainer}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados SISCOMEX */}
        {viagem.siscomexSyncAt && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sincronização SISCOMEX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Última Sincronização
                </label>
                <p>
                  {format(new Date(viagem.siscomexSyncAt), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              {viagem.siscomexSyncData && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Dados Adicionais
                  </label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(viagem.siscomexSyncData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}




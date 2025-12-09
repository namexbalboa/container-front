"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";

import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import type {
  Averbacao,
  AverbacaoFilters,
  AverbacaoStatus,
  Cliente,
  Seguradora,
} from "@/types/api";

type FiltersState = {
  search: string;
  status: string;
  clienteId: string;
  seguradoraId: string;
  dataInicio: string;
  dataFim: string;
};

type PaginationState = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

const defaultFilters: FiltersState = {
  search: "",
  status: "",
  clienteId: "",
  seguradoraId: "",
  dataInicio: "",
  dataFim: "",
};

const statusMeta: Record<AverbacaoStatus | "DEFAULT", { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-blue-100 text-blue-800" },
  aprovada: { label: "Aprovada", className: "bg-emerald-100 text-emerald-700" },
  rejeitada: { label: "Rejeitada", className: "bg-rose-100 text-rose-700" },
  cancelada: { label: "Cancelada", className: "bg-gray-100 text-gray-600" },
  DEFAULT: { label: "Indefinido", className: "bg-zinc-100 text-zinc-700" },
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function AverbacoesPage() {
  const { data: session } = useSession();
  const { showAlert } = useAlert();

  const [averbacoes, setAverbacoes] = useState<Averbacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; averbacaoId: number | null }>({
    isOpen: false,
    averbacaoId: null,
  });

  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [activeFilters, setActiveFilters] = useState<FiltersState>(defaultFilters);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const filtersKey = useMemo(() => JSON.stringify(activeFilters), [activeFilters]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const loadCombos = async () => {
      try {
        const [clientesResponse, seguradorasResponse] = await Promise.all([
          apiService.getClientes({ page: 1, limit: 100 }),
          apiService.getSeguradoras({ page: 1, limit: 100 }),
        ]);

        if (clientesResponse.success && clientesResponse.data) {
          setClientes(clientesResponse.data.items);
        }

        if (seguradorasResponse.success && seguradorasResponse.data) {
          setSeguradoras(seguradorasResponse.data.items);
        }
      } catch (error) {
        console.error("Erro ao carregar combos de averbações:", error);
        showAlert("Erro ao carregar dados auxiliares.");
      }
    };

    loadCombos();
  }, [session?.accessToken, showAlert]);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetchAverbacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, pagination.page, pagination.limit, filtersKey]);

  const fetchAverbacoes = async () => {
    setIsLoading(true);
    try {
      const params: Partial<AverbacaoFilters> = {
        page: pagination.page,
        limit: pagination.limit,
        status: activeFilters.status ? (activeFilters.status as AverbacaoStatus) : undefined,
        clienteId: activeFilters.clienteId ? Number(activeFilters.clienteId) : undefined,
        seguradoraId: activeFilters.seguradoraId ? Number(activeFilters.seguradoraId) : undefined,
        dataInicio: activeFilters.dataInicio || undefined,
        dataFim: activeFilters.dataFim || undefined,
        search: activeFilters.search || undefined,
        numero: activeFilters.search || undefined,
      };

      const response = await apiService.getAverbacoes(params);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Resposta inválida da API");
      }

      setAverbacoes(response.data.items ?? []);

      const apiPagination = response.data.pagination;
      if (apiPagination) {
        setPagination((prev) => ({
          page: apiPagination.currentPage ?? apiPagination.page ?? prev.page,
          limit: apiPagination.itemsPerPage ?? apiPagination.limit ?? prev.limit,
          totalItems: apiPagination.totalItems ?? apiPagination.total ?? 0,
          totalPages: apiPagination.totalPages ?? apiPagination.pages ?? 0,
        }));
      } else {
        setPagination((prev) => ({
          ...prev,
          totalItems: response.data.items?.length ?? 0,
          totalPages: 1,
        }));
      }
    } catch (error) {
      console.error("Erro ao listar averbações:", error);
      showAlert("Erro ao listar averbações.");
      setAverbacoes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(event.target.value) || 10;
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const getStatusMeta = (status?: string) =>
    statusMeta[(status as AverbacaoStatus) || "DEFAULT"] ?? statusMeta.DEFAULT;

  const getClienteNome = (averbacao: Averbacao) => {
    if (averbacao.cliente?.razaoSocial) return averbacao.cliente.razaoSocial;
    const cliente = clientes.find((item) => item.idCliente === averbacao.clienteId);
    return cliente?.razaoSocial ?? "—";
  };

  const getSeguradoraNome = (averbacao: Averbacao) => {
    // Usar campo calculado do backend
    if (averbacao.nomeSeguradora) return averbacao.nomeSeguradora;
    if (averbacao.apolice?.seguradora?.nomeSeguradora) return averbacao.apolice.seguradora.nomeSeguradora;
    if (averbacao.seguradora?.nomeSeguradora) return averbacao.seguradora.nomeSeguradora;
    const seguradora = seguradoras.find((item) => item.idSeguradora === averbacao.seguradoraId);
    return seguradora?.nomeSeguradora ?? "—";
  };

  const getPeriodoLabel = (averbacao: Averbacao) => {
    if (averbacao.periodoInicio && averbacao.periodoFim) {
      return `${formatDate(averbacao.periodoInicio)} a ${formatDate(averbacao.periodoFim)}`;
    }
    if (averbacao.dataAverbacao) {
      return formatDate(averbacao.dataAverbacao);
    }
    return "—";
  };

  const getContainersCount = (averbacao: Averbacao) => {
    // Usar campo calculado do backend
    if (typeof averbacao.quantidadeContainers === "number") return averbacao.quantidadeContainers;
    if (averbacao.containers?.length) return averbacao.containers.length;
    if (averbacao.containerTrips?.length) return averbacao.containerTrips.length;
    return averbacao.numeroContainer ? 1 : 0;
  };

  const getValorSegurado = (averbacao: Averbacao) => {
    // Usar importanciaSegurada do backend
    const importancia = averbacao.importanciaSegurada;
    if (importancia !== null && importancia !== undefined) {
      return toNumber(importancia);
    }
    if (typeof averbacao.valorMercadoriaTotal === "number") {
      return averbacao.valorMercadoriaTotal;
    }
    if (averbacao.containers?.length) {
      return averbacao.containers.reduce(
        (acc, container) => acc + toNumber(container.valorMercadoria),
        0,
      );
    }
    if (averbacao.containerTrips?.length) {
      return averbacao.containerTrips.reduce(
        (acc, container) => acc + toNumber(container.valorMercadoria),
        0,
      );
    }
    return toNumber(averbacao.valorMercadoria);
  };

  const handleDeleteClick = (averbacaoId: number) => {
    setDeleteModal({ isOpen: true, averbacaoId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.averbacaoId) return;

    try {
      const response = await apiService.deleteAverbacao(deleteModal.averbacaoId);

      if (response.success) {
        showAlert("Averbação excluída com sucesso!");
        setDeleteModal({ isOpen: false, averbacaoId: null });
        fetchAverbacoes();
      } else {
        throw new Error(response.error || "Erro ao excluir averbação");
      }
    } catch (error) {
      console.error("Erro ao excluir averbação:", error);
      showAlert(error instanceof Error ? error.message : "Erro ao excluir averbação");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, averbacaoId: null });
  };

  const renderEmptyState = () => (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-16 text-center">
      <h3 className="text-lg font-semibold text-zinc-800">Nenhuma averbação encontrada</h3>
      <p className="mt-2 text-sm text-zinc-500">
        Ajuste os filtros ou crie uma nova averbação para começar.
      </p>
      <div className="mt-6">
        <Link
          href="/averbacoes/nova"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Nova averbação
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Averbações</h1>
          <p className="text-sm text-zinc-600">
            Gere e acompanhe averbações consolidadas por empresa e período.
          </p>
        </div>
        <Link
          href="/averbacoes/nova"
          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Nova averbação
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label htmlFor="search" className="text-sm font-medium text-zinc-700">
                Buscar (número ou referência)
              </label>
              <input
                id="search"
                name="search"
                type="text"
                value={filters.search}
                onChange={handleInputChange}
                placeholder="Ex: AVB-2025-001"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium text-zinc-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="aprovada">Aprovada</option>
                <option value="rejeitada">Rejeitada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="clienteId" className="text-sm font-medium text-zinc-700">
                Empresa
              </label>
              <select
                id="clienteId"
                name="clienteId"
                value={filters.clienteId}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Todas</option>
                {clientes.map((cliente) => (
                  <option key={cliente.idCliente} value={cliente.idCliente}>
                    {cliente.razaoSocial}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="seguradoraId" className="text-sm font-medium text-zinc-700">
                Seguradora
              </label>
              <select
                id="seguradoraId"
                name="seguradoraId"
                value={filters.seguradoraId}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Todas</option>
                {seguradoras.map((seguradora) => (
                  <option key={seguradora.idSeguradora} value={seguradora.idSeguradora}>
                    {seguradora.nomeSeguradora}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="dataInicio" className="text-sm font-medium text-zinc-700">
                Data de início
              </label>
              <input
                id="dataInicio"
                name="dataInicio"
                type="date"
                value={filters.dataInicio}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="dataFim" className="text-sm font-medium text-zinc-700">
                Data de fim
              </label>
              <input
                id="dataFim"
                name="dataFim"
                type="date"
                value={filters.dataFim}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1"
            >
              Limpar filtros
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Aplicar filtros
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span>Itens por página</span>
            <select
              value={pagination.limit}
              onChange={handleLimitChange}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Averbação
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Período
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Containers
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Valor segurado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Seguradora
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Atualizado em
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-zinc-500">
                    Carregando averbações...
                  </td>
                </tr>
              )}

              {!isLoading && averbacoes.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6">
                    {renderEmptyState()}
                  </td>
                </tr>
              )}

              {!isLoading &&
                averbacoes.map((averbacao) => {
                  const status = getStatusMeta(averbacao.status);
                  const containersCount = getContainersCount(averbacao);
                  const valorSegurado = getValorSegurado(averbacao);

                  return (
                    <tr key={averbacao.idAverbacao} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-zinc-900">
                        {averbacao.numeroAverbacao ?? averbacao.numero ?? `#${averbacao.idAverbacao}`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                        {getClienteNome(averbacao)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                        {getPeriodoLabel(averbacao)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                        {containersCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                        {valorSegurado ? formatCurrency(valorSegurado) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                        {getSeguradoraNome(averbacao)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-500">
                        {averbacao.atualizadoEm ? formatDate(averbacao.atualizadoEm) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                        <div className="flex justify-end items-center gap-2">
                          <Link
                            href={`/averbacoes/${averbacao.idAverbacao}`}
                            className="inline-flex items-center justify-center p-1.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded shadow-sm transition-colors"
                            title="Visualizar"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(averbacao.idAverbacao)}
                            className="inline-flex items-center justify-center p-1.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded shadow-sm transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!isLoading && averbacoes.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-zinc-200 bg-zinc-50 px-6 py-4 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Exibindo{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{" "}
              de <span className="font-medium">{pagination.totalItems}</span> registros
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm font-medium text-zinc-700">
                Página {pagination.page} de {Math.max(pagination.totalPages, 1)}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Confirmar exclusão</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Tem certeza que deseja excluir esta averbação? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


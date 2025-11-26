"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAlert } from "@/contexts/AlertContext";
import {
    Container,
    ContainerCreate,
    ContainerFilters,
    ContainerStatus,
    ContainerTipo,
    ContainerUpdate,
    PaginationInfo,
} from "@/types/api";
import { useApi } from "@/lib/api";
import {
    containerStatusMeta,
    containerStatusValues,
    getContainerId,
    getContainerNumber,
    getContainerStatus,
    getContainerTypeName,
} from "@/lib/containers/utils";

const initialPagination: PaginationInfo = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
};

const initialFilters: ContainerFilters = {
    page: 1,
    limit: 10,
};

const emptyFilterDraft = {
    search: "",
    nrContainer: "",
    statusContainer: "",
    idTipoContainer: "",
};

const containerFormSchema = z.object({
    nrContainer: z.string().min(4, "Numero do container e obrigatorio"),
    idTipoContainer: z.string().min(1, "Tipo do container e obrigatorio"),
    statusContainer: z.enum(containerStatusValues),
    proprietario: z.string().max(255).optional().or(z.literal("")),
    anoFabricacao: z.string().optional().or(z.literal("")),
    valorContainer: z.string().optional().or(z.literal("")),
    observacoes: z.string().max(500).optional().or(z.literal("")),
});

type ContainerFormValues = z.infer<typeof containerFormSchema>;
type FilterDraft = typeof emptyFilterDraft;

const formDefaultValues: ContainerFormValues = {
    nrContainer: "",
    idTipoContainer: "",
    statusContainer: "ativo",
    proprietario: "",
    anoFabricacao: "",
    valorContainer: "",
    observacoes: "",
};

const pageSizeOptions = [10, 20, 50];

const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("pt-BR").format(date);
};

const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "--";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    }).format(value);
};

const parseOptionalFloat = (input?: string) => {
    if (!input) return undefined;
    const normalized = input.replace(/\./g, "").replace(",", ".").trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseOptionalInt = (input?: string) => {
    if (!input) return undefined;
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
};
export default function ContainersPage() {
    const { data: session } = useSession();
    const api = useApi();
    const { showAlert } = useAlert();

    const [containers, setContainers] = useState<Container[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
    const [filters, setFilters] = useState<ContainerFilters>(initialFilters);
    const [filterDraft, setFilterDraft] = useState<FilterDraft>(emptyFilterDraft);
    const [containerTypes, setContainerTypes] = useState<ContainerTipo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContainerFormValues>({
        resolver: zodResolver(containerFormSchema),
        defaultValues: formDefaultValues,
    });

    const fetchContainers = useCallback(
        async (params: ContainerFilters) => {
            try {
                setIsLoading(true);
                const response = await api.getContainers(params);
                if (!response.success || !response.data) {
                    throw new Error(response.message || "Nao foi possivel carregar os containers");
                }

                setContainers(response.data.items);
                setPagination(response.data.pagination ?? initialPagination);
            } catch (error) {
                console.error("Erro ao carregar containers", error);
                setContainers([]);
                setPagination(initialPagination);
                showAlert("error", "Erro ao carregar containers");
            } finally {
                setIsLoading(false);
            }
        },
        [api, showAlert]
    );

    useEffect(() => {
        if (!session?.accessToken) return;
        fetchContainers(filters);
    }, [session?.accessToken, filters, fetchContainers]);

    useEffect(() => {
        if (!session?.accessToken) return;

        (async () => {
            try {
                const response = await api.getContainerTipos({ page: 1, limit: 100 });
                if (response.success && response.data) {
                    setContainerTypes(response.data.items);
                }
            } catch (error) {
                console.warn("Falha ao carregar tipos de container", error);
            }
        })();
    }, [session?.accessToken, api]);

    const pageNumbers = useMemo(() => {
        if (pagination.totalPages <= 1) {
            return [1];
        }

        if (pagination.totalPages <= 5) {
            return Array.from({ length: pagination.totalPages }, (_, index) => index + 1);
        }

        const start = Math.max(1, pagination.currentPage - 2);
        const end = Math.min(pagination.totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [pagination]);

    const handleNew = () => {
        setSelectedContainer(null);
        reset(formDefaultValues);
        setIsModalOpen(true);
    };

    const handleEdit = (container: Container) => {
        setSelectedContainer(container);
        reset({
            nrContainer: container.nrContainer ?? container.numero ?? "",
            idTipoContainer: container.idTipoContainer ? String(container.idTipoContainer) : "",
            statusContainer: container.statusContainer ?? "ativo",
            proprietario: container.proprietario ?? "",
            anoFabricacao: container.anoFabricacao ? String(container.anoFabricacao) : "",
            valorContainer: container.valorContainer !== undefined ? String(container.valorContainer) : "",
            observacoes: container.observacoes ?? "",
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (container: Container) => {
        const containerId = getContainerId(container);
        if (!containerId) return;
        if (!confirm("Confirma a exclusao do container?")) return;

        try {
            setDeletingId(containerId);
            const response = await api.deleteContainer(containerId);
            if (!response.success) {
                throw new Error(response.message || "Erro ao excluir container");
            }
            showAlert("success", "Container excluido com sucesso");
            await fetchContainers(filters);
        } catch (error) {
            console.error("Erro ao excluir container", error);
            showAlert("error", "Erro ao excluir container");
        } finally {
            setDeletingId(null);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedContainer(null);
        reset(formDefaultValues);
    };

    const onSubmit = async (values: ContainerFormValues) => {
        try {
            setIsSaving(true);

            const basePayload: ContainerUpdate = {
                idTipoContainer: Number(values.idTipoContainer),
                statusContainer: values.statusContainer,
                proprietario: values.proprietario?.trim() || undefined,
                anoFabricacao: parseOptionalInt(values.anoFabricacao),
                valorContainer: parseOptionalFloat(values.valorContainer),
                observacoes: values.observacoes?.trim() || undefined,
            };

            let response;
            if (selectedContainer) {
                const selectedId = getContainerId(selectedContainer);
                if (!selectedId) {
                    throw new Error("Identificador do container não encontrado");
                }
                response = await api.updateContainer(selectedId, basePayload);
            } else {
                const payload: ContainerCreate = {
                    ...basePayload,
                    nrContainer: values.nrContainer.trim().toUpperCase(),
                };
                response = await api.createContainer(payload);
            }

            if (!response.success) {
                throw new Error(response.message || "Erro ao salvar container");
            }

            showAlert("success", selectedContainer ? "Container atualizado com sucesso" : "Container criado com sucesso");
            handleCloseModal();
            await fetchContainers(filters);
        } catch (error) {
            console.error("Erro ao salvar container", error);
            showAlert("error", error instanceof Error ? error.message : "Erro ao salvar container");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFilter = () => {
        setFilters((prev) => ({
            ...prev,
            page: 1,
            search: filterDraft.search.trim() || undefined,
            nrContainer: filterDraft.nrContainer.trim() || undefined,
            statusContainer: (filterDraft.statusContainer as ContainerStatus) || undefined,
            idTipoContainer: filterDraft.idTipoContainer ? Number(filterDraft.idTipoContainer) : undefined,
        }));
    };

    const handleClearFilters = () => {
        setFilterDraft(emptyFilterDraft);
        setFilters({ page: 1, limit: filters.limit ?? 10 });
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || (pagination.totalPages && page > pagination.totalPages)) return;
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleLimitChange = (limit: number) => {
        setFilters((prev) => ({ ...prev, limit, page: 1 }));
    };

    const itemsStart = pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    const itemsEnd = pagination.totalItems === 0 ? 0 : Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Containers</h1>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                        Gerencie os containers cadastrados na plataforma
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="inline-flex items-center px-4 py-2 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm font-medium text-[hsl(var(--foreground))] shadow-sm hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                >
                    Novo container
                </button>
            </div>

            <div className="bg-[hsl(var(--card))] shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Filtros</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label htmlFor="filterSearch" className="block text-sm font-medium text-[hsl(var(--foreground))]">Buscar</label>
                            <input
                                id="filterSearch"
                                type="text"
                                value={filterDraft.search}
                                onChange={(event) => setFilterDraft((draft) => ({ ...draft, search: event.target.value }))}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                placeholder="Buscar por numero, proprietario..."
                            />
                        </div>
                        <div>
                            <label htmlFor="filterNr" className="block text-sm font-medium text-[hsl(var(--foreground))]">Numero</label>
                            <input
                                id="filterNr"
                                type="text"
                                value={filterDraft.nrContainer}
                                onChange={(event) => setFilterDraft((draft) => ({ ...draft, nrContainer: event.target.value }))}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                placeholder="Pesquisar por numero"
                            />
                        </div>
                        <div>
                            <label htmlFor="filterStatus" className="block text-sm font-medium text-[hsl(var(--foreground))]">Status</label>
                            <select
                                id="filterStatus"
                                value={filterDraft.statusContainer}
                                onChange={(event) => setFilterDraft((draft) => ({ ...draft, statusContainer: event.target.value }))}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                            >
                                <option value="">Todos</option>
                                {containerStatusValues.map((status) => (
                                    <option key={status} value={status}>{containerStatusMeta[status].label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filterTipo" className="block text-sm font-medium text-[hsl(var(--foreground))]">Tipo de container</label>
                            <select
                                id="filterTipo"
                                value={filterDraft.idTipoContainer}
                                onChange={(event) => setFilterDraft((draft) => ({ ...draft, idTipoContainer: event.target.value }))}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                            >
                                <option value="">Todos</option>
                                {containerTypes.map((tipo) => (
                                    <option key={tipo.idTipoContainer} value={String(tipo.idTipoContainer)}>
                                        {tipo.tipoContainer}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={handleClearFilters}
                            className="inline-flex items-center px-4 py-2 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm font-medium text-[hsl(var(--foreground))] shadow-sm hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                        >
                            Limpar
                        </button>
                        <button
                            onClick={handleFilter}
                            className="inline-flex items-center px-4 py-2 rounded-md border border-transparent bg-[hsl(var(--primary))] text-sm font-medium text-white shadow-sm hover:opacity-90"
                        >
                            Filtrar
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[hsl(var(--primary))]"></div>
                        <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Carregando containers...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-[hsl(var(--card))] shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flow-root">
                            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                    <table className="min-w-full divide-y divide-[hsl(var(--border))]">
                                        <thead className="bg-[hsl(var(--muted))]">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Numero</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Tipo</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Status</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Proprietario</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Valor</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Registro</th>
                                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Acoes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--border))] bg-[hsl(var(--background))]">
                                            {containers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                                                        Nenhum container encontrado com os filtros selecionados.
                                                    </td>
                                                </tr>
                                            ) : (
                                                containers.map((container) => {
                                                    const status = getContainerStatus(container);
                                                    const meta = containerStatusMeta[status];
                                                    const containerRowKey = getContainerId(container) ?? getContainerNumber(container);
                                                    const containerId = getContainerId(container);
                                                    return (
                                                        <tr key={containerRowKey}>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-[hsl(var(--foreground))]">
                                                                {getContainerNumber(container) || "--"}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                                                                {getContainerTypeName(container) || "--"}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                                                                    {meta.label}
                                                                </span>
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                                                                {container.proprietario ?? "--"}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                                                                {formatCurrency(container.valorContainer)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                                                                {formatDate(container.dataRegistro)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium space-x-2">
                                                                <button
                                                                    onClick={() => handleEdit(container)}
                                                                    className="text-[hsl(var(--primary))] hover:underline"
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(container)}
                                                                    disabled={deletingId === containerId}
                                                                    className="text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {deletingId === containerId ? "Excluindo..." : "Excluir"}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-[hsl(var(--border))]">
                                <nav className="flex items-center justify-between" aria-label="Pagination">
                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                        Mostrando {itemsStart} a {itemsEnd} de {pagination.totalItems} containers
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={!pagination.hasPreviousPage}
                                            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium border border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Anterior
                                        </button>
                                        {pageNumbers.map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                                                    page === pagination.currentPage
                                                        ? "bg-[hsl(var(--primary))] text-white"
                                                        : "border border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium border border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-lg rounded-lg bg-[hsl(var(--card))] p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
                            {selectedContainer ? "Editar container" : "Novo container"}
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label htmlFor="nrContainer" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                                    Numero do container
                                </label>
                                <input
                                    id="nrContainer"
                                    type="text"
                                    {...register("nrContainer")}
                                    disabled={Boolean(selectedContainer)}
                                    className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] disabled:bg-[hsl(var(--muted))] disabled:text-[hsl(var(--muted-foreground))]"
                                    placeholder="Exemplo: ABCD1234567"
                                />
                                {errors.nrContainer && (
                                    <p className="mt-1 text-sm text-red-600">{errors.nrContainer.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="idTipoContainer" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                                    Tipo de container
                                </label>
                                <select
                                    id="idTipoContainer"
                                    {...register("idTipoContainer")}
                                    className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                >
                                    <option value="">Selecione um tipo</option>
                                    {containerTypes.map((tipo) => (
                                        <option key={tipo.idTipoContainer} value={String(tipo.idTipoContainer)}>
                                            {tipo.tipoContainer}
                                        </option>
                                    ))}
                                </select>
                                {errors.idTipoContainer && (
                                    <p className="mt-1 text-sm text-red-600">{errors.idTipoContainer.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="statusContainer" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                                    Status
                                </label>
                                <select
                                    id="statusContainer"
                                    {...register("statusContainer")}
                                    className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                >
                                    {containerStatusValues.map((status) => (
                                        <option key={status} value={status}>{containerStatusMeta[status].label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="proprietario" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                                    Proprietario
                                </label>
                                <input
                                    id="proprietario"
                                    type="text"
                                    {...register("proprietario")}
                                    className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="anoFabricacao" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                                        Ano de fabricacao
                                    </label>
                                    <input
                                        id="anoFabricacao"
                                        type="number"
                                        min={1900}
                                        max={2100}
                                        step={1}
                                        {...register("anoFabricacao")}
                                        className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="valorContainer" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                                        Valor (R$)
                                    </label>
                                    <input
                                        id="valorContainer"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        {...register("valorContainer")}
                                        className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="observacoes" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                                    Observacoes
                                </label>
                                <textarea
                                    id="observacoes"
                                    rows={3}
                                    {...register("observacoes")}
                                    className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="rounded-md border border-[hsl(var(--input))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? "Salvando..." : selectedContainer ? "Atualizar" : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
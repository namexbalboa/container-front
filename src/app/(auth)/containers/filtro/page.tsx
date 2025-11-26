"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useAlert } from "@/contexts/AlertContext";
import { useApi } from "@/lib/api";
import {
    containerStatusMeta,
    containerStatusValues,
    getContainerId,
    getContainerNumber,
    getContainerStatus,
    getContainerTypeName,
} from "@/lib/containers/utils";
import { Container, ContainerFilters, ContainerStatus, ContainerTipo, PaginationInfo } from "@/types/api";

const filterSchema = z.object({
    search: z.string().optional(),
    nrContainer: z.string().optional(),
    statusContainer: z.enum(containerStatusValues).optional(),
    idTipoContainer: z.string().optional(),
    proprietario: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

const initialFilters: ContainerFilters = {
    page: 1,
    limit: 20,
};

const initialPagination: PaginationInfo = {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false,
};

export default function ContainerFilterPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { showAlert } = useAlert();
    const api = useApi();

    const [filters, setFilters] = useState<ContainerFilters>(initialFilters);
    const [containers, setContainers] = useState<Container[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
    const [containerTypes, setContainerTypes] = useState<ContainerTipo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FilterFormValues>({
        resolver: zodResolver(filterSchema),
        defaultValues: {
            search: "",
            nrContainer: "",
            statusContainer: undefined,
            idTipoContainer: "",
            proprietario: "",
            dataInicio: "",
            dataFim: "",
        },
    });

    const fetchContainers = useCallback(
        async (params: ContainerFilters) => {
            try {
                setIsLoading(true);
                const response = await api.getContainers(params);
                if (!response.success || !response.data) {
                    throw new Error(response.message || "Não foi possível carregar os containers");
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

    const onSubmit = handleSubmit(async (values) => {
        setIsSubmitting(true);
        try {
            const nextFilters: ContainerFilters = {
                ...filters,
                page: 1,
                search: values.search?.trim() || undefined,
                nrContainer: values.nrContainer?.trim() || undefined,
                statusContainer: values.statusContainer as ContainerStatus | undefined,
                idTipoContainer: values.idTipoContainer ? Number(values.idTipoContainer) : undefined,
                proprietario: values.proprietario?.trim() || undefined,
                dataInicio: values.dataInicio || undefined,
                dataFim: values.dataFim || undefined,
            };

            setFilters(nextFilters);
        } finally {
            setIsSubmitting(false);
        }
    });

    const handleReset = () => {
        reset();
        setFilters(initialFilters);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || (pagination.totalPages && page > pagination.totalPages)) return;
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleLimitChange = (limit: number) => {
        setFilters((prev) => ({ ...prev, limit, page: 1 }));
    };

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

    const itemsStart = pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    const itemsEnd = pagination.totalItems === 0 ? 0 : Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

    const handleCreate = () => router.push("/containers");
    const handleDetails = (container: Container) => {
        const id = getContainerId(container);
        if (!id) return;
        router.push(`/containers/${id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Filtros avançados de containers</h1>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Pesquise containers por status, tipo, número e outras informações</p>
                </div>
                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] shadow-sm hover:bg-[hsl(var(--accent))]"
                >
                    Novo container
                </button>
            </div>

            <form onSubmit={onSubmit} className="bg-[hsl(var(--card))] rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Filtros</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-[hsl(var(--foreground))]">Buscar</label>
                            <input
                                id="search"
                                type="text"
                                {...register("search")}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                placeholder="Número, proprietário, observações..."
                            />
                        </div>
                        <div>
                            <label htmlFor="nrContainer" className="block text-sm font-medium text-[hsl(var(--foreground))]">Número do container</label>
                            <input
                                id="nrContainer"
                                type="text"
                                {...register("nrContainer")}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                placeholder="EX: ABCD1234567"
                            />
                        </div>
                        <div>
                            <label htmlFor="statusContainer" className="block text-sm font-medium text-[hsl(var(--foreground))]">Status</label>
                            <select
                                id="statusContainer"
                                {...register("statusContainer")}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                            >
                                <option value="">Todos</option>
                                {containerStatusValues.map((status) => (
                                    <option key={status} value={status}>{containerStatusMeta[status].label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="idTipoContainer" className="block text-sm font-medium text-[hsl(var(--foreground))]">Tipo de container</label>
                            <select
                                id="idTipoContainer"
                                {...register("idTipoContainer")}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                            >
                                <option value="">Todos</option>
                                {containerTypes.map((tipo) => (
                                    <option key={tipo.idTipoContainer} value={String(tipo.idTipoContainer)}>{tipo.tipoContainer}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="proprietario" className="block text-sm font-medium text-[hsl(var(--foreground))]">Proprietário</label>
                            <input
                                id="proprietario"
                                type="text"
                                {...register("proprietario")}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                            />
                        </div>
                        <div>
                            <label htmlFor="dataInicio" className="block text-sm font-medium text-[hsl(var(--foreground))]">Data início</label>
                            <input
                                id="dataInicio"
                                type="date"
                                {...register("dataInicio")}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                            />
                        </div>
                        <div>
                            <label htmlFor="dataFim" className="block text-sm font-medium text-[hsl(var(--foreground))]">Data fim</label>
                            <input
                                id="dataFim"
                                type="date"
                                {...register("dataFim")}
                                className="mt-1 block w-full rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-md border border-[hsl(var(--input))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                        >
                            Limpar filtros
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Filtrando..." : "Aplicar filtros"}
                        </button>
                    </div>
                </div>
            </form>

            <div className="bg-[hsl(var(--card))] rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Resultados</h2>
                        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                            <span>Página {pagination.currentPage} de {pagination.totalPages || 1}</span>
                        </div>
                    </div>

                    <div className="mt-6 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <table className="min-w-full divide-y divide-[hsl(var(--border))]">
                                    <thead className="bg-[hsl(var(--muted))]">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Número</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Tipo</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Status</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Proprietário</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Valor</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Registro</th>
                                            <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[hsl(var(--border))] bg-[hsl(var(--background))]">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={7} className="px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                                                    Carregando containers...
                                                </td>
                                            </tr>
                                        ) : containers.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                                                    Nenhum container encontrado com os filtros selecionados.
                                                </td>
                                            </tr>
                                        ) : (
                                            containers.map((container) => {
                                                const status = getContainerStatus(container);
                                                const meta = containerStatusMeta[status];
                                                const rowKey = getContainerId(container) ?? getContainerNumber(container);
                                                return (
                                                    <tr key={rowKey}>
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
                                                            {container.valorContainer !== undefined ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(container.valorContainer)) : "--"}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                                                            {container.dataRegistro ? new Intl.DateTimeFormat("pt-BR").format(new Date(container.dataRegistro)) : "--"}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => handleDetails(container)}
                                                                className="text-[hsl(var(--primary))] hover:underline"
                                                            >
                                                                Detalhes
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

                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                            Mostrando {itemsStart} a {itemsEnd} de {pagination.totalItems} registros
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-[hsl(var(--muted-foreground))]">Itens por página</span>
                                <select
                                    value={filters.limit ?? pagination.itemsPerPage}
                                    onChange={(event) => handleLimitChange(Number(event.target.value))}
                                    className="rounded-md border-[hsl(var(--input))] bg-[hsl(var(--background))] text-sm"
                                >
                                    {[10, 20, 50].map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                            <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPreviousPage}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-sm font-medium border border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                {pageNumbers.map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border border-[hsl(var(--input))] ${
                                            page === pagination.currentPage
                                                ? "bg-[hsl(var(--primary))] text-white"
                                                : "bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-sm font-medium border border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Próxima
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

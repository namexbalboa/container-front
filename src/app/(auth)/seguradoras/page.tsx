"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Seguradora, SeguradoraFilters, SeguradoraCreate, SeguradoraUpdate, PaginationInfo, ApiResponse, PaginatedResponse } from "@/types/api";
import { apiService } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { SeguradoraStats, SeguradoraFilters as FiltersComponent, SeguradoraCard } from "@/components/seguradoras";
import {
  ModernTabs,
  ModernTabsList,
  ModernTabsTrigger,
  ModernTabsContent
} from "@/components/ui/modern-tabs";

export default function SeguradorasPage() {
    const { hasPermission } = usePermissions();
    const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [isInitialMount, setIsInitialMount] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<SeguradoraFilters>({
        nomeSeguradora: "",
        cnpj: "",
        status: undefined,
        cidade: "",
        uf: "",
        dataInicioAtualizacao: "",
        dataFimAtualizacao: "",
        temAverbacoes: undefined,
        valorMinimo: undefined,
        valorMaximo: undefined
    });
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false
    });
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    const fetchSeguradoras = async () => {
        try {
            if (isInitialMount) {
                setIsLoading(true);
            } else {
                setIsFetching(true);
            }
            setError(null);
            const response = await apiService.getSeguradoras({
                ...filters,
                page: currentPage,
                limit: 10
            });

            if (response.success && response.data) {
                setSeguradoras(response.data.items);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error("Erro ao carregar seguradoras:", err);
            setError("Erro ao carregar seguradoras");
        } finally {
            if (isInitialMount) {
                setIsLoading(false);
                setIsInitialMount(false);
            } else {
                setIsFetching(false);
            }
        }
    };

    useEffect(() => {
        if (hasPermission("SEGURADORAS", "READ")) {
            fetchSeguradoras();
        }
    }, [filters, currentPage]);

    const handleFilterChange = (newFilters: SeguradoraFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleClearFilters = () => {
        const emptyFilters: SeguradoraFilters = {
            nomeSeguradora: "",
            cnpj: "",
            status: undefined,
            cidade: "",
            uf: "",
            dataInicioAtualizacao: "",
            dataFimAtualizacao: "",
            temAverbacoes: undefined,
            valorMinimo: undefined,
            valorMaximo: undefined
        };
        setFilters(emptyFilters);
        setCurrentPage(1);
    };



    if (!hasPermission("SEGURADORAS", "READ")) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Acesso Negado
                    </h2>
                    <p className="text-gray-600">
                        Você não tem permissão para acessar esta página.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Seguradoras
                    </h1>
                    <p className="text-gray-600">
                        Gerencie as seguradoras do sistema
                    </p>
                </div>
                <div className="flex space-x-3">
                    {hasPermission("SEGURADORAS", "CREATE") && (
                        <Link
                            href="/seguradoras/criar"
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Nova Seguradora
                        </Link>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Estatísticas */}
            <SeguradoraStats className="mb-6" />

            {/* Filtros */}
            <FiltersComponent
                filters={filters}
                onFiltersChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            {/* Indicador de Loading durante busca */}
            {isFetching && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <p className="text-blue-700 text-sm font-medium">Carregando seguradoras...</p>
                </div>
            )}

            {/* Lista de Seguradoras */}
            <ModernTabs defaultValue="grid" className="mt-6" onTabChange={(value) => setViewMode(value as "grid" | "table")}>
                <ModernTabsList>
                    <ModernTabsTrigger
                        value="grid"
                        icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        }
                    >
                        Grade
                    </ModernTabsTrigger>
                    <ModernTabsTrigger
                        value="table"
                        icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        }
                    >
                        Tabela
                    </ModernTabsTrigger>
                </ModernTabsList>

                <ModernTabsContent value="grid" className="mt-6">
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                    {seguradoras.length === 0 && !isFetching ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-500 text-lg">
                                Nenhuma seguradora encontrada
                            </p>
                        </div>
                    ) : (
                        seguradoras.map((seguradora) => (
                            <SeguradoraCard
                                key={seguradora.idSeguradora}
                                seguradora={seguradora}
                                onUpdate={fetchSeguradoras}
                            />
                        ))
                    )}
                    </div>
                </ModernTabsContent>

                <ModernTabsContent value="table" className="mt-6">
                    <div className={`bg-white rounded-lg shadow mb-6 transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                    {seguradoras.length === 0 && !isFetching ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">
                                Nenhuma seguradora encontrada
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nome
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            CNPJ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Endereço
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contato
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {seguradoras.map((seguradora) => (
                                        <tr key={seguradora.idSeguradora} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {seguradora.nomeSeguradora}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {seguradora.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate" title={typeof seguradora.endereco === 'string' ? seguradora.endereco : seguradora.endereco ? `${seguradora.endereco.cidade}/${seguradora.endereco.estado}` : '-'}>
                                                    {typeof seguradora.endereco === 'string'
                                                        ? seguradora.endereco
                                                        : seguradora.endereco
                                                        ? `${seguradora.endereco.cidade}/${seguradora.endereco.estado}`
                                                        : seguradora.cidade && seguradora.estado
                                                        ? `${seguradora.cidade}/${seguradora.estado}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    seguradora.status === "ativa"
                                                        ? "bg-green-100 text-green-800"
                                                        : seguradora.status === "inativa"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                    {seguradora.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {seguradora.email || seguradora.telefone || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {hasPermission("SEGURADORAS", "READ") && (
                                                        <Link
                                                            href={`/seguradoras/${seguradora.idSeguradora}`}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Ver
                                                        </Link>
                                                    )}
                                                    {hasPermission("SEGURADORAS", "UPDATE") && (
                                                        <Link
                                                            href={`/seguradoras/${seguradora.idSeguradora}/editar`}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Editar
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    </div>
                </ModernTabsContent>
            </ModernTabs>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
                <div className="bg-white rounded-lg shadow px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} a {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} seguradoras
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPreviousPage}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
                            >
                                Anterior
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-700">
                                Página {pagination.currentPage} de {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNextPage}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
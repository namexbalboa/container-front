"use strict";

import React, { useState, useEffect } from "react";
import {
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    ClockIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from "@heroicons/react/24/outline";
import { useSearch } from "@/hooks/use-search";
import { SearchGlobal } from "./search-global";
import { SearchResults } from "./search-results";
import { SearchFilters } from "./search-filters";
import { SearchHistory } from "./search-history";
import { SearchParams, SearchFilters as SearchFiltersType } from "@/types/api";

interface SearchAdvancedProps {
    isOpen: boolean;
    onClose: () => void;
    initialTerm?: string;
    initialParams?: Partial<SearchParams>;
}

export function SearchAdvanced({ 
    isOpen, 
    onClose, 
    initialTerm = "", 
    initialParams = {} 
}: SearchAdvancedProps) {
    const {
        resultados,
        loading,
        error,
        sugestoes,
        historico,
        filtrosDisponiveis,
        paginacao,
        estatisticas,
        buscar,
        buscarRapido,
        carregarHistorico,
        limparHistorico,
        obterSugestoes,
        aplicarFiltro,
        alterarOrdenacao,
        proximaPagina,
        paginaAnterior,
        irParaPagina
    } = useSearch();

    const [activeTab, setActiveTab] = useState<"search" | "filters" | "history">("search");
    const [searchTerm, setSearchTerm] = useState(initialTerm);
    const [filtros, setFiltros] = useState<SearchFiltersType>({});
    const [showFilters, setShowFilters] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Carregar histórico quando o componente abrir
    useEffect(() => {
        if (isOpen) {
            setIsHistoryLoading(true);
            carregarHistorico().finally(() => setIsHistoryLoading(false));
        }
    }, [isOpen, carregarHistorico]);

    // Aplicar parâmetros iniciais
    useEffect(() => {
        if (initialParams.filtros) {
            setFiltros(initialParams.filtros);
        }
        if (initialParams.termo) {
            setSearchTerm(initialParams.termo);
        }
    }, [initialParams]);

    const handleSearch = async () => {
        if (!searchTerm.trim() && Object.keys(filtros).length === 0) return;

        const params: SearchParams = {
            termo: searchTerm.trim(),
            filtros: Object.keys(filtros).length > 0 ? filtros : undefined,
            modulos: initialParams.modulos,
            ordenacao: initialParams.ordenacao,
            page: 1,
            limit: 20
        };

        await buscar(params);
        setActiveTab("search");
    };

    const handleFilterChange = (newFiltros: SearchFiltersType) => {
        setFiltros(newFiltros);
    };

    const handleClearFilters = () => {
        setFiltros({});
    };

    const handleSelectHistory = (item: any) => {
        setSearchTerm(item.termo || "");
        setFiltros(item.filtros || {});
        setActiveTab("search");
        
        // Executar a busca automaticamente
        buscar({ termo: item.termo, filtros: item.filtros });
    };

    const handleRemoveHistory = async (id: string) => {
        // Implementar remoção individual do histórico
        // Por enquanto, vamos recarregar o histórico
        await carregarHistorico();
    };

    const handleClearHistory = async () => {
        await limparHistorico();
    };

    const hasActiveFilters = Object.values(filtros).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ""
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative h-full flex items-start justify-center pt-16 pb-8 px-4">
                <div className="w-full max-w-6xl bg-white  rounded-xl shadow-2xl border border-gray-200  overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Busca Avançada
                            </h2>
                        </div>
                        
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600  rounded-lg hover:bg-gray-100  transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-6 border-b border-gray-200 ">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Digite sua busca..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300  rounded-lg bg-white  text-gray-900  placeholder-gray-500  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                />
                            </div>
                            
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
                                    hasActiveFilters || showFilters
                                        ? "bg-blue-50 border-blue-300 text-blue-700"
                                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                                Filtros
                                {hasActiveFilters && (
                                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                        {Object.values(filtros).filter(v => Array.isArray(v) ? v.length > 0 : v !== undefined).length}
                                    </span>
                                )}
                                {showFilters ? (
                                    <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                    <ChevronDownIcon className="h-4 w-4" />
                                )}
                            </button>
                            
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : (
                                    <MagnifyingGlassIcon className="h-5 w-5" />
                                )}
                                Buscar
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <SearchFilters
                            filtros={filtros}
                            filtrosDisponiveis={filtrosDisponiveis}
                            onChange={handleFilterChange}
                            onClear={handleClearFilters}
                        />
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200 ">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab("search")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === "search"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Resultados
                                {estatisticas && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        {estatisticas.total}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab("history")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                                    activeTab === "history"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <ClockIcon className="h-4 w-4" />
                                Histórico
                                {historico.length > 0 && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        {historico.length}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === "search" && (
                            <SearchResults
                                resultados={resultados}
                                loading={loading}
                                total={estatisticas.total}
                                tempo={estatisticas.tempo}
                                paginacao={paginacao}
                                estatisticas={estatisticas}
                                onPageChange={irParaPagina}
                                onNextPage={proximaPagina}
                                onPrevPage={paginaAnterior}
                                onSortChange={alterarOrdenacao}
                                onResultClick={() => {}}
                            />
                        )}
                        
                        {activeTab === "history" && (
                            <SearchHistory
                                historico={historico}
                                onSelectHistorico={handleSelectHistory}
                                onRemoveHistorico={handleRemoveHistory}
                                onClearHistorico={handleClearHistory}
                                isLoading={isHistoryLoading}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
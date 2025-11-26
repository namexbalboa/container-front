"use strict";

import React, { useState, useEffect, useRef } from "react";
import { 
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    ClockIcon,
    StarIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useSearch } from "@/hooks/use-search";
import { SearchParams, SearchFilters, ModuloSistema } from "@/types/api";
import { SearchResults } from "./search-results";
import { SearchFilters as SearchFiltersComponent } from "./search-filters";
import SearchSuggestions, { SearchSuggestion } from "./search-suggestions";

interface SearchGlobalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTerm?: string;
    initialModules?: ModuloSistema[];
}

export function SearchGlobal({ isOpen, onClose, initialTerm = "", initialModules }: SearchGlobalProps) {
    const [termo, setTermo] = useState(initialTerm);
    const [showFilters, setShowFilters] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filtros, setFiltros] = useState<SearchFilters>({});
    
    const inputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    
    const {
        resultados,
        loading,
        error,
        total,
        tempo,
        sugestoes,
        filtrosDisponiveis,
        historico,
        sugestoesTermos,
        parametrosAtivos,
        paginacao,
        estatisticas,
        buscar,
        buscarRapido,
        limparResultados,
        obterSugestoes,
        aplicarFiltro,
        alterarOrdenacao,
        proximaPagina,
        paginaAnterior,
        irParaPagina
    } = useSearch();

    // Focar no input quando abrir
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Buscar sugestões quando o termo mudar
    useEffect(() => {
        if (termo.length >= 2) {
            const timer = setTimeout(() => {
                obterSugestoes(termo);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [termo, obterSugestoes]);

    // Fechar com ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, onClose]);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen, onClose]);

    const handleSearch = async () => {
        if (!termo.trim()) return;

        const params: SearchParams = {
            termo: termo.trim(),
            modulos: initialModules,
            filtros,
            page: 1,
            limit: 20
        };

        await buscar(params);
        setShowSuggestions(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleTermoChange = (value: string) => {
        setTermo(value);
        setShowSuggestions(value.length >= 2);
        
        if (!value.trim()) {
            limparResultados();
        }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        setTermo(suggestion.text);
        setShowSuggestions(false);
        
        const params: SearchParams = {
            termo: suggestion.text,
            modulos: initialModules,
            filtros,
            page: 1,
            limit: 20
        };
        
        buscar(params);
    };

    const handleFilterChange = (newFilters: SearchFilters) => {
        setFiltros(newFilters);
        aplicarFiltro(newFilters);
    };

    const handleClearFilters = () => {
        setFiltros({});
        aplicarFiltro({});
    };

    const hasActiveFilters = Object.values(filtros).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ""
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            
            {/* Modal */}
            <div className="relative min-h-screen flex items-start justify-center p-4 pt-16">
                <div 
                    ref={searchRef}
                    className="relative w-full max-w-4xl bg-white  rounded-xl shadow-2xl border border-gray-200 "
                >
                    {/* Header */}
                    <div className="flex items-center gap-4 p-6 border-b border-gray-200 ">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={termo}
                                onChange={(e) => handleTermoChange(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Buscar em todo o sistema..."
                                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white  text-gray-900  placeholder-gray-500 "
                            />
                            
                            {/* Suggestions Dropdown */}
                            {showSuggestions && (sugestoesTermos.length > 0 || historico.length > 0) && (
                                <SearchSuggestions
                                    suggestions={[
                                        ...sugestoesTermos.map((s, index) => ({
                                            id: `sugestao-${index}`,
                                            text: s.termo,
                                            type: s.tipo === "historico" ? "recent" as const : "suggestion" as const
                                        })),
                                        ...historico.map((h) => ({
                                            id: h.id,
                                            text: h.termo,
                                            type: "recent" as const
                                        }))
                                    ]}
                                    isVisible={true}
                                    onSuggestionClick={handleSuggestionClick}
                                />
                            )}
                        </div>
                        
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                showFilters || hasActiveFilters
                                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 "
                                    : "border-gray-300  text-gray-700  hover:bg-gray-50 "
                            }`}
                        >
                            <AdjustmentsHorizontalIcon className="h-5 w-5" />
                            Filtros
                            {hasActiveFilters && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                                    {Object.values(filtros).filter(v => Array.isArray(v) ? v.length > 0 : v).length}
                                </span>
                            )}
                        </button>
                        
                        <button
                            onClick={handleSearch}
                            disabled={!termo.trim() || loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            ) : (
                                <MagnifyingGlassIcon className="h-5 w-5" />
                            )}
                            Buscar
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <SearchFiltersComponent
                            filtros={filtros}
                            filtrosDisponiveis={filtrosDisponiveis}
                            onChange={handleFilterChange}
                            onClear={handleClearFilters}
                        />
                    )}

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {error && (
                            <div className="p-6 text-center">
                                <div className="text-red-600 dark:text-red-400">
                                    {error}
                                </div>
                            </div>
                        )}

                        {!error && (
                            <SearchResults
                                resultados={resultados}
                                loading={loading}
                                total={total}
                                tempo={tempo}
                                paginacao={paginacao}
                                estatisticas={estatisticas}
                                onPageChange={irParaPagina}
                                onNextPage={proximaPagina}
                                onPrevPage={paginaAnterior}
                                onSortChange={alterarOrdenacao}
                                onResultClick={onClose}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
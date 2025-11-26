"use strict";

import React from "react";
import Link from "next/link";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    TruckIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    CogIcon
} from "@heroicons/react/24/outline";
import { SearchResult, SearchOrdenacao, ModuloSistema } from "@/types/api";
import { formatDateTime, formatNumber } from "@/lib/format-utils";

interface SearchResultsProps {
    resultados: SearchResult[];
    loading: boolean;
    total: number;
    tempo: number;
    paginacao: {
        paginaAtual: number;
        totalPaginas: number;
        itemInicial: number;
        itemFinal: number;
        temProxima: boolean;
        temAnterior: boolean;
    };
    estatisticas: {
        total: number;
        exibindo: number;
        tempo: number;
        porModulo: Array<{
            modulo: ModuloSistema;
            label: string;
            count: number;
        }>;
    };
    onPageChange: (pagina: number) => void;
    onNextPage: () => void;
    onPrevPage: () => void;
    onSortChange: (ordenacao: SearchOrdenacao) => void;
    onResultClick: () => void;
}

const MODULO_ICONS: Record<ModuloSistema, React.ComponentType<any>> = {
    USER: UserIcon,
    CLIENT: BuildingOfficeIcon,
    CONTAINER: TruckIcon,
    AVERBACAO: DocumentTextIcon,
    SEGURADORA: ShieldCheckIcon,
    PERMISSION: CogIcon,
    DASHBOARD: ChartBarIcon
};

const MODULO_COLORS: Record<ModuloSistema, string> = {
    USER: "bg-blue-100 text-blue-800 ",
    CLIENT: "bg-green-100 text-green-800 ",
    CONTAINER: "bg-orange-100 text-orange-800 ",
    AVERBACAO: "bg-purple-100 text-purple-800 ",
    SEGURADORA: "bg-red-100 text-red-800 ",
    PERMISSION: "bg-gray-100 text-gray-800 ",
    DASHBOARD: "bg-indigo-100 text-indigo-800 "
};

export function SearchResults({
    resultados,
    loading,
    total,
    tempo,
    paginacao,
    estatisticas,
    onPageChange,
    onNextPage,
    onPrevPage,
    onSortChange,
    onResultClick
}: SearchResultsProps) {
    
    const formatarTempo = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatarData = (data: string) => {
        return formatDateTime(data);
    };

    const getModuloIcon = (modulo: ModuloSistema) => {
        const IconComponent = MODULO_ICONS[modulo];
        return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
    };

    const getModuloColor = (modulo: ModuloSistema) => {
        return MODULO_COLORS[modulo] || "bg-gray-100 text-gray-800 ";
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (resultados.length === 0 && total === 0) {
        return (
            <div className="p-6 text-center">
                <div className="text-gray-500 ">
                    Digite um termo para começar a busca
                </div>
            </div>
        );
    }

    if (resultados.length === 0) {
        return (
            <div className="p-6 text-center">
                <div className="text-gray-500 ">
                    Nenhum resultado encontrado
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Estatísticas */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 ">
                <div className="flex items-center gap-4 text-sm text-gray-600 ">
                    <span>
                        {formatNumber(estatisticas.total)} resultados
                    </span>
                    <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {formatarTempo(estatisticas.tempo)}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    <select
                        onChange={(e) => {
                            const [campo, direcao] = e.target.value.split("-");
                            onSortChange({
                                campo: campo as SearchOrdenacao["campo"],
                                direcao: direcao as SearchOrdenacao["direcao"]
                            });
                        }}
                        className="text-sm border border-gray-300  rounded px-2 py-1 bg-white  text-gray-900 "
                    >
                        <option value="relevancia-desc">Mais relevante</option>
                        <option value="data-desc">Mais recente</option>
                        <option value="data-asc">Mais antigo</option>
                        <option value="titulo-asc">A-Z</option>
                        <option value="titulo-desc">Z-A</option>
                    </select>
                </div>
            </div>

            {/* Filtros por módulo */}
            {estatisticas.porModulo.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {estatisticas.porModulo.map(({ modulo, label, count }) => (
                        <span
                            key={modulo}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getModuloColor(modulo)}`}
                        >
                            {getModuloIcon(modulo)}
                            {label} ({count})
                        </span>
                    ))}
                </div>
            )}

            {/* Resultados */}
            <div className="space-y-3">
                {resultados.map((resultado) => {
                    const IconComponent = MODULO_ICONS[resultado.modulo];
                    
                    return (
                        <div
                            key={`${resultado.modulo}-${resultado.id}`}
                            className="border border-gray-200  rounded-lg p-4 hover:bg-gray-50  transition-colors"
                        >
                            {resultado.url ? (
                                <Link href={resultado.url} onClick={onResultClick}>
                                    <ResultContent resultado={resultado} IconComponent={IconComponent} />
                                </Link>
                            ) : (
                                <ResultContent resultado={resultado} IconComponent={IconComponent} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Paginação */}
            {paginacao.totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 ">
                    <div className="text-sm text-gray-600 ">
                        Mostrando {paginacao.itemInicial} a {paginacao.itemFinal} de {total} resultados
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onPrevPage}
                            disabled={!paginacao.temAnterior}
                            className="p-2 border border-gray-300  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50  transition-colors"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, paginacao.totalPaginas))].map((_, i) => {
                                const pagina = i + 1;
                                const isActive = pagina === paginacao.paginaAtual;
                                
                                return (
                                    <button
                                        key={pagina}
                                        onClick={() => onPageChange(pagina)}
                                        className={`px-3 py-1 text-sm rounded ${
                                            isActive
                                                ? "bg-blue-600 text-white"
                                                : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                                        } transition-colors`}
                                    >
                                        {pagina}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button
                            onClick={onNextPage}
                            disabled={!paginacao.temProxima}
                            className="p-2 border border-gray-300  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50  transition-colors"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResultContent({ 
    resultado, 
    IconComponent 
}: { 
    resultado: SearchResult; 
    IconComponent?: React.ComponentType<any>;
}) {
    const formatarData = (data: string) => {
        return formatDateTime(data);
    };

    const getModuloColor = (modulo: ModuloSistema) => {
        return MODULO_COLORS[modulo] || "bg-gray-100 text-gray-800 ";
    };

    return (
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getModuloColor(resultado.modulo)}`}>
                {IconComponent && <IconComponent className="h-5 w-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900  truncate">
                        {resultado.titulo}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                        {resultado.status && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                                {resultado.status}
                            </span>
                        )}
                        <span>{formatarData(resultado.data)}</span>
                    </div>
                </div>
                
                <p className="text-sm text-gray-600  mt-1 line-clamp-2">
                    {resultado.descricao}
                </p>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 ">
                    {resultado.usuario && (
                        <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            {resultado.usuario}
                        </span>
                    )}
                    {resultado.cliente && (
                        <span className="flex items-center gap-1">
                            <BuildingOfficeIcon className="h-3 w-3" />
                            {resultado.cliente}
                        </span>
                    )}
                    {resultado.tags && resultado.tags.length > 0 && (
                        <div className="flex gap-1">
                            {resultado.tags.slice(0, 3).map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-1 py-0.5 bg-gray-100 rounded text-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
"use strict";

import React from "react";
import {
    ClockIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    TrashIcon
} from "@heroicons/react/24/outline";
import { SearchHistorico } from "@/types/api";
import { formatRelativeTime } from "@/lib/format-utils";

interface SearchHistoryProps {
    historico: SearchHistorico[];
    onSelectHistorico: (item: SearchHistorico) => void;
    onRemoveHistorico: (id: string) => void;
    onClearHistorico: () => void;
    isLoading?: boolean;
}

export function SearchHistory({ 
    historico, 
    onSelectHistorico, 
    onRemoveHistorico, 
    onClearHistorico,
    isLoading = false 
}: SearchHistoryProps) {
    if (isLoading) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-600 ">
                        Histórico de Busca
                    </h3>
                </div>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (historico.length === 0) {
        return (
            <div className="p-6 text-center">
                <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                    Nenhuma busca realizada ainda
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    Suas buscas aparecerão aqui para acesso rápido
                </p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return formatRelativeTime(dateString);
    };

    const getFilterSummary = (item: SearchHistorico) => {
        const filters = [];
        
        if (item.filtros?.status && item.filtros.status.length > 0) {
            filters.push(`${item.filtros.status.length} status`);
        }
        
        if (item.filtros?.dataInicio || item.filtros?.dataFim) {
            filters.push("período");
        }
        
        if (item.filtros?.usuario) {
            filters.push("usuário");
        }
        
        if (item.filtros?.cliente) {
            filters.push("cliente");
        }
        
        if (item.filtros?.seguradora) {
            filters.push("seguradora");
        }
        
        if (item.filtros?.tags && item.filtros.tags.length > 0) {
            filters.push(`${item.filtros.tags.length} tag(s)`);
        }
        
        return filters.length > 0 ? filters.join(", ") : "sem filtros";
    };

    return (
        <div className="border-t border-gray-200 ">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-600 ">
                            Histórico de Busca
                        </h3>
                        <span className="px-2 py-0.5 text-xs bg-gray-100  text-gray-600  rounded-full">
                            {historico.length}
                        </span>
                    </div>
                    
                    {historico.length > 0 && (
                        <button
                            onClick={onClearHistorico}
                            className="text-xs text-red-600  hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                        >
                            <TrashIcon className="h-3 w-3" />
                            Limpar Tudo
                        </button>
                    )}
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {historico.map((item) => (
                        <div
                            key={item.id}
                            className="group relative p-3 rounded-lg border border-gray-200  hover:bg-gray-50  transition-colors cursor-pointer"
                            onClick={() => onSelectHistorico(item)}
                        >
                            <div className="flex items-start gap-3">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-gray-900  truncate">
                                            {item.termo || "Busca sem termo"}
                                        </p>
                                        
                                        {item.resultados !== undefined && (
                                            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full flex-shrink-0">
                                                {item.resultados} resultado{item.resultados !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-gray-500 ">
                                        <span>{formatDate(item.timestamp)}</span>
                                        <span>•</span>
                                        <span>{getFilterSummary(item)}</span>

                                    </div>
                                </div>
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveHistorico(item.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                                    title="Remover do histórico"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                {historico.length >= 10 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 ">
                        <p className="text-xs text-gray-500  text-center">
                            Mostrando os 10 últimos resultados
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
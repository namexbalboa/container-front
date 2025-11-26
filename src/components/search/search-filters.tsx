"use strict";

import React, { useState } from "react";
import {
    XMarkIcon,
    CalendarIcon,
    UserIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
    TagIcon,
    FunnelIcon
} from "@heroicons/react/24/outline";
import { SearchFilters as SearchFiltersType, SearchResponse, ModuloSistema } from "@/types/api";

interface SearchFiltersProps {
    filtros: SearchFiltersType;
    filtrosDisponiveis?: SearchResponse["filtrosDisponiveis"];
    onChange: (filtros: SearchFiltersType) => void;
    onClear: () => void;
}

const MODULOS_OPTIONS: Array<{ value: ModuloSistema; label: string }> = [
    { value: "USER", label: "Usuários" },
    { value: "CLIENT", label: "Clientes" },
    { value: "CONTAINER", label: "Containers" },
    { value: "AVERBACAO", label: "Averbações" },
    { value: "SEGURADORA", label: "Seguradoras" },
    { value: "PERMISSION", label: "Permissões" },
    { value: "DASHBOARD", label: "Dashboard" }
];

const STATUS_OPTIONS = [
    { value: "ativo", label: "Ativo" },
    { value: "inativo", label: "Inativo" },
    { value: "pendente", label: "Pendente" },
    { value: "aprovado", label: "Aprovado" },
    { value: "rejeitado", label: "Rejeitado" },
    { value: "cancelado", label: "Cancelado" },
    { value: "em_analise", label: "Em Análise" },
    { value: "suspenso", label: "Suspenso" }
];

const PRIORIDADE_OPTIONS = [
    { value: "baixa", label: "Baixa" },
    { value: "media", label: "Média" },
    { value: "alta", label: "Alta" },
    { value: "critica", label: "Crítica" }
];

export function SearchFilters({ filtros, filtrosDisponiveis, onChange, onClear }: SearchFiltersProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["modulos"]));

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const updateFiltro = (key: keyof SearchFiltersType, value: any) => {
        onChange({
            ...filtros,
            [key]: value
        });
    };

    const toggleArrayValue = (key: keyof SearchFiltersType, value: string) => {
        const currentArray = (filtros[key] as string[]) || [];
        const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
        
        updateFiltro(key, newArray.length > 0 ? newArray : undefined);
    };

    const hasActiveFilters = Object.values(filtros).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ""
    );

    return (
        <div className="border-t border-gray-200  bg-gray-50 ">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900  flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5" />
                        Filtros Avançados
                    </h3>
                    
                    {hasActiveFilters && (
                        <button
                            onClick={onClear}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Limpar Filtros
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Período */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection("periodo")}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700  hover:text-gray-900 dark:hover:text-white"
                        >
                            <CalendarIcon className="h-4 w-4" />
                            Período
                        </button>
                        
                        {expandedSections.has("periodo") && (
                            <div className="space-y-3 pl-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600  mb-1">
                                        Data Início
                                    </label>
                                    <input
                                        type="date"
                                        value={filtros.dataInicio || ""}
                                        onChange={(e) => updateFiltro("dataInicio", e.target.value || undefined)}
                                        className="w-full text-sm border border-gray-300  rounded px-3 py-2 bg-white  text-gray-900 "
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600  mb-1">
                                        Data Fim
                                    </label>
                                    <input
                                        type="date"
                                        value={filtros.dataFim || ""}
                                        onChange={(e) => updateFiltro("dataFim", e.target.value || undefined)}
                                        className="w-full text-sm border border-gray-300  rounded px-3 py-2 bg-white  text-gray-900 "
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection("status")}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700  hover:text-gray-900 dark:hover:text-white"
                        >
                            <TagIcon className="h-4 w-4" />
                            Status
                            {filtros.status && filtros.status.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                                    {filtros.status.length}
                                </span>
                            )}
                        </button>
                        
                        {expandedSections.has("status") && (
                            <div className="space-y-2 pl-6 max-h-32 overflow-y-auto">
                                {(filtrosDisponiveis?.status || STATUS_OPTIONS.map(opt => ({ valor: opt.value, label: opt.label, count: 0 }))).map((option) => (
                                    <label key={option.valor} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={(filtros.status || []).includes(option.valor)}
                                            onChange={() => toggleArrayValue("status", option.valor)}
                                            className="rounded border-gray-300  text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 ">
                                            {option.label}
                                        </span>
                                        {option.count !== undefined && option.count > 0 && (
                                            <span className="text-xs text-gray-500 ">
                                                ({option.count})
                                            </span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prioridade */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection("prioridade")}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700  hover:text-gray-900 dark:hover:text-white"
                        >
                            <TagIcon className="h-4 w-4" />
                            Prioridade
                            {filtros.prioridade && filtros.prioridade.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                                    {filtros.prioridade.length}
                                </span>
                            )}
                        </button>
                        
                        {expandedSections.has("prioridade") && (
                            <div className="space-y-2 pl-6">
                                {PRIORIDADE_OPTIONS.map((option) => (
                                    <label key={option.value} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={(filtros.prioridade || []).includes(option.value)}
                                            onChange={() => toggleArrayValue("prioridade", option.value)}
                                            className="rounded border-gray-300  text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 ">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Usuário */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection("usuario")}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700  hover:text-gray-900 dark:hover:text-white"
                        >
                            <UserIcon className="h-4 w-4" />
                            Usuário
                        </button>
                        
                        {expandedSections.has("usuario") && (
                            <div className="pl-6">
                                <select
                                    value={filtros.usuario || ""}
                                    onChange={(e) => updateFiltro("usuario", e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full text-sm border border-gray-300  rounded px-3 py-2 bg-white  text-gray-900 "
                                >
                                    <option value="">Todos os usuários</option>
                                    {filtrosDisponiveis?.usuarios?.map((usuario) => (
                                        <option key={usuario.valor} value={usuario.valor}>
                                            {usuario.label} ({usuario.count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Cliente */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection("cliente")}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700  hover:text-gray-900 dark:hover:text-white"
                        >
                            <BuildingOfficeIcon className="h-4 w-4" />
                            Cliente
                        </button>
                        
                        {expandedSections.has("cliente") && (
                            <div className="pl-6">
                                <select
                                    value={filtros.cliente || ""}
                                    onChange={(e) => updateFiltro("cliente", e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full text-sm border border-gray-300  rounded px-3 py-2 bg-white  text-gray-900 "
                                >
                                    <option value="">Todos os clientes</option>
                                    {filtrosDisponiveis?.clientes?.map((cliente) => (
                                        <option key={cliente.valor} value={cliente.valor}>
                                            {cliente.label} ({cliente.count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Seguradora */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection("seguradora")}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700  hover:text-gray-900 dark:hover:text-white"
                        >
                            <ShieldCheckIcon className="h-4 w-4" />
                            Seguradora
                        </button>
                        
                        {expandedSections.has("seguradora") && (
                            <div className="pl-6">
                                <select
                                    value={filtros.seguradora || ""}
                                    onChange={(e) => updateFiltro("seguradora", e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full text-sm border border-gray-300  rounded px-3 py-2 bg-white  text-gray-900 "
                                >
                                    <option value="">Todas as seguradoras</option>
                                    {filtrosDisponiveis?.seguradoras?.map((seguradora) => (
                                        <option key={seguradora.valor} value={seguradora.valor}>
                                            {seguradora.label} ({seguradora.count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags */}
                {filtrosDisponiveis?.tags && filtrosDisponiveis.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 ">
                        <button
                            onClick={() => toggleSection("tags")}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700  hover:text-gray-900 dark:hover:text-white mb-3"
                        >
                            <TagIcon className="h-4 w-4" />
                            Tags
                            {filtros.tags && filtros.tags.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                                    {filtros.tags.length}
                                </span>
                            )}
                        </button>
                        
                        {expandedSections.has("tags") && (
                            <div className="flex flex-wrap gap-2">
                                {filtrosDisponiveis.tags.map((tag) => {
                                    const isSelected = (filtros.tags || []).includes(tag.valor);
                                    return (
                                        <button
                                            key={tag.valor}
                                            onClick={() => toggleArrayValue("tags", tag.valor)}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                                isSelected
                                                    ? "bg-blue-100  border-blue-300  text-blue-800 "
                                                    : "border-gray-300  text-gray-700  hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                        >
                                            {tag.label} ({tag.count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
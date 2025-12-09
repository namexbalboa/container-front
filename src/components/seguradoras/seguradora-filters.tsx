"use client";

import { useState, useEffect } from "react";
import { SeguradoraFilters as FiltersType } from "@/types/api";

interface SeguradoraFiltersProps {
    filters: FiltersType;
    onFiltersChange: (filters: FiltersType) => void;
    onClearFilters: () => void;
}

export default function SeguradoraFilters({ 
    filters, 
    onFiltersChange, 
    onClearFilters 
}: SeguradoraFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [localFilters, setLocalFilters] = useState<FiltersType>(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleFilterChange = (key: keyof FiltersType, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleClearFilters = () => {
        const emptyFilters: FiltersType = {
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
        setLocalFilters(emptyFilters);
        onClearFilters();
    };

    const hasActiveFilters = Object.values(localFilters).some(value => 
        value !== "" && value !== undefined && value !== null
    );

    const ufs = [
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
        "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
        "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    return (
        <div className="bg-white  rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 ">
                    Filtros
                </h3>
                <div className="flex space-x-2">
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        {isExpanded ? "Recolher" : "Expandir"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700  mb-1">
                        Nome
                    </label>
                    <input
                        type="text"
                        value={localFilters.nomeSeguradora || ""}
                        onChange={(e) => handleFilterChange("nomeSeguradora", e.target.value)}
                        placeholder="Buscar por nome..."
                        className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700  mb-1">
                        CNPJ
                    </label>
                    <input
                        type="text"
                        value={localFilters.cnpj || ""}
                        onChange={(e) => handleFilterChange("cnpj", e.target.value)}
                        placeholder="00.000.000/0000-00"
                        className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700  mb-1">
                        Status
                    </label>
                    <select
                        value={localFilters.status || ""}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                    >
                        <option value="">Todos os status</option>
                        <option value="ativa">Ativo</option>
                            <option value="inativa">Inativo</option>
                        <option value="suspensa">Suspensa</option>
                    </select>
                </div>
            </div>

            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 ">
                    <div>
                        <label className="block text-sm font-medium text-gray-700  mb-1">
                            Cidade
                        </label>
                        <input
                            type="text"
                            value={localFilters.cidade || ""}
                            onChange={(e) => handleFilterChange("cidade", e.target.value)}
                            placeholder="Buscar por cidade..."
                            className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700  mb-1">
                            UF
                        </label>
                        <select
                            value={localFilters.uf || ""}
                            onChange={(e) => handleFilterChange("uf", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                        >
                            <option value="">Todos os estados</option>
                            {ufs.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700  mb-1">
                            Tem Averbações
                        </label>
                        <select
                            value={localFilters.temAverbacoes?.toString() || ""}
                            onChange={(e) => handleFilterChange("temAverbacoes", e.target.value === "" ? undefined : e.target.value === "true")}
                            className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                        >
                            <option value="">Todas</option>
                            <option value="true">Com averbações</option>
                            <option value="false">Sem averbações</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700  mb-1">
                            Data Início Atualização
                        </label>
                        <input
                            type="date"
                            value={localFilters.dataInicioAtualizacao || ""}
                            onChange={(e) => handleFilterChange("dataInicioAtualizacao", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700  mb-1">
                            Data Fim Atualização
                        </label>
                        <input
                            type="date"
                            value={localFilters.dataFimAtualizacao || ""}
                            onChange={(e) => handleFilterChange("dataFimAtualizacao", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700  mb-1">
                            Valor Mínimo (R$)
                        </label>
                        <input
                            type="number"
                            value={localFilters.valorMinimo || ""}
                            onChange={(e) => handleFilterChange("valorMinimo", e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="0,00"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700  mb-1">
                            Valor Máximo (R$)
                        </label>
                        <input
                            type="number"
                            value={localFilters.valorMaximo || ""}
                            onChange={(e) => handleFilterChange("valorMaximo", e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="0,00"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                        />
                    </div>
                </div>
            )}

            {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 ">
                    <p className="text-sm text-gray-600 ">
                        Filtros ativos: {Object.values(localFilters).filter(value => 
                            value !== "" && value !== undefined && value !== null
                        ).length}
                    </p>
                </div>
            )}
        </div>
    );
}
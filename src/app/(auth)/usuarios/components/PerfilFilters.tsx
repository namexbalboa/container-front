"use client";

import type { ChangeEvent } from "react";
import type { PerfilFilters } from "@/types/perfil";

interface PerfilFiltersProps {
  filters: PerfilFilters;
  onChange: (filters: Partial<PerfilFilters>) => void;
  onReset: () => void;
}

export function PerfilFilters({ filters, onChange, onReset }: PerfilFiltersProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ search: event.target.value, page: 1 });
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "") {
      onChange({ ativo: undefined, page: 1 });
    } else {
      onChange({ ativo: value === "true", page: 1 });
    }
  };

  const handleLevelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChange({
      nivelAcesso: value ? Number(value) : undefined,
      page: 1,
    });
  };

  const handleLimitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value) || 10;
    onChange({ limit: value, page: 1 });
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label htmlFor="perfil-search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              id="perfil-search"
              type="text"
              placeholder="Nome ou descricao do perfil"
              value={filters.search ?? ""}
              onChange={handleSearchChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="perfil-status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="perfil-status"
              value={
                filters.ativo === undefined || filters.ativo === null
                  ? ""
                  : String(filters.ativo)
              }
              onChange={handleStatusChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos os status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>

          <div>
            <label htmlFor="perfil-nivel" className="block text-sm font-medium text-gray-700">
              Nivel de acesso
            </label>
            <select
              id="perfil-nivel"
              value={filters.nivelAcesso ? String(filters.nivelAcesso) : ""}
              onChange={handleLevelChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              {[1, 2, 3, 4, 5].map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="perfil-limit" className="text-sm font-medium text-gray-700">
              Itens por pagina
            </label>
            <select
              id="perfil-limit"
              value={filters.limit ?? 10}
              onChange={handleLimitChange}
              className="block rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {[10, 20, 30, 50].map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  );
}


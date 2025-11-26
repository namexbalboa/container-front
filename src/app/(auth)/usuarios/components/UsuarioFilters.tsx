"use client";

import type { ChangeEvent } from "react";
import type { UsuarioFilters, StatusUsuario } from "@/types/usuario";
import type { Perfil } from "@/types/perfil";

interface UsuarioFiltersProps {
  filters: UsuarioFilters;
  perfis: Perfil[];
  onChange: (filters: Partial<UsuarioFilters>) => void;
  onReset: () => void;
}

const statusOptions: { label: string; value: StatusUsuario }[] = [
  { label: "Ativo", value: "ativo" },
  { label: "Inativo", value: "inativo" },
  { label: "Bloqueado", value: "bloqueado" },
];

export function UsuarioFilters({ filters, perfis, onChange, onReset }: UsuarioFiltersProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ search: event.target.value, page: 1 });
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as StatusUsuario | "";
    onChange({ status: value ? value : undefined, page: 1 });
  };

  const handlePerfilChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (!value) {
      onChange({ idPerfil: undefined, perfil: undefined, page: 1 });
      return;
    }

    const parsedValue = Number(value);
    const perfil = (perfis || []).find(item => item.idPerfil === parsedValue);

    onChange({
      idPerfil: parsedValue,
      perfil: perfil?.nomePerfil,
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
            <label htmlFor="usuario-search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              id="usuario-search"
              name="search"
              type="text"
              placeholder="Nome, email ou documento"
              value={filters.search ?? ""}
              onChange={handleSearchChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="usuario-perfil" className="block text-sm font-medium text-gray-700">
              Perfil
            </label>
            <select
              id="usuario-perfil"
              name="perfil"
              value={filters.idPerfil ? String(filters.idPerfil) : ""}
              onChange={handlePerfilChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos os perfis</option>
              {(perfis || []).map(perfil => (
                <option key={perfil.idPerfil} value={perfil.idPerfil}>
                  {perfil.nomePerfil}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="usuario-status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="usuario-status"
              name="status"
              value={filters.status ?? ""}
              onChange={handleStatusChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos os status</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="usuario-limit" className="text-sm font-medium text-gray-700">
              Itens por pagina
            </label>
            <select
              id="usuario-limit"
              name="limit"
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
            className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  );
}


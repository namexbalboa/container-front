"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { EmpresaTable } from "./components/EmpresaTable";
import { EmpresaForm } from "./components/EmpresaForm";
import { listarEmpresas } from "@/lib/empresas/api";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Empresa, EmpresaFilters } from "@/types/empresa";

export default function EmpresasPage() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filtros
  const [filters, setFilters] = useState<EmpresaFilters>({
    search: "",
    status: undefined,
    page: 1,
    limit: 10,
  });

  // Carregar empresas
  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const response = await listarEmpresas(filters);

      if (response.success && response.data) {
        setEmpresas(response.data.items);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpresas();
  }, [filters]);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterStatus = (status: EmpresaFilters["status"]) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleCreate = () => {
    setEditingEmpresa(null);
    setShowForm(true);
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEmpresa(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEmpresa(null);
    loadEmpresas();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Empresas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie as empresas cadastradas no sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Busca */}
          <div className="sm:col-span-2">
            <label htmlFor="search" className="sr-only">
              Buscar
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Buscar por razão social, CNPJ..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro de Status */}
          <div>
            <label htmlFor="status" className="sr-only">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.status || ""}
              onChange={(e) =>
                handleFilterStatus(
                  e.target.value ? (e.target.value as any) : undefined
                )
              }
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="suspenso">Suspenso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <EmpresaTable
            empresas={empresas}
            pagination={pagination}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onRefresh={loadEmpresas}
          />
        )}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <EmpresaForm
          empresa={editingEmpresa}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

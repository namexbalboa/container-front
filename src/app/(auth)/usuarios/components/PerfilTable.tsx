"use client";

import { useMemo, useState } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Perfil } from "@/types/perfil";

interface PerfilPagination {
  page: number;
  pages: number;
  limit: number;
  total: number;
}

interface PerfilTableProps {
  perfis: Perfil[];
  pagination?: PerfilPagination | null;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onEdit?: (perfil: Perfil) => void;
  onEditPermissoes?: (perfil: Perfil) => void;
  onDelete?: (perfil: Perfil) => Promise<void> | void;
  onStatusChange?: (perfil: Perfil, novoStatus: boolean) => Promise<void> | void;
}

function getStatus(perfil: Perfil): "ativo" | "inativo" {
  return perfil.ativo === false ? "inativo" : "ativo";
}

export function PerfilTable({
  perfis,
  pagination,
  loading,
  onPageChange,
  onEdit,
  onEditPermissoes,
  onDelete,
  onStatusChange,
}: PerfilTableProps) {
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null);

  const pageNumbers = useMemo(() => {
    if (!pagination) {
      return [];
    }

    const { page, pages } = pagination;

    if (pages <= 5) {
      return Array.from({ length: pages }, (_, index) => index + 1);
    }

    if (page <= 3) {
      return [1, 2, 3, 4, "...", pages] as (number | string)[];
    }

    if (page >= pages - 2) {
      return [1, "...", pages - 3, pages - 2, pages - 1, pages] as (number | string)[];
    }

    return [1, "...", page - 1, page, page + 1, "...", pages] as (number | string)[];
  }, [pagination]);

  const handleDelete = async (perfil: Perfil) => {
    if (!onDelete) {
      return;
    }

    const confirmed = typeof window !== "undefined"
      ? window.confirm(`Deseja excluir o perfil "${perfil.nomePerfil}"?`)
      : true;

    if (!confirmed) {
      return;
    }

    try {
      setLoadingActionId(perfil.idPerfil);
      await onDelete(perfil);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleToggleStatus = async (perfil: Perfil) => {
    if (!onStatusChange) {
      return;
    }

    try {
      setLoadingActionId(perfil.idPerfil);
      await onStatusChange(perfil, !(perfil.ativo ?? true));
    } finally {
      setLoadingActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!perfis.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-14 text-center">
        <ShieldCheckIcon className="h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Nenhum perfil cadastrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre um novo papel para controlar os acessos do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Perfil
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nivel
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Usuarios
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Permissoes
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {perfis.map(perfil => (
              <tr key={perfil.idPerfil} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-medium text-gray-900">{perfil.nomePerfil}</div>
                  {perfil.descricao && (
                    <div className="mt-1 text-sm text-gray-500">{perfil.descricao}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {perfil.nivelAcesso}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {perfil.totalUsuarios ?? 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {perfil.totalPermissoes ?? perfil.permissoes?.length ?? 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <StatusBadge status={getStatus(perfil)} size="sm" />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(perfil)}
                      disabled={loadingActionId === perfil.idPerfil}
                      className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {getStatus(perfil) === "ativo" ? "Desativar" : "Ativar"}
                    </button>
                    {onEditPermissoes && (
                      <button
                        type="button"
                        onClick={() => onEditPermissoes(perfil)}
                        className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <ShieldCheckIcon className="mr-1 h-4 w-4" />
                        Permissões
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(perfil)}
                        className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <PencilSquareIcon className="mr-1 h-4 w-4" />
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(perfil)}
                        disabled={loadingActionId === perfil.idPerfil}
                        className="inline-flex items-center rounded-md border border-transparent bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <TrashIcon className="mr-1 h-4 w-4" />
                        {loadingActionId === perfil.idPerfil ? "Removendo..." : "Excluir"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col gap-4 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Mostrando{" "}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            a{" "}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            de{" "}
            <span className="font-medium">{pagination.total}</span> perfis
          </p>

          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>

            {pageNumbers.map((pageNumber, index) =>
              typeof pageNumber === "string" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500"
                >
                  {pageNumber}
                </span>
              ) : (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onPageChange?.(pageNumber)}
                  className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    pageNumber === pagination.page
                      ? "border border-blue-500 bg-blue-50 text-blue-600"
                      : "border border-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              PrA ximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


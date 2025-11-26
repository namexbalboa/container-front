"use client";

import { useMemo, useState } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Usuario } from "@/types/usuario";

interface UsuariosPagination {
  page: number;
  pages: number;
  limit: number;
  total: number;
}

interface UsuarioTableProps {
  usuarios: Usuario[];
  pagination?: UsuariosPagination | null;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onEdit?: (usuario: Usuario) => void;
  onDelete?: (usuario: Usuario) => Promise<void> | void;
  onRefresh?: () => void;
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return new Intl.DateTimeFormat("pt-BR").format(date);
  } catch {
    return "-";
  }
}

export function UsuarioTable({
  usuarios,
  pagination,
  loading,
  onPageChange,
  onEdit,
  onDelete,
  onRefresh,
}: UsuarioTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const hasPagination = Boolean(pagination && pagination.pages > 1);
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

  const handleDelete = async (usuario: Usuario) => {
    if (!onDelete) {
      return;
    }

    const confirmed = typeof window !== "undefined"
      ? window.confirm(`Tem certeza que deseja excluir o usuA rio "${usuario.nomeCompleto}"?`)
      : true;

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(usuario.idUsuario);
      await onDelete(usuario);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNavigate = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!usuarios.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-14 text-center">
        <UsersIcon className="h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Nenhum usuario encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Ajuste os filtros ou cadastre um novo usuario.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-6 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Recarregar lista
          </button>
        )}
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
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Perfil
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Criado em
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {usuarios.map(usuario => (
              <tr key={usuario.idUsuario} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {usuario.nomeCompleto}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {usuario.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {usuario.perfil?.nomePerfil ?? "N/A"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <StatusBadge status={usuario.status} size="sm" />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(usuario.dataCriacao)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(usuario)}
                        className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <PencilSquareIcon className="mr-1 h-4 w-4" />
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(usuario)}
                        disabled={deletingId === usuario.idUsuario}
                        className="inline-flex items-center rounded-md border border-transparent bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <TrashIcon className="mr-1 h-4 w-4" />
                        {deletingId === usuario.idUsuario ? "Excluindo..." : "Excluir"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && hasPagination && (
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
            <span className="font-medium">{pagination.total}</span> resultados
          </p>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleNavigate(pagination.page - 1)}
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
                  onClick={() => handleNavigate(pageNumber)}
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
              onClick={() => handleNavigate(pagination.page + 1)}
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


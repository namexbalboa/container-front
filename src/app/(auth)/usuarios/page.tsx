"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ModernTabs,
  ModernTabsList,
  ModernTabsTrigger,
  ModernTabsContent
} from "@/components/ui/modern-tabs";
import { UsuarioFilters } from "./components/UsuarioFilters";
import { UsuarioTable } from "./components/UsuarioTable";
import { UsuarioForm } from "./components/UsuarioForm";
import { PerfilFilters } from "./components/PerfilFilters";
import { PerfilTable } from "./components/PerfilTable";
import { PerfilForm } from "./components/PerfilForm";
import { useAlert } from "@/contexts/AlertContext";
import {
  listarUsuarios,
  excluirUsuario,
} from "@/lib/usuarios/api";
import {
  listarPerfis,
  listarPerfisAtivos,
  excluirPerfil,
  atualizarPerfil,
} from "@/lib/perfis/api";
import type {
  Usuario,
  UsuarioFilters as UsuarioFiltersType,
} from "@/types/usuario";
import type {
  Perfil,
  PerfilFilters as PerfilFiltersType,
} from "@/types/perfil";

type PaginationState = {
  page: number;
  pages: number;
  limit: number;
  total: number;
};

const DEFAULT_USUARIO_PAGINATION: PaginationState = {
  page: 1,
  pages: 1,
  limit: 10,
  total: 0,
};

const DEFAULT_PERFIL_PAGINATION: PaginationState = {
  page: 1,
  pages: 1,
  limit: 10,
  total: 0,
};

const DEFAULT_USUARIO_FILTERS: UsuarioFiltersType = {
  page: 1,
  limit: 10,
  search: "",
  status: undefined,
  idPerfil: undefined,
  perfil: undefined,
};

const DEFAULT_PERFIL_FILTERS: PerfilFiltersType = {
  page: 1,
  limit: 10,
  search: "",
  ativo: undefined,
  nivelAcesso: undefined,
};

function normalizeItems<T>(payload: any): T[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.usuarios)) {
    return payload.usuarios;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function normalizePagination(
  payload: any,
  fallback: { page: number; limit: number },
  totalItems: number
): PaginationState {
  const raw = payload?.pagination ?? payload?.meta ?? {};
  const page = Number(raw.page ?? raw.currentPage ?? fallback.page) || fallback.page;
  const limit = Number(raw.limit ?? raw.perPage ?? fallback.limit) || fallback.limit;
  const total =
    Number(
      raw.total ??
        raw.totalItems ??
        raw.count ??
        payload?.total ??
        payload?.totalItems ??
        totalItems
    ) || totalItems;
  const pages =
    Number(raw.pages ?? raw.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1)) || 1;

  return {
    page: page < 1 ? 1 : page,
    pages: pages < 1 ? 1 : pages,
    limit,
    total,
  };
}

function normalizePaginatedResponse<T>(
  responseData: any,
  fallback: { page: number; limit: number }
) {
  const data = responseData?.data ?? responseData;
  const items = normalizeItems<T>(data);
  const pagination = normalizePagination(data, fallback, items.length);
  return { items, pagination };
}

export default function UsuariosPage() {
  const { showAlert } = useAlert();

  // Usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioPagination, setUsuarioPagination] = useState<PaginationState>(
    DEFAULT_USUARIO_PAGINATION
  );
  const [usuarioFilters, setUsuarioFilters] = useState<UsuarioFiltersType>(
    DEFAULT_USUARIO_FILTERS
  );
  const [usuariosLoading, setUsuariosLoading] = useState<boolean>(true);
  const [usuarioModalOpen, setUsuarioModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [perfisDisponiveis, setPerfisDisponiveis] = useState<Perfil[]>([]);

  // Perfis
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [perfilPagination, setPerfilPagination] =
    useState<PaginationState>(DEFAULT_PERFIL_PAGINATION);
  const [perfilFilters, setPerfilFilters] = useState<PerfilFiltersType>(
    DEFAULT_PERFIL_FILTERS
  );
  const [perfisLoading, setPerfisLoading] = useState<boolean>(true);
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState<Perfil | null>(null);

  const loadUsuarios = useCallback(async () => {
    try {
      setUsuariosLoading(true);
      const response = await listarUsuarios(usuarioFilters);

      if (!response.success) {
        throw new Error(response.message || "Nao foi possivel carregar os usuarios.");
      }

      const { items, pagination } = normalizePaginatedResponse<Usuario>(
        response,
        {
          page: usuarioFilters.page ?? 1,
          limit: usuarioFilters.limit ?? 10,
        }
      );

      setUsuarios(items);
      setUsuarioPagination(pagination);
    } catch (error: any) {
      console.error("Erro ao carregar usuarios:", error);
      showAlert("error", error?.message || "Erro ao carregar usuarios.");
      setUsuarios([]);
      setUsuarioPagination(DEFAULT_USUARIO_PAGINATION);
    } finally {
      setUsuariosLoading(false);
    }
  }, [usuarioFilters, showAlert]);

  const loadPerfis = useCallback(async () => {
    try {
      setPerfisLoading(true);
      const response = await listarPerfis(perfilFilters);

      if (!response.success) {
        throw new Error(response.message || "Nao foi possivel carregar os perfis.");
      }

      const { items, pagination } = normalizePaginatedResponse<Perfil>(
        response,
        {
          page: perfilFilters.page ?? 1,
          limit: perfilFilters.limit ?? 10,
        }
      );

      setPerfis(items);
      setPerfilPagination(pagination);
    } catch (error: any) {
      console.error("Erro ao carregar perfis:", error);
      showAlert("error", error?.message || "Erro ao carregar perfis.");
      setPerfis([]);
      setPerfilPagination(DEFAULT_PERFIL_PAGINATION);
    } finally {
      setPerfisLoading(false);
    }
  }, [perfilFilters, showAlert]);

  const loadPerfisAtivos = useCallback(async () => {
    try {
      const ativos = await listarPerfisAtivos();
      setPerfisDisponiveis(ativos);
    } catch (error) {
      console.error("Erro ao carregar perfis disponiveis:", error);
    }
  }, []);

  useEffect(() => {
    void loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    void loadPerfis();
  }, [loadPerfis]);

  useEffect(() => {
    void loadPerfisAtivos();
  }, [loadPerfisAtivos]);

  const handleUsuarioFiltersChange = (changes: Partial<UsuarioFiltersType>) => {
    setUsuarioFilters(prev => ({
      ...prev,
      ...changes,
      page: changes.page ?? prev.page ?? 1,
      limit: changes.limit ?? prev.limit ?? 10,
    }));
  };

  const handleUsuarioFiltersReset = () => {
    setUsuarioFilters(DEFAULT_USUARIO_FILTERS);
  };

  const handlePerfilFiltersChange = (changes: Partial<PerfilFiltersType>) => {
    setPerfilFilters(prev => ({
      ...prev,
      ...changes,
      page: changes.page ?? prev.page ?? 1,
      limit: changes.limit ?? prev.limit ?? 10,
    }));
  };

  const handlePerfilFiltersReset = () => {
    setPerfilFilters(DEFAULT_PERFIL_FILTERS);
  };

  const handleCreateUsuario = () => {
    setUsuarioSelecionado(null);
    setUsuarioModalOpen(true);
    if (!perfisDisponiveis || !perfisDisponiveis.length) {
      void loadPerfisAtivos();
    }
  };

  const handleEditUsuario = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setUsuarioModalOpen(true);
    if (!perfisDisponiveis || !perfisDisponiveis.length) {
      void loadPerfisAtivos();
    } else if (
      usuario.perfil &&
      !perfisDisponiveis.some(perfil => perfil.idPerfil === usuario.perfil?.idPerfil)
    ) {
      setPerfisDisponiveis(prev => [...(prev || []), usuario.perfil as Perfil]);
    }
  };

  const handleUsuarioDeleted = async (usuario: Usuario) => {
    try {
      const response = await excluirUsuario(usuario.idUsuario);

      if (!response.success) {
        throw new Error(response.message || "Nao foi possivel excluir o usuario.");
      }

      showAlert("success", "Usuario excluido com sucesso!");
      await loadUsuarios();
    } catch (error: any) {
      console.error("Erro ao excluir usuario:", error);
      showAlert("error", error?.message || "Erro ao excluir usuario.");
    }
  };

  const handleUsuarioSaved = () => {
    void loadUsuarios();
    void loadPerfisAtivos();
  };

  const handleCreatePerfil = () => {
    setPerfilSelecionado(null);
    setPerfilModalOpen(true);
  };

  const handleEditPerfil = (perfil: Perfil) => {
    setPerfilSelecionado(perfil);
    setPerfilModalOpen(true);
  };

  const handlePerfilDeleted = async (perfil: Perfil) => {
    try {
      const response = await excluirPerfil(perfil.idPerfil);

      if (!response.success) {
        throw new Error(response.message || "Nao foi possivel excluir o perfil.");
      }

      showAlert("success", "Perfil excluido com sucesso!");
      await loadPerfis();
      await loadPerfisAtivos();
    } catch (error: any) {
      console.error("Erro ao excluir perfil:", error);
      showAlert("error", error?.message || "Erro ao excluir perfil.");
    }
  };

  const handlePerfilStatusChange = async (perfil: Perfil, ativo: boolean) => {
    try {
      const response = await atualizarPerfil(perfil.idPerfil, { ativo });

      if (!response.success) {
        throw new Error(response.message || "Nao foi possivel atualizar o status do perfil.");
      }

      showAlert(
        "success",
        ativo ? "Perfil ativado com sucesso!" : "Perfil desativado com sucesso!"
      );
      await loadPerfis();
      await loadPerfisAtivos();
    } catch (error: any) {
      console.error("Erro ao atualizar status do perfil:", error);
      showAlert("error", error?.message || "Erro ao atualizar status do perfil.");
    }
  };

  const handlePerfilSaved = () => {
    void loadPerfis();
    void loadPerfisAtivos();
  };

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900">Usuarios e Papeis</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie contas de usuarios, configure papeis e defina niveis de acesso ao sistema.
        </p>
      </div>

      <ModernTabs defaultValue="usuarios" className="space-y-6">
        <ModernTabsList>
          <ModernTabsTrigger
            value="usuarios"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          >
            Usuarios
          </ModernTabsTrigger>
          <ModernTabsTrigger
            value="perfis"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          >
            Papeis
          </ModernTabsTrigger>
        </ModernTabsList>

        <ModernTabsContent value="usuarios" className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Usuarios do Sistema
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {usuarioPagination.total} usuario(s) cadastrado(s)
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateUsuario}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Usuario
              </button>
            </div>
          </div>

          <UsuarioFilters
            filters={usuarioFilters}
            perfis={perfisDisponiveis}
            onChange={handleUsuarioFiltersChange}
            onReset={handleUsuarioFiltersReset}
          />

          <UsuarioTable
            usuarios={usuarios}
            pagination={usuarioPagination}
            loading={usuariosLoading}
            onPageChange={page => handleUsuarioFiltersChange({ page })}
            onEdit={handleEditUsuario}
            onDelete={handleUsuarioDeleted}
            onRefresh={() => void loadUsuarios()}
          />
        </ModernTabsContent>

        <ModernTabsContent value="perfis" className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Papeis e Permissoes
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {perfilPagination.total} perfil(is) configurado(s)
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreatePerfil}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Perfil
              </button>
            </div>
          </div>

          <PerfilFilters
            filters={perfilFilters}
            onChange={handlePerfilFiltersChange}
            onReset={handlePerfilFiltersReset}
          />

          <PerfilTable
            perfis={perfis}
            pagination={perfilPagination}
            loading={perfisLoading}
            onPageChange={page => handlePerfilFiltersChange({ page })}
            onEdit={handleEditPerfil}
            onDelete={handlePerfilDeleted}
            onStatusChange={handlePerfilStatusChange}
          />
        </ModernTabsContent>
      </ModernTabs>

      <UsuarioForm
        open={usuarioModalOpen}
        onClose={() => setUsuarioModalOpen(false)}
        onSuccess={handleUsuarioSaved}
        perfis={perfisDisponiveis}
        usuario={usuarioSelecionado}
      />

      <PerfilForm
        open={perfilModalOpen}
        onClose={() => setPerfilModalOpen(false)}
        onSuccess={handlePerfilSaved}
        perfil={perfilSelecionado}
      />
    </div>
  );
}


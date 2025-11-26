/**
 * API helpers para Perfis e Permissões
 */

import { apiService } from "@/lib/api";
import type {
  Perfil,
  Permissao,
  PerfilCreate,
  PerfilUpdate,
  PermissaoCreate,
  PerfilFilters,
  PermissaoFilters,
  PerfisResponse,
  PerfilResponse,
  PermissoesResponse,
  PerfilPermissoesResponse,
} from "@/types/perfil";

// ============================================
// PERFIS
// ============================================

export async function listarPerfis(filters?: PerfilFilters): Promise<PerfisResponse> {
  return apiService.getPerfis(filters) as Promise<PerfisResponse>;
}

export async function buscarPerfil(id: number): Promise<PerfilResponse> {
  return apiService.getPerfilById(id) as Promise<PerfilResponse>;
}

export async function criarPerfil(data: PerfilCreate): Promise<PerfilResponse> {
  return apiService.createPerfil(data) as Promise<PerfilResponse>;
}

export async function atualizarPerfil(id: number, data: PerfilUpdate): Promise<PerfilResponse> {
  return apiService.updatePerfil(id, data) as Promise<PerfilResponse>;
}

export async function excluirPerfil(id: number): Promise<{ success: boolean; message?: string }> {
  return apiService.deletePerfil(id) as Promise<{ success: boolean; message?: string }>;
}

// ============================================
// PERMISSÕES
// ============================================

export async function listarPermissoes(filters?: PermissaoFilters): Promise<PermissoesResponse> {
  return apiService.getPermissoes(filters);
}

export async function buscarPermissao(id: number) {
  return apiService.getPermissao(id);
}

export async function criarPermissao(data: PermissaoCreate) {
  return apiService.createPermissao(data);
}

// ============================================
// PERFIL + PERMISSÕES
// ============================================

export async function listarPermissoesDoPerfil(perfilId: number): Promise<PerfilPermissoesResponse> {
  return apiService.get<Permissao[]>(`/perfis/${perfilId}/permissoes`);
}

export async function associarPermissoes(perfilId: number, permissoes: number[]) {
  return apiService.post(`/perfis/${perfilId}/permissoes`, { permissoes });
}

export async function removerPermissao(perfilId: number, permissaoId: number) {
  return apiService.delete(`/perfis/${perfilId}/permissoes/${permissaoId}`);
}

// ============================================
// HELPERS
// ============================================

export async function listarPerfisAtivos(): Promise<Perfil[]> {
  const response = await listarPerfis({ ativo: true, limit: 1000 });
  if (!response.success || !response.data) {
    return [];
  }
  // Handle both response structures: direct array or items object
  return Array.isArray(response.data) ? response.data : (response.data.items || []);
}

export async function agruparPermissoesPorModulo(permissoes: Permissao[]) {
  const grupos = permissoes.reduce((acc, permissao) => {
    if (!acc[permissao.modulo]) {
      acc[permissao.modulo] = [];
    }
    acc[permissao.modulo].push(permissao);
    return acc;
  }, {} as Record<string, Permissao[]>);

  return Object.entries(grupos).map(([modulo, permissoes]) => ({
    modulo,
    permissoes,
  }));
}

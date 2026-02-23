/**
 * API helpers para Usuários
 */

import { apiService } from "@/lib/api";
import type {
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
  UsuarioAlterarSenha,
  UsuarioAlterarStatus,
  UsuarioFilters,
  UsuariosResponse,
  UsuarioResponse,
  UsuarioComPermissoes,
} from "@/types/usuario";

// ============================================
// USUÁRIOS
// ============================================

export async function listarUsuarios(filters?: UsuarioFilters): Promise<UsuariosResponse> {
  return apiService.getUsuarios(filters);
}

export async function buscarUsuario(id: number): Promise<UsuarioResponse> {
  return apiService.getUsuario(id);
}

export async function criarUsuario(data: UsuarioCreate): Promise<UsuarioResponse> {
  return apiService.createUsuario(data);
}

export async function atualizarUsuario(id: number, data: UsuarioUpdate): Promise<UsuarioResponse> {
  return apiService.updateUsuario(id, data);
}

export async function excluirUsuario(id: number): Promise<{ success: boolean; message?: string }> {
  return apiService.deleteUsuario(id);
}

export async function alterarStatusUsuario(
  id: number,
  status: "ativo" | "inativo" | "bloqueado"
): Promise<UsuarioResponse> {
  return apiService.updateUsuarioStatus(id, status);
}

export async function alterarSenhaUsuario(id: number, data: UsuarioAlterarSenha) {
  return apiService.put(`/usuarios/${id}/senha`, data);
}

// ============================================
// HELPERS
// ============================================

export async function buscarUsuarioComPermissoes(id: number): Promise<UsuarioComPermissoes> {
  const response = await buscarUsuario(id);

  if (response.success && response.data) {
    const usuario = response.data;

    return {
      ...usuario,
      permissoesHerdadas: usuario.perfil?.permissoes || usuario.permissoes || [],
    };
  }

  throw new Error(response.message || "Erro ao buscar usuário");
}

export async function listarUsuariosAtivos(): Promise<Usuario[]> {
  const response = await listarUsuarios({ status: "ativo", limit: 1000 });
  return response.success && response.data ? response.data.items : [];
}

// ============================================
// RECUPERAÇÃO DE SENHA
// ============================================

export async function solicitarRecuperacaoSenha(email: string): Promise<{ success: boolean; message: string; devCode?: string }> {
  const response = await apiService.post<{ message: string; devCode?: string }>("/auth/forgot-password", { email });

  if (!response.success) {
    throw new Error(response.message || "Erro ao solicitar recuperação de senha.");
  }

  return {
    success: true,
    message: response.data?.message || "Se o email estiver cadastrado, você receberá um código de recuperação.",
    devCode: response.data?.devCode,
  };
}

export async function redefinirSenha(email: string, codigo: string, novaSenha: string): Promise<{ success: boolean; message: string }> {
  const response = await apiService.post<{ message: string }>("/auth/reset-password", {
    email,
    codigo,
    novaSenha,
  });

  return {
    success: response.success,
    message: response.data?.message || response.message || (response.success ? "Senha redefinida com sucesso." : "Erro ao redefinir senha."),
  };
}

export async function verificarEmailEmUso(email: string, excluirId?: number): Promise<boolean> {
  try {
    const response = await listarUsuarios({ search: email, limit: 10 });

    if (response.success && response.data) {
      const usuarios = response.data.items.filter(
        u => u.email.toLowerCase() === email.toLowerCase() && u.idUsuario !== excluirId
      );
      return usuarios.length > 0;
    }

    return false;
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    return false;
  }
}

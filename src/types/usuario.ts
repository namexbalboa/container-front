/**
 * Tipos para Usuários
 */

import { Perfil, Permissao } from './perfil';

export type StatusUsuario = "ativo" | "inativo" | "bloqueado";

export interface Usuario {
  idUsuario: number;
  nomeCompleto: string;
  email: string;
  cpf?: string;
  telefone?: string;
  celular?: string;
  status: StatusUsuario;
  idPerfil: number;
  perfil?: Perfil;
  permissoes?: Permissao[];
  dataCriacao?: string;
  dataAtualizacao?: string;
  ultimoAcesso?: string;
  avatar?: string;
}

// Tipos para formulários (Create)
export interface UsuarioCreate {
  nomeCompleto: string;
  email: string;
  senha: string;
  idPerfil: number;
  status?: StatusUsuario;
  cpf?: string;
  telefone?: string;
  celular?: string;
}

export interface UsuarioUpdate {
  nomeCompleto?: string;
  email?: string;
  idPerfil?: number;
  cpf?: string;
  telefone?: string;
  celular?: string;
  status?: StatusUsuario;
}

export interface UsuarioAlterarSenha {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoSenha: string;
}

export interface UsuarioAlterarStatus {
  status: StatusUsuario;
  motivo?: string;
}

// Tipos para filtros
export interface UsuarioFilters {
  status?: StatusUsuario;
  idPerfil?: number;
  perfil?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Tipos para respostas da API
export interface UsuarioResponse {
  success: boolean;
  message?: string;
  data: Usuario;
}

export interface UsuariosResponse {
  success: boolean;
  message?: string;
  data: {
    items: Usuario[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// Tipo para visualização com permissões herdadas
export interface UsuarioComPermissoes extends Usuario {
  permissoesHerdadas: Permissao[];
}

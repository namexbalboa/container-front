/**
 * Tipos para Perfis (Papéis) e Permissões
 */

export interface Permissao {
  idPermissao: number;
  codigo: string;
  nomePermissao: string;
  descricao?: string;
  modulo: string;
  acao: string;
  dataCriacao?: string;
}

export interface Perfil {
  idPerfil: number;
  nomePerfil: string;
  descricao?: string;
  nivelAcesso: number;
  ativo?: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
  permissoes?: Permissao[];
  totalPermissoes?: number;
  totalUsuarios?: number;
}

// Tipos para formulários (Create)
export interface PerfilCreate {
  nomePerfil: string;
  descricao?: string;
  nivelAcesso: number;
  permissoes?: number[]; // IDs das permissões
}

export interface PerfilUpdate extends Partial<PerfilCreate> {
  ativo?: boolean;
}

export interface PermissaoCreate {
  codigo: string;
  nomePermissao: string;
  descricao?: string;
  modulo: string;
  acao: string;
}

export interface PermissaoUpdate extends Partial<PermissaoCreate> {}

// Tipos para agrupamento de permissões
export interface PermissaoModulo {
  modulo: string;
  permissoes: Permissao[];
}

export interface PermissaoAcao {
  acao: string;
  codigo: string;
  nome: string;
  descricao?: string;
  selecionado?: boolean;
}

export interface PermissaoTree {
  modulo: string;
  acoes: PermissaoAcao[];
}

// Tipos para filtros
export interface PerfilFilters {
  ativo?: boolean;
  search?: string;
  nivelAcesso?: number;
  page?: number;
  limit?: number;
}

export interface PermissaoFilters {
  modulo?: string;
  acao?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Tipos para respostas da API
export interface PerfilResponse {
  success: boolean;
  message?: string;
  data: Perfil;
}

export interface PerfisResponse {
  success: boolean;
  message?: string;
  data: {
    items: Perfil[];
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

export interface PermissaoResponse {
  success: boolean;
  message?: string;
  data: Permissao;
}

export interface PermissoesResponse {
  success: boolean;
  message?: string;
  data: {
    items: Permissao[];
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

export interface PerfilPermissoesResponse {
  success: boolean;
  message?: string;
  data: Permissao[];
}

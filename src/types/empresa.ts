/**
 * Tipos para Empresas (Clientes) e Filiais
 */

export type StatusEmpresa = "ativo" | "inativo" | "suspenso";
export type StatusFilial = "ativo" | "inativo";

export interface Empresa {
  idCliente: number;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoEstadual?: string;
  telefone?: string;
  emailComercial?: string;
  site?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  status: StatusEmpresa;
  observacoes?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
  filiais?: Filial[];
  totalFiliais?: number;
}

export interface Filial {
  idFilial: number;
  idCliente: number;
  nomeFilial: string;
  cnpjFilial?: string;
  inscricaoEstadual?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  responsavel?: string;
  status: StatusFilial;
  dataCriacao?: string;
  dataAtualizacao?: string;
  cliente?: Empresa;
}

// Tipos para formulários (Create)
export interface EmpresaCreate {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoEstadual?: string;
  telefone?: string;
  emailComercial?: string;
  site?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
}

export interface EmpresaUpdate extends Partial<EmpresaCreate> {
  status?: StatusEmpresa;
}

export interface FilialCreate {
  nomeFilial: string;
  cnpjFilial?: string;
  inscricaoEstadual?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  responsavel?: string;
}

export interface FilialUpdate extends Partial<FilialCreate> {
  status?: StatusFilial;
}

// Tipos para filtros
export interface EmpresaFilters {
  status?: StatusEmpresa;
  search?: string;
  cnpj?: string;
  cidade?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface FilialFilters {
  status?: StatusFilial;
  search?: string;
  cidade?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

// Tipos para respostas da API
export interface EmpresaResponse {
  success: boolean;
  message?: string;
  data: Empresa;
}

export interface EmpresasResponse {
  success: boolean;
  message?: string;
  data: {
    items: Empresa[];
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

export interface FilialResponse {
  success: boolean;
  message?: string;
  data: Filial;
}

export interface FiliaisResponse {
  success: boolean;
  message?: string;
  data: Filial[];
}

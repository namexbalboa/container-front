/**
 * API helpers para Empresas e Filiais
 */

import { apiService } from "@/lib/api";
import type {
  Empresa,
  Filial,
  EmpresaCreate,
  EmpresaUpdate,
  FilialCreate,
  FilialUpdate,
  EmpresaFilters,
  FilialFilters,
  EmpresasResponse,
  EmpresaResponse,
  FilialResponse,
  FiliaisResponse,
} from "@/types/empresa";

// ============================================
// EMPRESAS (CLIENTES)
// ============================================

/**
 * Listar empresas com paginação e filtros
 */
export async function listarEmpresas(filters?: EmpresaFilters): Promise<EmpresasResponse> {
  return apiService.getClientes(filters);
}

/**
 * Buscar empresa por ID
 */
export async function buscarEmpresa(id: number): Promise<EmpresaResponse> {
  return apiService.getCliente(id);
}

/**
 * Criar nova empresa
 */
export async function criarEmpresa(data: EmpresaCreate): Promise<EmpresaResponse> {
  return apiService.createCliente(data);
}

/**
 * Atualizar empresa
 */
export async function atualizarEmpresa(
  id: number,
  data: EmpresaUpdate
): Promise<EmpresaResponse> {
  return apiService.updateCliente(id, data);
}

/**
 * Excluir empresa
 */
export async function excluirEmpresa(id: number): Promise<{ success: boolean; message?: string }> {
  return apiService.deleteCliente(id);
}

/**
 * Alterar status da empresa
 */
export async function alterarStatusEmpresa(
  id: number,
  status: "ativo" | "inativo" | "suspenso"
): Promise<EmpresaResponse> {
  return apiService.updateClienteStatus(id, status);
}

// ============================================
// FILIAIS
// ============================================

/**
 * Listar filiais de uma empresa
 */
export async function listarFiliais(clienteId: number): Promise<FiliaisResponse> {
  return apiService.get<Filial[]>(`/clientes/${clienteId}/filiais`);
}

/**
 * Buscar filial por ID
 */
export async function buscarFilial(
  clienteId: number,
  filialId: number
): Promise<FilialResponse> {
  return apiService.get<Filial>(`/clientes/${clienteId}/filiais/${filialId}`);
}

/**
 * Criar nova filial para uma empresa
 */
export async function criarFilial(
  clienteId: number,
  data: FilialCreate
): Promise<FilialResponse> {
  return apiService.post<Filial>(`/clientes/${clienteId}/filiais`, data);
}

/**
 * Atualizar filial
 */
export async function atualizarFilial(
  clienteId: number,
  filialId: number,
  data: FilialUpdate
): Promise<FilialResponse> {
  return apiService.put<Filial>(`/clientes/${clienteId}/filiais/${filialId}`, data);
}

/**
 * Excluir filial
 */
export async function excluirFilial(
  clienteId: number,
  filialId: number
): Promise<{ success: boolean; message?: string }> {
  return apiService.delete<void>(`/clientes/${clienteId}/filiais/${filialId}`);
}

/**
 * Alterar status da filial
 */
export async function alterarStatusFilial(
  clienteId: number,
  filialId: number,
  status: "ativo" | "inativo"
): Promise<FilialResponse> {
  return apiService.put<Filial>(`/clientes/${clienteId}/filiais/${filialId}`, { status });
}

// ============================================
// HELPERS
// ============================================

/**
 * Buscar empresa com suas filiais
 */
export async function buscarEmpresaComFiliais(id: number): Promise<Empresa> {
  const empresaResponse = await buscarEmpresa(id);
  const filiaisResponse = await listarFiliais(id);

  if (empresaResponse.success && empresaResponse.data) {
    return {
      ...empresaResponse.data,
      filiais: filiaisResponse.success ? filiaisResponse.data : [],
      totalFiliais: filiaisResponse.success ? filiaisResponse.data.length : 0,
    };
  }

  throw new Error(empresaResponse.message || "Erro ao buscar empresa");
}

/**
 * Buscar empresas ativas
 */
export async function listarEmpresasAtivas(): Promise<Empresa[]> {
  const response = await listarEmpresas({ status: "ativo", limit: 1000 });

  if (response.success && response.data) {
    return response.data.items;
  }

  return [];
}

/**
 * Verificar se CNPJ já está em uso
 */
export async function verificarCNPJEmUso(cnpj: string, excluirId?: number): Promise<boolean> {
  try {
    const response = await listarEmpresas({ cnpj, limit: 1 });

    if (response.success && response.data) {
      const empresas = response.data.items.filter(e => e.idCliente !== excluirId);
      return empresas.length > 0;
    }

    return false;
  } catch (error) {
    console.error("Erro ao verificar CNPJ:", error);
    return false;
  }
}

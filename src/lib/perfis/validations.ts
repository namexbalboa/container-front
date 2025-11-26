/**
 * Validações Zod para Perfis e Permissões
 */

import { z } from "zod";

// Schema para Perfil (Create)
export const perfilCreateSchema = z.object({
  nomePerfil: z.string()
    .min(3, "Nome do perfil deve ter no mínimo 3 caracteres")
    .max(100, "Nome do perfil deve ter no máximo 100 caracteres"),

  descricao: z.string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),

  nivelAcesso: z.number()
    .int("Nível de acesso deve ser um número inteiro")
    .min(1, "Nível de acesso deve ser no mínimo 1")
    .max(10, "Nível de acesso deve ser no máximo 10"),

  permissoes: z.array(z.number().int().positive())
    .optional()
    .default([]),
});

// Schema para Perfil (Update)
export const perfilUpdateSchema = perfilCreateSchema.partial().extend({
  ativo: z.boolean().optional(),
});

// Schema para Permissão (Create)
export const permissaoCreateSchema = z.object({
  codigo: z.string()
    .min(3, "Código deve ter no mínimo 3 caracteres")
    .max(100, "Código deve ter no máximo 100 caracteres")
    .regex(/^[A-Z_]+$/, "Código deve conter apenas letras maiúsculas e underscores")
    .transform(val => val.toUpperCase()),

  nomePermissao: z.string()
    .min(3, "Nome da permissão deve ter no mínimo 3 caracteres")
    .max(100, "Nome da permissão deve ter no máximo 100 caracteres"),

  descricao: z.string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),

  modulo: z.string()
    .min(2, "Módulo deve ter no mínimo 2 caracteres")
    .max(50, "Módulo deve ter no máximo 50 caracteres")
    .transform(val => val.toUpperCase()),

  acao: z.string()
    .min(2, "Ação deve ter no mínimo 2 caracteres")
    .max(50, "Ação deve ter no máximo 50 caracteres")
    .transform(val => val.toUpperCase()),
});

// Schema para Permissão (Update)
export const permissaoUpdateSchema = permissaoCreateSchema.partial();

// Schema para associar permissões a perfil
export const perfilPermissoesSchema = z.object({
  permissoes: z.array(z.number().int().positive())
    .min(1, "Selecione pelo menos uma permissão"),
});

// Tipos inferidos dos schemas
export type PerfilCreateInput = z.infer<typeof perfilCreateSchema>;
export type PerfilUpdateInput = z.infer<typeof perfilUpdateSchema>;
export type PermissaoCreateInput = z.infer<typeof permissaoCreateSchema>;
export type PermissaoUpdateInput = z.infer<typeof permissaoUpdateSchema>;
export type PerfilPermissoesInput = z.infer<typeof perfilPermissoesSchema>;

// Helpers para validação de nível de acesso
export const NIVEIS_ACESSO = [
  { value: 1, label: "Nível 1 - Básico", description: "Acesso apenas para leitura" },
  { value: 2, label: "Nível 2 - Intermediário", description: "Leitura e criação" },
  { value: 3, label: "Nível 3 - Avançado", description: "Leitura, criação e edição" },
  { value: 4, label: "Nível 4 - Administrador", description: "Acesso total (CRUD)" },
  { value: 5, label: "Nível 5 - Super Admin", description: "Acesso total incluindo gestão de permissões" },
] as const;

// Helper para gerar código de permissão
export function gerarCodigoPermissao(modulo: string, acao: string): string {
  return `${modulo.toUpperCase()}_${acao.toUpperCase()}`;
}

// Helper para validar se código de permissão já existe
export function validarCodigoUnico(codigo: string, permissoesExistentes: string[]): boolean {
  return !permissoesExistentes.includes(codigo.toUpperCase());
}

// Módulos padrão do sistema
export const MODULOS_SISTEMA = [
  "USUARIO",
  "PERFIL",
  "PERMISSAO",
  "CLIENTE",
  "FILIAL",
  "CONTAINER",
  "AVERBACAO",
  "SEGURADORA",
  "DASHBOARD",
  "RELATORIO",
] as const;

// Ações padrão
export const ACOES_SISTEMA = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "MANAGE",
  "EXPORT",
  "IMPORT",
] as const;

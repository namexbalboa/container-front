/**
 * Validações Zod para Empresas e Filiais
 */

import { z } from "zod";

// Validação de CNPJ
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;

// Validação de CEP
const cepRegex = /^\d{5}-\d{3}$|^\d{8}$/;

// Validação de Email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Schema para Empresa (Create)
export const empresaCreateSchema = z.object({
  razaoSocial: z.string()
    .min(3, "Razão social deve ter no mínimo 3 caracteres")
    .max(255, "Razão social deve ter no máximo 255 caracteres"),

  nomeFantasia: z.string()
    .max(255, "Nome fantasia deve ter no máximo 255 caracteres")
    .optional()
    .or(z.literal("")),

  cnpj: z.string()
    .min(1, "CNPJ é obrigatório")
    .refine((val) => {
      const cleaned = val.replace(/\D/g, "");
      return cleaned.length === 14;
    }, "CNPJ deve ter 14 dígitos"),

  inscricaoEstadual: z.string()
    .max(20, "Inscrição estadual deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),

  telefone: z.string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),

  emailComercial: z.string()
    .min(1, "Email é obrigatório")
    .regex(emailRegex, "Email inválido"),

  site: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val || val === "") return true;
      return /^https?:\/\/.+/.test(val);
    }, "URL inválida"),

  endereco: z.string()
    .max(255, "Endereço deve ter no máximo 255 caracteres")
    .optional()
    .or(z.literal("")),

  numero: z.string()
    .max(20, "Número deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),

  complemento: z.string()
    .max(100, "Complemento deve ter no máximo 100 caracteres")
    .optional()
    .or(z.literal("")),

  bairro: z.string()
    .max(100, "Bairro deve ter no máximo 100 caracteres")
    .optional()
    .or(z.literal("")),

  cidade: z.string()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .optional()
    .or(z.literal("")),

  estado: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val || val === "") return true;
      return val.length === 2;
    }, "Estado deve ter 2 caracteres (UF)"),

  cep: z.string()
    .optional()
    .or(z.literal("")),

  observacoes: z.string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
});

// Schema para Empresa (Update)
export const empresaUpdateSchema = empresaCreateSchema.partial().extend({
  status: z.enum(["ativo", "inativo", "suspenso"]).optional(),
});

// Schema para Filial (Create)
export const filialCreateSchema = z.object({
  nomeFilial: z.string()
    .min(3, "Nome da filial deve ter no mínimo 3 caracteres")
    .max(255, "Nome da filial deve ter no máximo 255 caracteres"),

  cnpjFilial: z.string()
    .regex(cnpjRegex, "CNPJ inválido. Use o formato: 00.000.000/0000-00 ou 14 dígitos")
    .optional()
    .or(z.literal("")),

  inscricaoEstadual: z.string()
    .max(20, "Inscrição estadual deve ter no máximo 20 caracteres")
    .optional(),

  telefone: z.string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .optional(),

  email: z.string()
    .regex(emailRegex, "Email inválido")
    .optional()
    .or(z.literal("")),

  endereco: z.string()
    .max(255, "Endereço deve ter no máximo 255 caracteres")
    .optional(),

  numero: z.string()
    .max(20, "Número deve ter no máximo 20 caracteres")
    .optional(),

  complemento: z.string()
    .max(100, "Complemento deve ter no máximo 100 caracteres")
    .optional(),

  bairro: z.string()
    .max(100, "Bairro deve ter no máximo 100 caracteres")
    .optional(),

  cidade: z.string()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .optional(),

  estado: z.string()
    .length(2, "Estado deve ter 2 caracteres (UF)")
    .optional()
    .or(z.literal("")),

  cep: z.string()
    .regex(cepRegex, "CEP inválido. Use o formato: 00000-000 ou 8 dígitos")
    .optional()
    .or(z.literal("")),

  responsavel: z.string()
    .max(255, "Responsável deve ter no máximo 255 caracteres")
    .optional(),
});

// Schema para Filial (Update)
export const filialUpdateSchema = filialCreateSchema.partial().extend({
  status: z.enum(["ativo", "inativo"]).optional(),
});

// Tipos inferidos dos schemas
export type EmpresaCreateInput = z.infer<typeof empresaCreateSchema>;
export type EmpresaUpdateInput = z.infer<typeof empresaUpdateSchema>;
export type FilialCreateInput = z.infer<typeof filialCreateSchema>;
export type FilialUpdateInput = z.infer<typeof filialUpdateSchema>;

// Helper para formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

// Helper para formatar CEP
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) return cep;
  return cleaned.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

// Helper para formatar Telefone
export function formatTelefone(telefone: string): string {
  const cleaned = telefone.replace(/\D/g, "");

  // (00) 0000-0000 ou (00) 00000-0000
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  } else if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  return telefone;
}

// Helper para remover formatação
export function removeMask(value: string): string {
  return value.replace(/\D/g, "");
}

// Helper para validar CNPJ
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false; // Todos os dígitos iguais

  // Validação dos dígitos verificadores
  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

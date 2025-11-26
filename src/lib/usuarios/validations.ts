/**
 * Validações Zod para Usuários
 */

import { z } from "zod";

// Validação de CPF
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

// Validação de telefone (formato brasileiro)
const telefoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$|^\d{10,11}$/;

// Schema para Usuário (Create)
export const usuarioCreateSchema = z.object({
  nomeCompleto: z.string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres")
    .max(255, "Nome completo deve ter no máximo 255 caracteres"),

  email: z.string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),

  senha: z.string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
    ),

  idPerfil: z.number()
    .int("ID do perfil deve ser um número inteiro")
    .positive("Selecione um perfil válido"),

  cpf: z.string()
    .regex(cpfRegex, "CPF inválido. Use o formato: 000.000.000-00 ou 11 dígitos")
    .optional()
    .or(z.literal("")),

  telefone: z.string()
    .regex(telefoneRegex, "Telefone inválido. Use o formato: (00) 0000-0000")
    .optional()
    .or(z.literal("")),

  celular: z.string()
    .regex(telefoneRegex, "Celular inválido. Use o formato: (00) 00000-0000")
    .optional()
    .or(z.literal("")),
});

// Schema para Usuário (Update)
export const usuarioUpdateSchema = z.object({
  nomeCompleto: z.string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres")
    .max(255, "Nome completo deve ter no máximo 255 caracteres")
    .optional(),

  email: z.string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres")
    .optional(),

  idPerfil: z.number()
    .int("ID do perfil deve ser um número inteiro")
    .positive("Selecione um perfil válido")
    .optional(),

  cpf: z.string()
    .regex(cpfRegex, "CPF inválido. Use o formato: 000.000.000-00 ou 11 dígitos")
    .optional()
    .or(z.literal("")),

  telefone: z.string()
    .regex(telefoneRegex, "Telefone inválido. Use o formato: (00) 0000-0000")
    .optional()
    .or(z.literal("")),

  celular: z.string()
    .regex(telefoneRegex, "Celular inválido. Use o formato: (00) 00000-0000")
    .optional()
    .or(z.literal("")),

  status: z.enum(["ativo", "inativo", "bloqueado"]).optional(),
});

// Schema para alterar senha
export const alterarSenhaSchema = z.object({
  senhaAtual: z.string()
    .min(1, "Senha atual é obrigatória"),

  novaSenha: z.string()
    .min(6, "Nova senha deve ter no mínimo 6 caracteres")
    .max(100, "Nova senha deve ter no máximo 100 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
    ),

  confirmacaoSenha: z.string()
    .min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.novaSenha === data.confirmacaoSenha, {
  message: "As senhas não coincidem",
  path: ["confirmacaoSenha"],
});

// Schema para alterar status
export const alterarStatusSchema = z.object({
  status: z.enum(["ativo", "inativo", "bloqueado"]),
  motivo: z.string()
    .max(500, "Motivo deve ter no máximo 500 caracteres")
    .optional(),
});

// Tipos inferidos dos schemas
export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;
export type AlterarStatusInput = z.infer<typeof alterarStatusSchema>;

// Helper para formatar CPF
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

// Helper para formatar telefone
export function formatTelefone(telefone: string): string {
  const cleaned = telefone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  return telefone;
}

// Helper para validar CPF
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false; // Todos os dígitos iguais

  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

  return true;
}

// Helper para calcular força da senha
export function calcularForcaSenha(senha: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  // Comprimento
  if (senha.length >= 8) score += 1;
  if (senha.length >= 12) score += 1;

  // Tem letras minúsculas
  if (/[a-z]/.test(senha)) score += 1;

  // Tem letras maiúsculas
  if (/[A-Z]/.test(senha)) score += 1;

  // Tem números
  if (/\d/.test(senha)) score += 1;

  // Tem caracteres especiais
  if (/[!@#$%^&*(),.?":{}|<>]/.test(senha)) score += 1;

  if (score <= 2) {
    return { score, label: "Fraca", color: "red" };
  } else if (score <= 4) {
    return { score, label: "Média", color: "yellow" };
  } else {
    return { score, label: "Forte", color: "green" };
  }
}

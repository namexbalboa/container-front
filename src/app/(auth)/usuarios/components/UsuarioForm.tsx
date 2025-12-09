"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAlert } from "@/contexts/AlertContext";
import {
  criarUsuario,
  atualizarUsuario,
} from "@/lib/usuarios/api";
import type { Usuario, UsuarioCreate, UsuarioUpdate } from "@/types/usuario";
import type { Perfil } from "@/types/perfil";

const baseSchema = z.object({
  nomeCompleto: z.string().min(1, "Informe o nome completo"),
  email: z.string().email("Informe um email valido"),
  idPerfil: z.coerce.number().min(1, "Selecione um perfil"),
  status: z.enum(["ativo", "inativo", "bloqueado"]),
});

const createSchema = baseSchema.extend({
  senha: z.string().min(6, "A senha deve ter no minimo 6 caracteres"),
});

const updateSchema = baseSchema.extend({
  senha: z
    .string()
    .optional()
    .transform(value => (value ? value.trim() : undefined))
    .refine(value => !value || value.length >= 6, {
      message: "A senha deve ter no minimo 6 caracteres",
    }),
});

type UsuarioFormCreateData = z.infer<typeof createSchema>;
type UsuarioFormUpdateData = z.infer<typeof updateSchema>;

interface UsuarioFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  perfis: Perfil[];
  usuario?: Usuario | null;
}

export function UsuarioForm({
  open,
  onClose,
  onSuccess,
  perfis,
  usuario,
}: UsuarioFormProps) {
  const isEdit = Boolean(usuario);
  const { showAlert } = useAlert();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormCreateData | UsuarioFormUpdateData>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
    defaultValues: {
      nomeCompleto: "",
      email: "",
      senha: "",
      idPerfil: (perfis || [])[0]?.idPerfil ?? 0,
      status: "ativo",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (usuario) {
      reset({
        nomeCompleto: usuario.nomeCompleto,
        email: usuario.email,
        senha: "",
        idPerfil: usuario.idPerfil ?? usuario.perfil?.idPerfil ?? (perfis || [])[0]?.idPerfil ?? 0,
        status: usuario.status,
      });
    } else {
      reset({
        nomeCompleto: "",
        email: "",
        senha: "",
        idPerfil: (perfis || [])[0]?.idPerfil ?? 0,
        status: "ativo",
      });
    }
  }, [open, usuario, perfis, reset]);

  if (!open) {
    return null;
  }

  const onSubmit = async (formData: UsuarioFormCreateData | UsuarioFormUpdateData) => {
    try {
      if (isEdit && usuario) {
        const payload: UsuarioUpdate = {
          nomeCompleto: formData.nomeCompleto,
          email: formData.email,
          idPerfil: formData.idPerfil,
          status: formData.status,
        };

        if ("senha" in formData && formData.senha) {
          payload.senha = formData.senha;
        }

        const response = await atualizarUsuario(usuario.idUsuario, payload);

        if (!response.success) {
          throw new Error(response.message || "Nao foi possivel atualizar o usuario.");
        }
        showAlert("Usuario atualizado com sucesso!");
      } else {
        const payload: UsuarioCreate = {
          nomeCompleto: formData.nomeCompleto,
          email: formData.email,
          senha: (formData as UsuarioFormCreateData).senha,
          idPerfil: formData.idPerfil,
          status: formData.status,
        };

        const response = await criarUsuario(payload);

        if (!response.success) {
          throw new Error(response.message || "Nao foi possivel criar o usuario.");
        }

        // O backend pode definir status padrao, entao evitamos enviar aqui.
        showAlert("Usuario criado com sucesso!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error?.message || "Erro ao salvar usuario.";
      showAlert(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Editar usuario" : "Novo usuario"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? "Atualize os dados do usuario selecionado."
              : "Preencha os dados para criar um novo usuario no sistema."}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
          <div>
            <label
              htmlFor="usuario-nome"
              className="block text-sm font-medium text-gray-700"
            >
              Nome completo
            </label>
            <input
              id="usuario-nome"
              type="text"
              autoComplete="name"
              {...register("nomeCompleto")}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.nomeCompleto && (
              <p className="mt-1 text-sm text-red-600">{errors.nomeCompleto.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="usuario-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="usuario-email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="usuario-senha"
              className="block text-sm font-medium text-gray-700"
            >
              {isEdit ? "Nova senha (opcional)" : "Senha"}
            </label>
            <input
              id="usuario-senha"
              type="password"
              autoComplete="new-password"
              {...register("senha")}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {"senha" in errors && errors.senha && (
              <p className="mt-1 text-sm text-red-600">{errors.senha.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="usuario-perfil"
              className="block text-sm font-medium text-gray-700"
            >
              Perfil
            </label>
            <select
              id="usuario-perfil"
              {...register("idPerfil", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={0}>Selecione um perfil</option>
              {(perfis || []).map(perfil => (
                <option key={perfil.idPerfil} value={perfil.idPerfil}>
                  {perfil.nomePerfil}
                </option>
              ))}
            </select>
            {errors.idPerfil && (
              <p className="mt-1 text-sm text-red-600">{errors.idPerfil.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="usuario-status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="usuario-status"
              {...register("status")}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


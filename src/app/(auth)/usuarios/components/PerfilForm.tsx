"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAlert } from "@/contexts/AlertContext";
import {
  criarPerfil,
  atualizarPerfil,
} from "@/lib/perfis/api";
import type { Perfil, PerfilCreate, PerfilUpdate } from "@/types/perfil";

const perfilSchema = z.object({
  nomePerfil: z.string().min(1, "Informe o nome do perfil"),
  descricao: z
    .string()
    .transform(value => value.trim())
    .pipe(z.string().max(255, "A descricao deve ter no maximo 255 caracteres").or(z.literal("")))
    .optional(),
  nivelAcesso: z.coerce.number().min(1, "O nivel minimo e 1").max(10, "O nivel maximo e 10"),
  ativo: z.coerce.boolean(),
});

type PerfilFormData = z.infer<typeof perfilSchema>;

interface PerfilFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  perfil?: Perfil | null;
}

export function PerfilForm({ open, onClose, onSuccess, perfil }: PerfilFormProps) {
  const { showAlert } = useAlert();
  const isEdit = Boolean(perfil);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nomePerfil: "",
      descricao: "",
      nivelAcesso: 1,
      ativo: true,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (perfil) {
      reset({
        nomePerfil: perfil.nomePerfil,
        descricao: perfil.descricao ?? "",
        nivelAcesso: perfil.nivelAcesso,
        ativo: perfil.ativo !== false,
      });
    } else {
      reset({
        nomePerfil: "",
        descricao: "",
        nivelAcesso: 1,
        ativo: true,
      });
    }
  }, [open, perfil, reset]);

  if (!open) {
    return null;
  }

  const onSubmit = async (formData: PerfilFormData) => {
    try {
      if (isEdit && perfil) {
        const payload: PerfilUpdate = {
          nomePerfil: formData.nomePerfil,
          descricao: formData.descricao?.trim() || undefined,
          nivelAcesso: formData.nivelAcesso,
          ativo: formData.ativo,
        };

        const response = await atualizarPerfil(perfil.idPerfil, payload);

        if (!response.success) {
          throw new Error(response.message || "Nao foi possivel atualizar o perfil.");
        }

        showAlert("Perfil atualizado com sucesso!");
      } else {
        const payload: PerfilCreate = {
          nomePerfil: formData.nomePerfil,
          descricao: formData.descricao?.trim() || undefined,
          nivelAcesso: formData.nivelAcesso,
          permissoes: [],
        };

        const response = await criarPerfil(payload);

        if (!response.success) {
          throw new Error(response.message || "Nao foi possivel criar o perfil.");
        }

        showAlert("Perfil criado com sucesso!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error?.message || "Erro ao salvar perfil.";
      showAlert(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Editar perfil" : "Novo perfil"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? "Atualize as informacoes do papel selecionado."
              : "Cadastre um novo papel com o nivel de acesso adequado."}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
          <div>
            <label htmlFor="perfil-nome" className="block text-sm font-medium text-gray-700">
              Nome do perfil
            </label>
            <input
              id="perfil-nome"
              type="text"
              {...register("nomePerfil")}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.nomePerfil && (
              <p className="mt-1 text-sm text-red-600">{errors.nomePerfil.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="perfil-descricao"
              className="block text-sm font-medium text-gray-700"
            >
              Descricao
            </label>
            <textarea
              id="perfil-descricao"
              rows={3}
              {...register("descricao")}
              className="mt-1 block w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.descricao && (
              <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Uma breve descricao ajuda a equipe a entender o objetivo deste papel.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="perfil-nivel"
                className="block text-sm font-medium text-gray-700"
              >
                Nivel de acesso
              </label>
              <select
                id="perfil-nivel"
                {...register("nivelAcesso", { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {errors.nivelAcesso && (
                <p className="mt-1 text-sm text-red-600">{errors.nivelAcesso.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="perfil-status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="perfil-status"
                {...register("ativo")}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
              {errors.ativo && (
                <p className="mt-1 text-sm text-red-600">{errors.ativo.message as string}</p>
              )}
            </div>
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


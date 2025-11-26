"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { empresaCreateSchema, empresaUpdateSchema, formatCNPJ, formatCEP } from "@/lib/empresas/validations";
import { criarEmpresa, atualizarEmpresa } from "@/lib/empresas/api";
import type { Empresa, EmpresaCreate, EmpresaUpdate } from "@/types/empresa";
import { useState } from "react";

interface EmpresaFormProps {
  empresa: Empresa | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmpresaForm({ empresa, onClose, onSuccess }: EmpresaFormProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!empresa;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? empresaUpdateSchema : empresaCreateSchema),
    defaultValues: empresa || {},
  });

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      if (isEdit) {
        await atualizarEmpresa(empresa!.idCliente, data as EmpresaUpdate);
        alert("Empresa atualizada com sucesso!");
      } else {
        await criarEmpresa(data as EmpresaCreate);
        alert("Empresa criada com sucesso!");
      }

      onSuccess();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? "Editar Empresa" : "Nova Empresa"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Dados Principais */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Principais</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    {...register("razaoSocial")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.razaoSocial && (
                    <p className="mt-1 text-sm text-red-600">{errors.razaoSocial.message as string}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    {...register("nomeFantasia")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    {...register("cnpj")}
                    placeholder="00.000.000/0000-00"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.cnpj && (
                    <p className="mt-1 text-sm text-red-600">{errors.cnpj.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    {...register("inscricaoEstadual")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contato</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="text"
                    {...register("telefone")}
                    placeholder="(00) 0000-0000"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Comercial
                  </label>
                  <input
                    type="email"
                    {...register("emailComercial")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.emailComercial && (
                    <p className="mt-1 text-sm text-red-600">{errors.emailComercial.message as string}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Site
                  </label>
                  <input
                    type="url"
                    {...register("site")}
                    placeholder="https://www.exemplo.com.br"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Endereço
                  </label>
                  <input
                    type="text"
                    {...register("endereco")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número
                  </label>
                  <input
                    type="text"
                    {...register("numero")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Complemento
                  </label>
                  <input
                    type="text"
                    {...register("complemento")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bairro
                  </label>
                  <input
                    type="text"
                    {...register("bairro")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cidade
                  </label>
                  <input
                    type="text"
                    {...register("cidade")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    {...register("estado")}
                    maxLength={2}
                    placeholder="SP"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CEP
                  </label>
                  <input
                    type="text"
                    {...register("cep")}
                    placeholder="00000-000"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                {...register("observacoes")}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Status (apenas em edição) */}
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : isEdit ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

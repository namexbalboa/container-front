"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import type { ClienteContainerSeguro, ClienteContainerSeguroUpdate } from "@/types/api";
import { X } from "lucide-react";

const formSchema = z.object({
  taxaSeguro: z.string().min(1, "Taxa de seguro é obrigatória"),
  valorContainerDecimal: z.string().min(1, "Valor do container é obrigatório"),
  vigenciaInicio: z.string().min(1, "Data de início é obrigatória"),
  vigenciaFim: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditParametroDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parametro: ClienteContainerSeguro;
  onSuccess: () => void;
}

export default function EditParametroDialog({
  isOpen,
  onClose,
  parametro,
  onSuccess,
}: EditParametroDialogProps) {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taxaSeguro: (parametro.taxaSeguro * 100).toString(),
      valorContainerDecimal: parametro.valorContainerDecimal.toString(),
      vigenciaInicio: parametro.vigenciaInicio.split("T")[0],
      vigenciaFim: parametro.vigenciaFim ? parametro.vigenciaFim.split("T")[0] : "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        taxaSeguro: (parametro.taxaSeguro * 100).toString(),
        valorContainerDecimal: parametro.valorContainerDecimal.toString(),
        vigenciaInicio: parametro.vigenciaInicio.split("T")[0],
        vigenciaFim: parametro.vigenciaFim ? parametro.vigenciaFim.split("T")[0] : "",
      });
    }
  }, [isOpen, parametro, reset]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const updateData: ClienteContainerSeguroUpdate = {
        taxaSeguro: parseFloat(data.taxaSeguro) / 100, // Converter de percentual para decimal
        valorContainerDecimal: parseFloat(data.valorContainerDecimal),
        vigenciaInicio: data.vigenciaInicio,
        vigenciaFim: data.vigenciaFim || null,
      };

      const response = await apiService.updateParametroSeguro(
        parametro.idCliente,
        parametro.idTipoContainer,
        updateData
      );

      if (!response.success) {
        throw new Error(response.message || "Erro ao atualizar parâmetro");
      }

      showAlert("Parâmetro atualizado com sucesso! Nova versão criada.");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao atualizar parâmetro:", error);
      showAlert(error.message || "Erro ao atualizar parâmetro");
    } finally {
      setLoading(false);
    }
  };

  // Watch form values for real-time calculation
  const taxaSeguroValue = watch("taxaSeguro");
  const valorContainerValue = watch("valorContainerDecimal");

  // Calcular o prêmio do seguro baseado nos valores atuais do form
  const calcularPremioSeguro = () => {
    const taxaSeguro = parseFloat(taxaSeguroValue || "0");
    const valorContainer = parseFloat(valorContainerValue || "0");
    return (valorContainer * (taxaSeguro / 100));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Editar Parâmetro de Seguro
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              {parametro.tipoContainer?.tipoContainer} - Versão atual: {parametro.versao}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Alerta sobre versionamento */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1 text-sm text-blue-800">
                <p className="font-medium mb-1">Versionamento Automático</p>
                <p>
                  Ao salvar, uma nova versão (v{parametro.versao + 1}) será criada automaticamente.
                  A versão anterior será mantida no histórico para referência futura.
                </p>
              </div>
            </div>
          </div>

          {/* Prêmio do Seguro */}
          <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">
                  Prêmio do Seguro
                </p>
                <p className="text-xs text-green-700">
                  Valor cobrado sobre o container ({parseFloat(taxaSeguroValue || "0").toFixed(4)}% de {formatCurrency(parseFloat(valorContainerValue || "0"))})
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(calcularPremioSeguro())}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Taxa de Seguro */}
            <div>
              <label
                htmlFor="taxaSeguro"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Taxa de Seguro (%) <span className="text-red-500">*</span>
              </label>
              <input
                id="taxaSeguro"
                type="number"
                step="0.0001"
                {...register("taxaSeguro")}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ex: 0.5"
              />
              {errors.taxaSeguro && (
                <p className="mt-1 text-sm text-red-600">{errors.taxaSeguro.message}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Percentual aplicado sobre o valor do container
              </p>
            </div>

            {/* Valor Container */}
            <div>
              <label
                htmlFor="valorContainerDecimal"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Valor Padrão do Container (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="valorContainerDecimal"
                type="number"
                step="0.01"
                {...register("valorContainerDecimal")}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ex: 50000.00"
              />
              {errors.valorContainerDecimal && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.valorContainerDecimal.message}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Valor usado quando não informado na viagem
              </p>
            </div>

            {/* Vigência Início */}
            <div>
              <label
                htmlFor="vigenciaInicio"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Data de Início da Vigência <span className="text-red-500">*</span>
              </label>
              <input
                id="vigenciaInicio"
                type="date"
                {...register("vigenciaInicio")}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.vigenciaInicio && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.vigenciaInicio.message}
                </p>
              )}
            </div>

            {/* Vigência Fim */}
            <div>
              <label
                htmlFor="vigenciaFim"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Data de Fim da Vigência (Opcional)
              </label>
              <input
                id="vigenciaFim"
                type="date"
                {...register("vigenciaFim")}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.vigenciaFim && (
                <p className="mt-1 text-sm text-red-600">{errors.vigenciaFim.message}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Deixe em branco para vigência indefinida
              </p>
            </div>
          </div>

          {/* Exemplo de Cálculo */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-900 mb-2">Exemplo de Cálculo:</p>
            <p className="text-sm text-zinc-700">
              Com taxa de{" "}
              <span className="font-semibold">
                {parseFloat(register("taxaSeguro").name) || 0}%
              </span>{" "}
              sobre um container de{" "}
              <span className="font-semibold">
                R$ {parseFloat(register("valorContainerDecimal").name) || 0}
              </span>
              , o valor do seguro seria aproximadamente{" "}
              <span className="font-semibold text-blue-600">
                R${" "}
                {(
                  (parseFloat(register("valorContainerDecimal").name) || 0) *
                  ((parseFloat(register("taxaSeguro").name) || 0) / 100)
                ).toFixed(2)}
              </span>
            </p>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

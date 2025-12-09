"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import type {
  Averbacao,
  AverbacaoCreate,
  AverbacaoUpdate,
  Cliente,
  Seguradora,
} from "@/types/api";

const formSchema = z
  .object({
    clienteId: z.string().min(1, "Selecione a empresa responsável."),
    seguradoraId: z.string().optional(),
    periodoInicio: z.string().min(1, "Informe a data de início."),
    periodoFim: z.string().min(1, "Informe a data de fim."),
    numero: z.string().optional(),
    observacoes: z.string().optional(),
    containerTripIds: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.periodoInicio || !data.periodoFim) return true;
      const inicio = new Date(data.periodoInicio);
      const fim = new Date(data.periodoFim);
      return fim >= inicio;
    },
    {
      path: ["periodoFim"],
      message: "A data final deve ser posterior ou igual à data inicial.",
    },
  );

type FormValues = z.infer<typeof formSchema>;

type AverbacaoFormProps = {
  mode: "create" | "edit";
  initialData?: Averbacao;
  onSubmit: (payload: AverbacaoCreate | AverbacaoUpdate) => Promise<Averbacao | void>;
};

const toInputDate = (value?: string | null) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  return value;
};

const toContainerList = (averbacao?: Averbacao) => {
  if (averbacao?.containers?.length) {
    return averbacao.containers
      .map((item) => ('containerId' in item && item.containerId !== undefined ? String(item.containerId) : ""))
      .filter(Boolean)
      .join("\n");
  }

  if (averbacao?.containerTrips?.length) {
    return averbacao.containerTrips
      .map((item) => (item.containerId !== undefined ? String(item.containerId) : ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

export function AverbacaoForm({ mode, initialData, onSubmit }: AverbacaoFormProps) {
  const isEdit = mode === "edit";
  const { showAlert } = useAlert();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultValues = useMemo<FormValues>(
    () => ({
      clienteId: initialData?.clienteId ? String(initialData.clienteId) : "",
      seguradoraId: initialData?.seguradoraId ? String(initialData.seguradoraId) : "",
      periodoInicio:
        toInputDate(initialData?.periodoInicio ?? initialData?.dataAverbacao) ?? "",
      periodoFim: toInputDate(initialData?.periodoFim ?? initialData?.dataAprovacao) ?? "",
      numero: initialData?.numero ?? "",
      observacoes: initialData?.observacoes ?? "",
      containerTripIds: toContainerList(initialData),
    }),
    [initialData],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    const loadCombos = async () => {
      setLoadingCombos(true);
      try {
        const [clientesResponse, seguradorasResponse] = await Promise.all([
          apiService.getClientes({ page: 1, limit: 100 }),
          apiService.getSeguradoras({ page: 1, limit: 100 }),
        ]);

        if (clientesResponse.success && clientesResponse.data) {
          setClientes(clientesResponse.data.items);
        }
        if (seguradorasResponse.success && seguradorasResponse.data) {
          setSeguradoras(seguradorasResponse.data.items);
        }
      } catch (error) {
        console.error("Erro ao carregar dados auxiliares da averbação:", error);
        showAlert("Erro ao carregar empresas e seguradoras.");
      } finally {
        setLoadingCombos(false);
      }
    };

    loadCombos();
  }, [showAlert]);

  const periodoInicio = watch("periodoInicio");
  const periodoFim = watch("periodoFim");

  const parseContainerIds = (value?: string) => {
    if (!value) return undefined;
    const ids = value
      .split(/[\n,;]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => Number(token))
      .filter((id) => Number.isFinite(id) && id > 0);

    return ids.length > 0 ? ids : undefined;
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const basePayload = {
        periodoInicio: values.periodoInicio,
        periodoFim: values.periodoFim,
        observacoes: values.observacoes?.trim() || undefined,
        numero: values.numero?.trim() || undefined,
        seguradoraId: values.seguradoraId ? Number(values.seguradoraId) : undefined,
        containerTripIds: parseContainerIds(values.containerTripIds),
      };

      if (mode === "create") {
        const payload: AverbacaoCreate = {
          clienteId: Number(values.clienteId),
          periodoInicio: basePayload.periodoInicio!,
          periodoFim: basePayload.periodoFim!,
          observacoes: basePayload.observacoes,
          numero: basePayload.numero,
          seguradoraId: basePayload.seguradoraId,
          containerTripIds: basePayload.containerTripIds,
        };

        await onSubmit(payload);
      } else {
        const payload: AverbacaoUpdate = {
          periodoInicio: basePayload.periodoInicio,
          periodoFim: basePayload.periodoFim,
          observacoes: basePayload.observacoes,
          numero: basePayload.numero,
          seguradoraId: basePayload.seguradoraId,
          containerTripIds: basePayload.containerTripIds,
        };
        await onSubmit(payload);
      }
    } catch (error) {
      console.error("Erro ao enviar averbação:", error);
      showAlert(
        "error",
        mode === "create"
          ? "Não foi possível criar a averbação."
          : "Não foi possível atualizar a averbação.",
      );
    } finally {
      setSubmitting(false);
    }
  });

  const periodoResumo =
    periodoInicio && periodoFim
      ? `Período selecionado: ${new Date(periodoInicio).toLocaleDateString("pt-BR")} até ${new Date(
          periodoFim,
        ).toLocaleDateString("pt-BR")}`
      : "Selecione o período para consolidar os containers.";

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="clienteId" className="text-sm font-medium text-zinc-700">
            Empresa *
          </label>
          <select
            id="clienteId"
            disabled={isEdit}
            {...register("clienteId")}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-zinc-100"
          >
            <option value="">Selecione a empresa</option>
            {clientes.map((cliente) => (
              <option key={cliente.idCliente} value={cliente.idCliente}>
                {cliente.razaoSocial}
              </option>
            ))}
          </select>
          {errors.clienteId && (
            <p className="text-sm text-rose-600">{errors.clienteId.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="seguradoraId" className="text-sm font-medium text-zinc-700">
            Seguradora
          </label>
          <select
            id="seguradoraId"
            {...register("seguradoraId")}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Selecione a seguradora (opcional)</option>
            {seguradoras.map((seguradora) => (
              <option key={seguradora.idSeguradora} value={seguradora.idSeguradora}>
                {seguradora.nomeSeguradora}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="periodoInicio" className="text-sm font-medium text-zinc-700">
            Data inicial *
          </label>
          <input
            id="periodoInicio"
            type="date"
            {...register("periodoInicio")}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          {errors.periodoInicio && (
            <p className="text-sm text-rose-600">{errors.periodoInicio.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="periodoFim" className="text-sm font-medium text-zinc-700">
            Data final *
          </label>
          <input
            id="periodoFim"
            type="date"
            {...register("periodoFim")}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          {errors.periodoFim && (
            <p className="text-sm text-rose-600">{errors.periodoFim.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="numero" className="text-sm font-medium text-zinc-700">
            Número da averbação
          </label>
          <input
            id="numero"
            type="text"
            placeholder="Opcional: informe um identificador interno"
            {...register("numero")}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="containerTripIds" className="text-sm font-medium text-zinc-700">
            IDs de viagens/container (opcional)
          </label>
          <textarea
            id="containerTripIds"
            rows={4}
            placeholder="Informe um ID por linha ou separados por vírgula para limitar os containers incluídos."
            {...register("containerTripIds")}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <p className="text-xs text-zinc-500">
            Deixe em branco para incluir todas as viagens da empresa no período selecionado.
          </p>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label htmlFor="observacoes" className="text-sm font-medium text-zinc-700">
            Observações
          </label>
          <textarea
            id="observacoes"
            rows={4}
            {...register("observacoes")}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
      </div>

      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {periodoResumo}
      </div>

      <div className="flex items-center justify-end gap-3">
        <LinkBackButton />
        <button
          type="submit"
          disabled={submitting || loadingCombos}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar averbação"}
        </button>
      </div>
    </form>
  );
}

function LinkBackButton() {
  if (typeof window === "undefined") return null;
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1"
    >
      Cancelar
    </button>
  );
}


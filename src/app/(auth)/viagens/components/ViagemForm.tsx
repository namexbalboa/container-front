"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ContainerTrip,
  ContainerTripUpdate,
  StatusViagem,
  Modal,
  OrigemDados,
} from "@/types/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ContainersSection } from "./ContainersSection";

const viagemSchema = z.object({
  numeroCE: z.string().optional(),
  numeroCEMaster: z.string().optional(),
  numeroConhecimento: z.string().optional(),
  nomeNavio: z.string().optional(),
  numeroViagem: z.string().optional(),
  navioImo: z.string().optional(),
  armador: z.string().optional(),
  booking: z.string().optional(),
  statusViagem: z.enum([
    "planejada",
    "em_transito",
    "chegada",
    "descarregado",
    "finalizada",
    "cancelada",
  ], {
    required_error: "Status da viagem é obrigatório",
    invalid_type_error: "Selecione um status válido",
  }),
  modal: z.enum(["M", "T", "A"], {
    required_error: "Modal de transporte é obrigatório",
    invalid_type_error: "Selecione um modal válido",
  }),
  origemDados: z.enum(["SISCOMEX", "MANUAL", "API"]).optional(),
  dataEmbarque: z.string().min(1, "Informe a data de embarque"),
  dataChegadaPrevista: z.string().optional(),
  dataChegada: z.string().optional(),
  dataDescarregamento: z.string().optional(),
  descricaoMercadoria: z.string().optional(),
  mercadoria: z.string().optional(),
  modalidadeFrete: z.string().optional(),
  tipoPagamentoFrete: z.string().optional(),
  valorFrete: z.string().optional(),
  moedaFrete: z.string().optional(),
  pesoBrutoKg: z.string().optional(),
  quantidadeVolumes: z.string().optional(),
  freeTime: z.string().optional(),
  observacoes: z.string().optional(),
  houveTransbordo: z.boolean().default(false),
});

type ViagemFormValues = z.infer<typeof viagemSchema>;

interface ViagemFormProps {
  viagem: ContainerTrip;
  onSubmit: (data: ContainerTripUpdate) => Promise<void>;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: StatusViagem; label: string }[] = [
  { value: "planejada", label: "Planejada" },
  { value: "em_transito", label: "Em trânsito" },
  { value: "chegada", label: "Chegada" },
  { value: "descarregado", label: "Descarregado" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
];

const MODAL_OPTIONS: { value: Modal; label: string }[] = [
  { value: "M", label: "Marítimo" },
  { value: "T", label: "Terrestre" },
  { value: "A", label: "Aéreo" },
];

const ORIGEM_OPTIONS: { value: OrigemDados; label: string }[] = [
  { value: "SISCOMEX", label: "SISCOMEX" },
  { value: "MANUAL", label: "Manual" },
  { value: "API", label: "API" },
];

const normalizeDateInput = (value?: string | null) => {
  if (!value) return "";
  return value.split("T")[0] ?? "";
};

const parseNumber = (value?: string) => {
  if (!value || value.trim() === "") return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? undefined : parsed;
};

const mapText = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export function ViagemForm({ viagem, onSubmit, onCancel }: ViagemFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [containers, setContainers] = useState<string[]>([]);

  const defaultValues = useMemo<ViagemFormValues>(
    () => ({
      numeroCE: viagem.numeroCE ?? "",
      numeroCEMaster: viagem.numeroCEMaster ?? "",
      numeroConhecimento: viagem.numeroConhecimento ?? "",
      nomeNavio: viagem.nomeNavio ?? "",
      numeroViagem: viagem.numeroViagem ?? "",
      navioImo: viagem.navioImo ?? "",
      armador: viagem.armador ?? "",
      booking: viagem.booking ?? "",
      statusViagem: viagem.statusViagem,
      modal: viagem.modal,
      origemDados: viagem.origemDados,
      dataEmbarque: normalizeDateInput(viagem.dataEmbarque),
      dataChegadaPrevista: normalizeDateInput(viagem.dataChegadaPrevista),
      dataChegada: normalizeDateInput(viagem.dataChegada),
      dataDescarregamento: normalizeDateInput(viagem.dataDescarregamento),
      descricaoMercadoria: viagem.descricaoMercadoria ?? "",
      mercadoria: viagem.mercadoria ?? "",
      modalidadeFrete: viagem.modalidadeFrete ?? "",
      tipoPagamentoFrete: viagem.tipoPagamentoFrete ?? "",
      valorFrete: viagem.valorFrete !== null && viagem.valorFrete !== undefined ? String(viagem.valorFrete) : "",
      moedaFrete: viagem.moedaFrete ?? "",
      pesoBrutoKg: viagem.pesoBrutoKg !== null && viagem.pesoBrutoKg !== undefined ? String(viagem.pesoBrutoKg) : "",
      quantidadeVolumes:
        viagem.quantidadeVolumes !== null && viagem.quantidadeVolumes !== undefined
          ? String(viagem.quantidadeVolumes)
          : "",
      freeTime: viagem.freeTime !== null && viagem.freeTime !== undefined ? String(viagem.freeTime) : "",
      observacoes: viagem.observacoes ?? "",
      houveTransbordo: viagem.houveTransbordo ?? false,
    }),
    [viagem]
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ViagemFormValues>({
    resolver: zodResolver(viagemSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleFormSubmit = async (values: ViagemFormValues) => {
    setSubmitError(null);

    // Validação adicional antes de enviar
    if (!values.modal) {
      setSubmitError("Modal de transporte é obrigatório");
      return;
    }

    if (!values.statusViagem) {
      setSubmitError("Status da viagem é obrigatório");
      return;
    }

    const payload: ContainerTripUpdate & { numerosContainer?: string[] } = {
      numeroCE: mapText(values.numeroCE),
      numeroCEMaster: mapText(values.numeroCEMaster),
      numeroConhecimento: mapText(values.numeroConhecimento),
      nomeNavio: mapText(values.nomeNavio),
      numeroViagem: mapText(values.numeroViagem),
      navioImo: mapText(values.navioImo),
      armador: mapText(values.armador),
      booking: mapText(values.booking),
      statusViagem: values.statusViagem,
      modal: values.modal,
      origemDados: values.origemDados,
      dataEmbarque: values.dataEmbarque,
      dataChegadaPrevista: mapText(values.dataChegadaPrevista),
      dataChegada: mapText(values.dataChegada),
      dataDescarregamento: mapText(values.dataDescarregamento),
      descricaoMercadoria: mapText(values.descricaoMercadoria),
      mercadoria: mapText(values.mercadoria),
      modalidadeFrete: mapText(values.modalidadeFrete),
      tipoPagamentoFrete: mapText(values.tipoPagamentoFrete),
      valorFrete: parseNumber(values.valorFrete),
      moedaFrete: mapText(values.moedaFrete),
      pesoBrutoKg: parseNumber(values.pesoBrutoKg),
      quantidadeVolumes: parseNumber(values.quantidadeVolumes),
      freeTime: parseNumber(values.freeTime),
      observacoes: mapText(values.observacoes),
      houveTransbordo: values.houveTransbordo,
      numerosContainer: containers.length > 0 ? containers : undefined,
    };

    Object.keys(payload).forEach((key) => {
      const typedKey = key as keyof ContainerTripUpdate;
      const value = payload[typedKey];

      if (value === undefined || value === null) {
        delete payload[typedKey];
      }
    });

    try {
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar as alterações da viagem.";
      setSubmitError(message);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Identificação</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Número CE</label>
              <input
                type="text"
                {...register("numeroCE")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CE Master</label>
              <input
                type="text"
                {...register("numeroCEMaster")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Conhecimento (BL)</label>
              <input
                type="text"
                {...register("numeroConhecimento")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Modal <span className="text-red-500">*</span>
              </label>
              <Controller
                name="modal"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.modal ? "border-red-500 focus:ring-red-500" : ""}>
                      <SelectValue placeholder="Selecione o modal de transporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.modal && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.modal.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <Controller
                name="statusViagem"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.statusViagem ? "border-red-500 focus:ring-red-500" : ""}>
                      <SelectValue placeholder="Selecione o status da viagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.statusViagem && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.statusViagem.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Origem dos dados</label>
              <Controller
                name="origemDados"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(value) => field.onChange(value || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIGEM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Embarcação</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome do Navio</label>
              <input
                type="text"
                {...register("nomeNavio")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Número da Viagem</label>
              <input
                type="text"
                {...register("numeroViagem")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">IMO do Navio</label>
              <input
                type="text"
                {...register("navioImo")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Armador</label>
              <input
                type="text"
                {...register("armador")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Booking</label>
              <input
                type="text"
                {...register("booking")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Cronograma</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Data de Embarque <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("dataEmbarque")}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                  errors.dataEmbarque
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
              {errors.dataEmbarque && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.dataEmbarque.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Data prevista de chegada</label>
              <input
                type="date"
                {...register("dataChegadaPrevista")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Data de chegada</label>
              <input
                type="date"
                {...register("dataChegada")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Data de descarregamento</label>
              <input
                type="date"
                {...register("dataDescarregamento")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <Controller
                name="houveTransbordo"
                control={control}
                render={({ field }) => (
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Houve transbordo
                  </label>
                )}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Carga &amp; Frete</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Descrição da mercadoria</label>
              <input
                type="text"
                {...register("descricaoMercadoria")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mercadoria</label>
              <input
                type="text"
                {...register("mercadoria")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quantidade de volumes</label>
              <input
                type="number"
                step="1"
                {...register("quantidadeVolumes")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Peso bruto (kg)</label>
              <input
                type="number"
                step="0.01"
                {...register("pesoBrutoKg")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Valor do frete</label>
              <input
                type="number"
                step="0.01"
                {...register("valorFrete")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Moeda do frete</label>
              <input
                type="text"
                {...register("moedaFrete")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Modalidade do frete</label>
              <input
                type="text"
                {...register("modalidadeFrete")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de pagamento</label>
              <input
                type="text"
                {...register("tipoPagamentoFrete")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Free time (dias)</label>
              <input
                type="number"
                step="1"
                {...register("freeTime")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-gray-700">Observações</label>
        <textarea
          rows={4}
          {...register("observacoes")}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <ContainersSection
          numeroCE={viagem.numeroCE ?? undefined}
          value={containers}
          onChange={setContainers}
          disabled={isSubmitting}
        />
      </section>

      {submitError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

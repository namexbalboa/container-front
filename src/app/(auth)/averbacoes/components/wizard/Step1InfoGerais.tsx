"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import type { Cliente, Seguradora } from "@/types/api";

interface Step1InfoGeraisProps {
  data: {
    clienteId: number | null;
    seguradoraId: number | null;
    periodoInicio: string;
    periodoFim: string;
    numero?: string;
    observacoes?: string;
  };
  onUpdate: (data: any) => void;
}

export function Step1InfoGerais({ data, onUpdate }: Step1InfoGeraisProps) {
  const { data: session } = useSession();
  const { showAlert } = useAlert();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;

    const loadCombos = async () => {
      setIsLoading(true);
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
        console.error("Erro ao carregar dados:", error);
        showAlert("error", "Erro ao carregar empresas e seguradoras.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCombos();
  }, [session?.accessToken, showAlert]);

  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  const validateDates = () => {
    if (data.periodoInicio && data.periodoFim) {
      const inicio = new Date(data.periodoInicio);
      const fim = new Date(data.periodoFim);
      if (fim < inicio) {
        showAlert("warning", "A data final deve ser posterior ou igual à data inicial.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">Informações Gerais</h3>
        <p className="text-sm text-zinc-600">
          Defina a empresa, seguradora e período da averbação.
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-zinc-500">Carregando dados...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="clienteId" className="text-sm font-medium text-zinc-700">
              Empresa <span className="text-rose-500">*</span>
            </label>
            <select
              id="clienteId"
              value={data.clienteId || ""}
              onChange={(e) => handleChange("clienteId", e.target.value ? Number(e.target.value) : null)}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Selecione a empresa</option>
              {clientes.map((cliente) => (
                <option key={cliente.idCliente} value={cliente.idCliente}>
                  {cliente.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="seguradoraId" className="text-sm font-medium text-zinc-700">
              Seguradora <span className="text-rose-500">*</span>
            </label>
            <select
              id="seguradoraId"
              value={data.seguradoraId || ""}
              onChange={(e) => handleChange("seguradoraId", e.target.value ? Number(e.target.value) : null)}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Selecione a seguradora</option>
              {seguradoras.map((seguradora) => (
                <option key={seguradora.idSeguradora} value={seguradora.idSeguradora}>
                  {seguradora.nomeSeguradora}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="periodoInicio" className="text-sm font-medium text-zinc-700">
              Data Inicial <span className="text-rose-500">*</span>
            </label>
            <input
              id="periodoInicio"
              type="date"
              value={data.periodoInicio}
              onChange={(e) => handleChange("periodoInicio", e.target.value)}
              onBlur={validateDates}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="periodoFim" className="text-sm font-medium text-zinc-700">
              Data Final <span className="text-rose-500">*</span>
            </label>
            <input
              id="periodoFim"
              type="date"
              value={data.periodoFim}
              onChange={(e) => handleChange("periodoFim", e.target.value)}
              onBlur={validateDates}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="numero" className="text-sm font-medium text-zinc-700">
              Número da Averbação
            </label>
            <input
              id="numero"
              type="text"
              value={data.numero || ""}
              onChange={(e) => handleChange("numero", e.target.value)}
              placeholder="Ex: AVB-2025-001"
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <p className="text-xs text-zinc-500">Opcional: um identificador para esta averbação</p>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label htmlFor="observacoes" className="text-sm font-medium text-zinc-700">
              Observações
            </label>
            <textarea
              id="observacoes"
              value={data.observacoes || ""}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              rows={4}
              placeholder="Informações adicionais sobre esta averbação..."
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>
      )}

      {data.clienteId && data.periodoInicio && data.periodoFim && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-sm text-emerald-700">
            <strong>Período selecionado:</strong>{" "}
            {new Date(data.periodoInicio).toLocaleDateString("pt-BR")} até{" "}
            {new Date(data.periodoFim).toLocaleDateString("pt-BR")}
          </p>
        </div>
      )}
    </div>
  );
}

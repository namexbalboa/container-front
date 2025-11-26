"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiService } from "@/lib/api";
import { ParametroSeguro } from "@/types/parametro-seguro";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";

const MODAL_MAP = {
  T: "Terrestre",
  M: "Marítimo",
  A: "Aéreo",
};

export default function ParametrosPage() {
  const router = useRouter();
  const [parametros, setParametros] = useState<ParametroSeguro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    loadParametros();
  }, [filterAtivo]);

  const loadParametros = async () => {
    try {
      setLoading(true);
      const response = await apiService.getParametrosSeguro({
        ativo: filterAtivo,
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        // A resposta vem diretamente em data (array), não em data.data
        const parametrosArray = Array.isArray(response.data)
          ? response.data
          : (response.data.data || []);
        setParametros(parametrosArray);
      }
    } catch (error) {
      console.error("Erro ao carregar parâmetros:", error);
      setParametros([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (parametro: ParametroSeguro) => {
    const novoStatus = !parametro.ativo;

    try {
      const response = await apiService.updateParametroSeguro(parametro.idParametro, {
        ativo: novoStatus,
      });

      if (response.success) {
        toast.success(
          `Parâmetro "${parametro.nome}" ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`,
          {
            duration: 3000,
          }
        );
        loadParametros();
      } else {
        throw new Error(response.message || "Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error(
        `Erro ao ${novoStatus ? 'ativar' : 'desativar'} o parâmetro. Tente novamente.`,
        {
          duration: 4000,
        }
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja desativar este parâmetro?")) return;

    try {
      await apiService.deleteParametroSeguro(id);
      loadParametros();
    } catch (error) {
      console.error("Erro ao deletar parâmetro:", error);
      alert("Erro ao deletar parâmetro");
    }
  };

  const filteredParametros = (parametros || []).filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Parâmetros de Seguro
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Gerencie taxas e configurações de cálculo de seguro
          </p>
        </div>
        <button
          onClick={() => router.push("/parametros/novo")}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Novo Parâmetro
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-zinc-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <select
              value={
                filterAtivo === undefined
                  ? "all"
                  : filterAtivo
                    ? "true"
                    : "false"
              }
              onChange={(e) =>
                setFilterAtivo(
                  e.target.value === "all"
                    ? undefined
                    : e.target.value === "true"
                )
              }
              className="w-full rounded-md border border-zinc-300 py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="all">Todos os status</option>
              <option value="true">Apenas ativos</option>
              <option value="false">Apenas inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-700">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-700">
                  Tipo Container
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-700">
                  Modal
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-700">
                  Taxa Seguro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-700">
                  Taxa Prêmio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-700">
                  IOF
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-700">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredParametros.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <p className="text-sm text-zinc-500">
                      Nenhum parâmetro encontrado
                    </p>
                  </td>
                </tr>
              ) : (
                filteredParametros.map((parametro) => (
                  <tr
                    key={parametro.idParametro}
                    className="transition hover:bg-zinc-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {parametro.nome}
                        </p>
                        {parametro.descricao && (
                          <p className="text-xs text-zinc-500">
                            {parametro.descricao}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700">
                      {parametro.tipoContainer?.tipoContainer ||
                        "Todos os tipos"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700">
                      {parametro.modalTransporte
                        ? MODAL_MAP[parametro.modalTransporte]
                        : "Todos"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-zinc-900">
                      {parametro.taxaSeguro}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-zinc-900">
                      {parametro.taxaPremio}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-zinc-700">
                      {parametro.taxaIof}%
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={parametro.ativo}
                            onChange={() => handleToggleStatus(parametro)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/parametros/${parametro.idParametro}/editar`
                            )
                          }
                          className="rounded-md p-1 text-zinc-600 transition hover:bg-zinc-100 hover:text-emerald-600"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(parametro.idParametro)
                          }
                          className="rounded-md p-1 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600"
                          title="Desativar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-600">Total</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {parametros?.length || 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-600">Ativos</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {parametros?.filter((p) => p.ativo).length || 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-600">Inativos</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {parametros?.filter((p) => !p.ativo).length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

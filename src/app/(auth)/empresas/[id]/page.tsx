"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import type { Cliente } from "@/types/api";
import { Building2, ArrowLeft, Settings, FileText } from "lucide-react";
import {
  ModernTabs,
  ModernTabsList,
  ModernTabsTrigger,
  ModernTabsContent
} from "@/components/ui/modern-tabs";
import ParametrosSeguroTab from "../components/ParametrosSeguroTab";

export default function EmpresaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [empresa, setEmpresa] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  const empresaId = Number(params?.id);

  useEffect(() => {
    const loadEmpresa = async () => {
      if (!empresaId || Number.isNaN(empresaId)) {
        showAlert("error", "ID da empresa inválido");
        router.push("/empresas");
        return;
      }

      setLoading(true);
      try {
        const response = await apiService.getCliente(empresaId);

        if (!response.success || !response.data) {
          throw new Error(response.message || "Empresa não encontrada");
        }

        setEmpresa(response.data);
      } catch (error: any) {
        console.error("Erro ao carregar empresa:", error);
        showAlert("error", error.message || "Erro ao carregar dados da empresa");
        router.push("/empresas");
      } finally {
        setLoading(false);
      }
    };

    loadEmpresa();
  }, [empresaId, router, showAlert]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-sm text-zinc-500">Carregando empresa...</div>
      </div>
    );
  }

  if (!empresa) {
    return null;
  }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/empresas"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {empresa.razaoSocial}
            </h1>
            <p className="mt-2 text-sm text-gray-600">CNPJ: {empresa.cnpj}</p>
          </div>
        </div>
      </div>

      <ModernTabs defaultValue="geral" className="space-y-6">
        <ModernTabsList>
          <ModernTabsTrigger
            value="geral"
            icon={<FileText className="h-4 w-4" />}
          >
            Dados Gerais
          </ModernTabsTrigger>
          <ModernTabsTrigger
            value="parametros"
            icon={<Settings className="h-4 w-4" />}
          >
            Parâmetros de Seguro
          </ModernTabsTrigger>
        </ModernTabsList>

        <ModernTabsContent value="geral" className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-zinc-900">Informações da Empresa</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Razão Social
                </label>
                <p className="text-sm text-zinc-900">{empresa.razaoSocial}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  CNPJ
                </label>
                <p className="text-sm text-zinc-900">{empresa.cnpj}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  E-mail
                </label>
                <p className="text-sm text-zinc-900">{empresa.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Telefone
                </label>
                <p className="text-sm text-zinc-900">{empresa.telefone || "—"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Endereço
                </label>
                <p className="text-sm text-zinc-900">{empresa.endereco || "—"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    empresa.status === "ATIVO"
                      ? "bg-green-100 text-green-800"
                      : empresa.status === "INATIVO"
                      ? "bg-zinc-200 text-zinc-600"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {empresa.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Link
                href={`/empresas/${empresa.idCliente}/editar`}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Editar Empresa
              </Link>
            </div>
          </div>
          </div>
        </ModernTabsContent>

        <ModernTabsContent value="parametros" className="space-y-6">
          <ParametrosSeguroTab
            idCliente={empresa.idCliente}
            razaoSocial={empresa.razaoSocial}
          />
        </ModernTabsContent>
      </ModernTabs>
    </div>
  );
}

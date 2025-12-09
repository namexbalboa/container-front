"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import type { Cliente } from "@/types/api";
import { ArrowLeft } from "lucide-react";
import { atualizarEmpresa } from "@/lib/empresas/api";
import type { ClienteUpdate } from "@/types/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { empresaUpdateSchema, formatCNPJ, formatCEP, formatTelefone, removeMask } from "@/lib/empresas/validations";
import { buscarCep } from "@/lib/cep";

export default function EditarEmpresaPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [empresa, setEmpresa] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);

    const empresaId = Number(params?.id);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm({
        resolver: zodResolver(empresaUpdateSchema),
    });

    const cepValue = watch("cep");

    useEffect(() => {
        const loadEmpresa = async () => {
            if (!empresaId || Number.isNaN(empresaId)) {
                showAlert("ID da empresa inválido", "error");
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
                reset(response.data);
            } catch (error: any) {
                console.error("Erro ao carregar empresa:", error);
                showAlert(error.message || "Erro ao carregar dados da empresa", "error");
                router.push("/empresas");
            } finally {
                setLoading(false);
            }
        };

        loadEmpresa();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaId]);

    useEffect(() => {
        const handleCepLookup = async () => {
            if (!cepValue) return;

            const cepLimpo = removeMask(cepValue);

            if (cepLimpo.length === 8) {
                setLoadingCep(true);
                try {
                    const resultado = await buscarCep(cepLimpo);

                    setValue("endereco", resultado.street || "");
                    setValue("bairro", resultado.neighborhood || "");
                    setValue("cidade", resultado.city || "");
                    setValue("estado", resultado.state || "");
                } catch (error) {
                    console.error("Erro ao buscar CEP:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                        ? (error as { message: string }).message
                        : 'Erro ao buscar CEP';
                    showAlert(errorMessage, "error");
                } finally {
                    setLoadingCep(false);
                }
            }
        };

        handleCepLookup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cepValue]);

    const onSubmit = async (data: any) => {
        try {
            setSubmitting(true);

            const cnpjLimpo = removeMask(data.cnpj);

            const apiData: ClienteUpdate = {
                razaoSocial: data.razaoSocial,
                nomeFantasia: data.nomeFantasia || undefined,
                cnpj: cnpjLimpo,
                inscricaoEstadual: data.inscricaoEstadual || undefined,
                telefone: data.telefone ? removeMask(data.telefone) : undefined,
                emailComercial: data.emailComercial || undefined,
                site: data.site || undefined,
                endereco: data.endereco || undefined,
                numero: data.numero || undefined,
                complemento: data.complemento || undefined,
                bairro: data.bairro || undefined,
                cidade: data.cidade || undefined,
                estado: data.estado || undefined,
                cep: data.cep ? removeMask(data.cep) : undefined,
                observacoes: data.observacoes || undefined,
            };

            await atualizarEmpresa(empresaId, apiData);
            showAlert("Empresa atualizada com sucesso!", "success");
            router.push(`/empresas/${empresaId}`);
        } catch (error: any) {
            console.error("Erro ao atualizar empresa:", error);
            showAlert(error?.message || "Erro ao atualizar empresa", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!empresa) {
        return null;
    }

    const ufs = [
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
        "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
        "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    return (
        <div className="p-6">
            <div className="mb-6">
                <button
                    onClick={() => router.push(`/empresas/${empresaId}`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Voltar
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Editar Empresa</h1>
                <p className="text-gray-600">Atualize as informações da empresa</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Razão Social *
                            </label>
                            <input
                                {...register("razaoSocial")}
                                className={`w-full px-3 py-2 border rounded-md ${errors.razaoSocial ? "border-red-500" : "border-gray-300"}`}
                            />
                            {errors.razaoSocial && (
                                <p className="text-red-500 text-sm mt-1">{errors.razaoSocial.message as string}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Fantasia
                            </label>
                            <input
                                {...register("nomeFantasia")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CNPJ *
                            </label>
                            <input
                                {...register("cnpj")}
                                placeholder="00.000.000/0000-00"
                                className={`w-full px-3 py-2 border rounded-md ${errors.cnpj ? "border-red-500" : "border-gray-300"}`}
                            />
                            {errors.cnpj && (
                                <p className="text-red-500 text-sm mt-1">{errors.cnpj.message as string}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Inscrição Estadual
                            </label>
                            <input
                                {...register("inscricaoEstadual")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone
                            </label>
                            <input
                                {...register("telefone")}
                                placeholder="(00) 00000-0000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Comercial
                            </label>
                            <input
                                {...register("emailComercial")}
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Site
                            </label>
                            <input
                                {...register("site")}
                                placeholder="https://www.exemplo.com.br"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                            <div className="relative">
                                <input
                                    {...register("cep")}
                                    placeholder="00000-000"
                                    disabled={loadingCep}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${loadingCep ? "opacity-50 cursor-not-allowed" : ""}`}
                                />
                                {loadingCep && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            {loadingCep && (
                                <p className="text-blue-600 text-sm mt-1">Buscando endereço...</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                            <input
                                {...register("endereco")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                            <input
                                {...register("numero")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                            <input
                                {...register("complemento")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                            <input
                                {...register("bairro")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                            <input
                                {...register("cidade")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                {...register("estado")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Selecione...</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Observações */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
                    <textarea
                        {...register("observacoes")}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Informações adicionais..."
                    />
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => router.push(`/empresas/${empresaId}`)}
                        disabled={submitting}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </div>
            </form>
        </div>
    );
}

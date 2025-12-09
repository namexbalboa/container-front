"use client";

import { useState, useEffect } from "react";
import { Seguradora, SeguradoraCreate, SeguradoraUpdate } from "@/types/api";
import { buscarCep } from "@/lib/cep";

interface BaseSeguradoraFormProps {
    onCancel: () => void;
    isLoading?: boolean;
}

interface CreateSeguradoraFormProps extends BaseSeguradoraFormProps {
    mode: "create";
    onSubmit: (data: SeguradoraCreate) => Promise<void>;
    seguradora?: never;
}

interface EditSeguradoraFormProps extends BaseSeguradoraFormProps {
    mode: "edit";
    onSubmit: (data: SeguradoraUpdate) => Promise<void>;
    seguradora: Seguradora;
}

type SeguradoraFormProps = CreateSeguradoraFormProps | EditSeguradoraFormProps;

export default function SeguradoraForm({ 
    seguradora, 
    onSubmit, 
    onCancel, 
    isLoading = false, 
    mode 
}: SeguradoraFormProps) {
    const [formData, setFormData] = useState<SeguradoraCreate>({
        razaoSocial: "",
        cnpj: "",
        email: "",
        telefone: "",
        susep: "",
        site: "",
        endereco: {
            cep: "",
            logradouro: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: ""
        },
        idCorretor: undefined
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loadingCep, setLoadingCep] = useState(false);

    useEffect(() => {
        if (seguradora && mode === "edit") {
            // Parse endereco if it's a string
            let enderecoObj = {
                cep: "",
                logradouro: "",
                numero: "",
                complemento: "",
                bairro: "",
                cidade: "",
                estado: ""
            };

            // If endereco is an object, use it directly
            if (seguradora.endereco && typeof seguradora.endereco === 'object') {
                enderecoObj = {
                    cep: seguradora.endereco.cep || "",
                    logradouro: seguradora.endereco.logradouro || "",
                    numero: seguradora.endereco.numero || "",
                    complemento: seguradora.endereco.complemento || "",
                    bairro: seguradora.endereco.bairro || "",
                    cidade: seguradora.endereco.cidade || "",
                    estado: seguradora.endereco.estado || ""
                };
            }

            setFormData({
                razaoSocial: seguradora.nomeSeguradora,
                cnpj: seguradora.cnpj,
                email: seguradora.email || "",
                telefone: seguradora.telefone || "",
                susep: "",
                site: "",
                endereco: enderecoObj,
                idCorretor: undefined
            });
        }
    }, [seguradora, mode]);

    const formatCnpj = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        if (numbers.length <= 10) {
            return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
        }
        return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    };

    const formatCep = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        return numbers.replace(/^(\d{5})(\d{3})$/, "$1-$2");
    };

    const handleCepChange = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, "");

        // Atualiza o CEP no formulário
        handleInputChange("endereco.cep", cepLimpo);

        // Se tiver 8 dígitos, busca o endereço
        if (cepLimpo.length === 8) {
            setLoadingCep(true);

            try {
                const resultado = await buscarCep(cepLimpo);

                // Preenche os campos com os dados retornados
                setFormData(prev => ({
                    ...prev,
                    endereco: {
                        cep: cepLimpo,
                        logradouro: resultado.street || "",
                        numero: prev.endereco?.numero || "",
                        complemento: prev.endereco?.complemento || "",
                        bairro: resultado.neighborhood || "",
                        cidade: resultado.city || "",
                        estado: resultado.state || ""
                    }
                }));

                // Limpa erro do CEP se houver
                if (errors["endereco.cep"]) {
                    setErrors(prev => ({
                        ...prev,
                        "endereco.cep": ""
                    }));
                }
            } catch (error) {
                // Exibe mensagem de erro
                const errorMessage = error && typeof error === 'object' && 'message' in error
                    ? (error as { message: string }).message
                    : 'Erro ao buscar CEP';

                setErrors(prev => ({
                    ...prev,
                    "endereco.cep": errorMessage
                }));
            } finally {
                setLoadingCep(false);
            }
        }
    };

    const handleInputChange = (field: string, value: string | number | undefined) => {
        if (field.startsWith("endereco.")) {
            const enderecoField = field.split(".")[1];
            setFormData(prev => ({
                ...prev,
                endereco: {
                    cep: "",
                    logradouro: "",
                    numero: "",
                    complemento: "",
                    bairro: "",
                    cidade: "",
                    estado: "",
                    ...prev.endereco,
                    [enderecoField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }

        // Limpar erro do campo
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.razaoSocial.trim()) {
            newErrors.razaoSocial = "Razão Social é obrigatória";
        }

        if (!formData.cnpj.trim()) {
            newErrors.cnpj = "CNPJ é obrigatório";
        } else if (formData.cnpj.replace(/\D/g, "").length !== 14) {
            newErrors.cnpj = "CNPJ deve ter 14 dígitos";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email é obrigatório";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email inválido";
        }

        if (!formData.telefone.trim()) {
            newErrors.telefone = "Telefone é obrigatório";
        }

        if (formData.endereco?.cep && formData.endereco.cep.replace(/\D/g, "").length !== 8) {
            newErrors["endereco.cep"] = "CEP deve ter 8 dígitos";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Remover formatação antes de enviar
            const dataToSubmit: SeguradoraCreate = {
                razaoSocial: formData.razaoSocial,
                cnpj: formData.cnpj.replace(/\D/g, ""),
                email: formData.email,
                telefone: formData.telefone.replace(/\D/g, ""),
                ...(formData.susep && { susep: formData.susep }),
                ...(formData.site && { site: formData.site }),
                ...(formData.endereco && {
                    endereco: {
                        logradouro: formData.endereco.logradouro,
                        numero: formData.endereco.numero,
                        ...(formData.endereco.complemento && { complemento: formData.endereco.complemento }),
                        bairro: formData.endereco.bairro,
                        cidade: formData.endereco.cidade,
                        estado: formData.endereco.estado,
                        cep: formData.endereco.cep.replace(/\D/g, "")
                    }
                }),
                ...(formData.idCorretor && { idCorretor: formData.idCorretor })
            };

            await onSubmit(dataToSubmit);
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    };

    const ufs = [
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
        "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
        "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Razão Social *
                        </label>
                        <input
                            type="text"
                            value={formData.razaoSocial}
                            onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 ${
                                errors.razaoSocial ? "border-red-500" : "border-gray-300"
                            }`}
                            required
                        />
                        {errors.razaoSocial && (
                            <p className="text-red-500 text-sm mt-1">{errors.razaoSocial}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CNPJ *
                        </label>
                        <input
                            type="text"
                            value={formatCnpj(formData.cnpj)}
                            onChange={(e) => handleInputChange("cnpj", e.target.value.replace(/\D/g, ""))}
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 ${
                                errors.cnpj ? "border-red-500" : "border-gray-300"
                            }`}
                            required
                        />
                        {errors.cnpj && (
                            <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 ${
                                errors.email ? "border-red-500" : "border-gray-300"
                            }`}
                            required
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone *
                        </label>
                        <input
                            type="tel"
                            value={formatPhone(formData.telefone || "")}
                            onChange={(e) => handleInputChange("telefone", e.target.value.replace(/\D/g, ""))}
                            placeholder="(00) 0000-0000"
                            maxLength={15}
                            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 ${
                                errors.telefone ? "border-red-500" : "border-gray-300"
                            }`}
                            required
                        />
                        {errors.telefone && (
                            <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            SUSEP
                        </label>
                        <input
                            type="text"
                            value={formData.susep || ""}
                            onChange={(e) => handleInputChange("susep", e.target.value)}
                            placeholder="Código SUSEP"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Site
                        </label>
                        <input
                            type="url"
                            value={formData.site || ""}
                            onChange={(e) => handleInputChange("site", e.target.value)}
                            placeholder="https://www.exemplo.com.br"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>
                </div>
            </div>

            {/* Endereço */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CEP
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formatCep(formData.endereco?.cep || "")}
                                onChange={(e) => handleCepChange(e.target.value)}
                                placeholder="00000-000"
                                maxLength={9}
                                disabled={loadingCep}
                                className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 ${
                                    errors["endereco.cep"] ? "border-red-500" : "border-gray-300"
                                } ${loadingCep ? "opacity-50 cursor-not-allowed" : ""}`}
                            />
                            {loadingCep && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>
                        {errors["endereco.cep"] && (
                            <p className="text-red-500 text-sm mt-1">{errors["endereco.cep"]}</p>
                        )}
                        {loadingCep && (
                            <p className="text-blue-600 text-sm mt-1">Buscando endereço...</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Logradouro
                        </label>
                        <input
                            type="text"
                            value={formData.endereco?.logradouro || ""}
                            onChange={(e) => handleInputChange("endereco.logradouro", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número
                        </label>
                        <input
                            type="text"
                            value={formData.endereco?.numero || ""}
                            onChange={(e) => handleInputChange("endereco.numero", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Complemento
                        </label>
                        <input
                            type="text"
                            value={formData.endereco?.complemento || ""}
                            onChange={(e) => handleInputChange("endereco.complemento", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bairro
                        </label>
                        <input
                            type="text"
                            value={formData.endereco?.bairro || ""}
                            onChange={(e) => handleInputChange("endereco.bairro", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cidade
                        </label>
                        <input
                            type="text"
                            value={formData.endereco?.cidade || ""}
                            onChange={(e) => handleInputChange("endereco.cidade", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            UF
                        </label>
                        <select
                            value={formData.endereco?.estado || ""}
                            onChange={(e) => handleInputChange("endereco.estado", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        >
                            <option value="">Selecione...</option>
                            {ufs.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isLoading ? "Salvando..." : mode === "create" ? "Criar Seguradora" : "Salvar Alterações"}
                </button>
            </div>
        </form>
    );
}
"use client";

import { useState, useEffect } from "react";
import { Seguradora, SeguradoraCreate, SeguradoraUpdate } from "@/types/api";

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
        nomeSeguradora: "",
        cnpj: "",
        email: "",
        telefone: "",
        celular: "",
        endereco: {
            cep: "",
            logradouro: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: "",
            pais: ""
        },
        observacoes: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (seguradora && mode === "edit") {
            // Parse endereco if it's a string
            let enderecoObj = {
                cep: seguradora.cep || "",
                logradouro: "",
                numero: "",
                complemento: "",
                bairro: "",
                cidade: seguradora.cidade || "",
                estado: seguradora.estado || "",
                pais: "Brasil"
            };

            // If endereco is an object, use it directly
            if (seguradora.endereco && typeof seguradora.endereco === 'object') {
                enderecoObj = { ...enderecoObj, ...seguradora.endereco };
            } else if (typeof seguradora.endereco === 'string' && seguradora.endereco) {
                // If it's a string, parse it (best effort)
                enderecoObj.logradouro = seguradora.endereco;
            }

            setFormData({
                nomeSeguradora: seguradora.nomeSeguradora,
                cnpj: seguradora.cnpj,
                email: seguradora.email || "",
                telefone: seguradora.telefone || "",
                celular: "", // celular não existe no schema de Seguradora
                endereco: enderecoObj,
                observacoes: seguradora.observacoes || ""
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

    const handleInputChange = (field: string, value: string) => {
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
                    pais: "",
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

        if (!formData.nomeSeguradora.trim()) {
            newErrors.nomeSeguradora = "Nome é obrigatório";
        }

        if (!formData.cnpj.trim()) {
            newErrors.cnpj = "CNPJ é obrigatório";
        } else if (formData.cnpj.replace(/\D/g, "").length !== 14) {
            newErrors.cnpj = "CNPJ deve ter 14 dígitos";
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email inválido";
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
            const dataToSubmit = {
                ...formData,
                cnpj: formData.cnpj.replace(/\D/g, ""),
                telefone: formData.telefone ? formData.telefone.replace(/\D/g, "") : "",
                celular: formData.celular ? formData.celular.replace(/\D/g, "") : "",
                endereco: formData.endereco ? {
                    ...formData.endereco,
                    cep: formData.endereco.cep ? formData.endereco.cep.replace(/\D/g, "") : ""
                } : undefined
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
                            Nome da Seguradora *
                        </label>
                        <input
                            type="text"
                            value={formData.nomeSeguradora}
                            onChange={(e) => handleInputChange("nomeSeguradora", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 ${
                                errors.nomeSeguradora ? "border-red-500" : "border-gray-300"
                            }`}
                            required
                        />
                        {errors.nomeSeguradora && (
                            <p className="text-red-500 text-sm mt-1">{errors.nomeSeguradora}</p>
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
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 ${
                                errors.email ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                        </label>
                        <input
                            type="tel"
                            value={formatPhone(formData.telefone || "")}
                            onChange={(e) => handleInputChange("telefone", e.target.value.replace(/\D/g, ""))}
                            placeholder="(00) 0000-0000"
                            maxLength={14}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Celular
                        </label>
                        <input
                            type="tel"
                            value={formatPhone(formData.celular || "")}
                            onChange={(e) => handleInputChange("celular", e.target.value.replace(/\D/g, ""))}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
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
                        <input
                            type="text"
                            value={formatCep(formData.endereco?.cep || "")}
                            onChange={(e) => handleInputChange("endereco.cep", e.target.value.replace(/\D/g, ""))}
                            placeholder="00000-000"
                            maxLength={9}
                            className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 ${
                                errors["endereco.cep"] ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                        {errors["endereco.cep"] && (
                            <p className="text-red-500 text-sm mt-1">{errors["endereco.cep"]}</p>
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

            {/* Observações */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Observações
                </h3>
                <textarea
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange("observacoes", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="Informações adicionais sobre a seguradora..."
                />
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
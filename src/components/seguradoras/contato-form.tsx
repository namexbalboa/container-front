"use client";

import { useState } from "react";
import { SeguradoraContatoCreate } from "@/types/api";

interface ContatoFormProps {
    onSubmit: (data: SeguradoraContatoCreate) => void;
    isLoading?: boolean;
}

export default function ContatoForm({ onSubmit, isLoading = false }: ContatoFormProps) {
    const [formData, setFormData] = useState<SeguradoraContatoCreate>({
        nome: "",
        cargo: "",
        email: "",
        telefone: "",
        celular: "",
        departamento: "",
        principal: false
    });

    const [errors, setErrors] = useState<Partial<Record<keyof SeguradoraContatoCreate, string>>>({});

    const handleInputChange = (field: keyof SeguradoraContatoCreate, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof SeguradoraContatoCreate, string>> = {};

        if (!formData.nome.trim()) {
            newErrors.nome = "Nome é obrigatório";
        }

        if (!formData.cargo.trim()) {
            newErrors.cargo = "Cargo é obrigatório";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email é obrigatório";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email inválido";
        }

        if (!formData.telefone.trim()) {
            newErrors.telefone = "Telefone é obrigatório";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const submitData: SeguradoraContatoCreate = {
                nome: formData.nome,
                cargo: formData.cargo,
                email: formData.email,
                telefone: formData.telefone,
                principal: formData.principal
            };

            if (formData.celular?.trim()) {
                submitData.celular = formData.celular;
            }

            if (formData.departamento?.trim()) {
                submitData.departamento = formData.departamento;
            }

            onSubmit(submitData);
        }
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    };

    const handlePhoneChange = (field: "telefone" | "celular", value: string) => {
        const formatted = formatPhone(value);
        handleInputChange(field, formatted);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => handleInputChange("nome", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${
                            errors.nome ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Nome completo do contato"
                        disabled={isLoading}
                    />
                    {errors.nome && (
                        <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.cargo}
                        onChange={(e) => handleInputChange("cargo", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${
                            errors.cargo ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Ex: Gerente Comercial"
                        disabled={isLoading}
                    />
                    {errors.cargo && (
                        <p className="text-red-500 text-sm mt-1">{errors.cargo}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${
                            errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="email@exemplo.com"
                        disabled={isLoading}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento
                    </label>
                    <input
                        type="text"
                        value={formData.departamento || ""}
                        onChange={(e) => handleInputChange("departamento", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Ex: Comercial, Financeiro"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.telefone}
                        onChange={(e) => handlePhoneChange("telefone", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${
                            errors.telefone ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="(00) 0000-0000"
                        maxLength={15}
                        disabled={isLoading}
                    />
                    {errors.telefone && (
                        <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celular
                    </label>
                    <input
                        type="text"
                        value={formData.celular || ""}
                        onChange={(e) => handlePhoneChange("celular", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="principal"
                    checked={formData.principal}
                    onChange={(e) => handleInputChange("principal", e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isLoading}
                />
                <label htmlFor="principal" className="ml-2 block text-sm text-gray-700">
                    Contato principal
                </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isLoading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? "Salvando..." : "Salvar Contato"}
                </button>
            </div>
        </form>
    );
}

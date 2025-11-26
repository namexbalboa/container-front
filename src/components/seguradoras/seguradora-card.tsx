"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, DollarSign, FileText, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { Seguradora } from "@/types/api";

interface SeguradoraCardProps {
    seguradora: Seguradora;
    onUpdate?: () => void;
}

export default function SeguradoraCard({ seguradora, onUpdate }: SeguradoraCardProps) {
    const { hasPermission } = usePermissions();
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusChange = async (novoStatus: "ativa" | "inativa") => {
        if (!hasPermission("SEGURADORAS", "UPDATE")) return;

        try {
            setIsLoading(true);
            await apiService.updateSeguradoraStatus(seguradora.idSeguradora, novoStatus);
            onUpdate?.();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ativa":
                return "bg-green-100 text-green-800";
            case "inativa":
                return "bg-red-100 text-red-800";
            case "suspensa":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatCnpj = (cnpj: string) => {
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    };

    const formatPhone = (phone: string) => {
        return phone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
    };

    return (
        <div className="bg-white  rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900  mb-2">
                        {seguradora.nomeSeguradora}
                    </h3>
                    <p className="text-sm text-gray-600  mb-1">
                        CNPJ: {formatCnpj(seguradora.cnpj)}
                    </p>
                    {seguradora.telefone && (
                        <p className="text-sm text-gray-600  mb-1">
                            Telefone: {formatPhone(seguradora.telefone)}
                        </p>
                    )}
                    {seguradora.email && (
                        <p className="text-sm text-gray-600 ">
                            Email: {seguradora.email}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seguradora.status)}`}>
                        {seguradora.status}
                    </span>
                    {hasPermission("SEGURADORAS", "UPDATE") && (
                        <select
                            value={seguradora.status}
                            onChange={(e) => handleStatusChange(e.target.value as "ativa" | "inativa")}
                            disabled={isLoading}
                            className="text-xs border rounded px-2 py-1 bg-white  border-gray-300 "
                        >
                            <option value="ativa">Ativo</option>
                            <option value="inativa">Inativo</option>
                        </select>
                    )}
                </div>
            </div>

            {seguradora.endereco && (
                <div className="mb-4 p-3 bg-gray-50  rounded">
                    <h4 className="text-sm font-medium text-gray-900  mb-1">Endereço</h4>
                    <p className="text-sm text-gray-600 ">
                        {seguradora.endereco.logradouro}, {seguradora.endereco.numero}
                        {seguradora.endereco.complemento && `, ${seguradora.endereco.complemento}`}
                    </p>
                    <p className="text-sm text-gray-600 ">
                        {seguradora.endereco.bairro} - {seguradora.endereco.cidade}/{seguradora.endereco.estado}
                    </p>
                    <p className="text-sm text-gray-600 ">
                        CEP: {seguradora.endereco.cep}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                    <p className="text-lg font-semibold text-gray-900 ">
                        {seguradora.totalAverbacoes || 0}
                    </p>
                    <p className="text-xs text-gray-600 ">Averbações</p>
                </div>
                <div>
                    <p className="text-lg font-semibold text-gray-900 ">
                        {formatCurrency(seguradora.valorTotalAverbado || 0)}
                    </p>
                    <p className="text-xs text-gray-600 ">Valor Total</p>
                </div>
                <div>
                    <p className="text-lg font-semibold text-gray-900 ">
                        {seguradora.mediaTempoAprovacao || 0}h
                    </p>
                    <p className="text-xs text-gray-600 ">Tempo Médio</p>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 ">
                <div className="text-xs text-gray-500 ">
                    Atualizado em: {seguradora.dataAtualizacao ? formatDate(seguradora.dataAtualizacao) : "N/A"}
                </div>
                <div className="flex space-x-2">
                    {hasPermission("SEGURADORAS", "READ") && (
                        <Link
                            href={`/seguradoras/${seguradora.idSeguradora}`}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Ver Detalhes
                        </Link>
                    )}
                    {hasPermission("SEGURADORAS", "UPDATE") && (
                        <Link
                            href={`/seguradoras/${seguradora.idSeguradora}/editar`}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Editar
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
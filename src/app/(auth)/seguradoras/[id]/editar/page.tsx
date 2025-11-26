"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    ArrowLeftIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { useApi } from "@/lib/api";
import { Seguradora, SeguradoraUpdate } from "@/types/api";
import { SeguradoraForm } from "@/components/seguradoras";

export default function EditarSeguradoraPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const { hasPermission } = usePermissions();
    const api = useApi();

    const seguradoraId = parseInt(params.id as string);

    // Estados
    const [seguradora, setSeguradora] = useState<Seguradora | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Verificar permissões
    const canUpdate = hasPermission("SEGURADORAS", "UPDATE");

    // Carregar dados
    useEffect(() => {
        if (!canUpdate) {
            setError("Você não tem permissão para editar seguradoras");
            setLoading(false);
            return;
        }

        if (isNaN(seguradoraId)) {
            setError("ID da seguradora inválido");
            setLoading(false);
            return;
        }

        loadSeguradora();
    }, [seguradoraId, canUpdate]);

    const loadSeguradora = async () => {
        try {
            setLoading(true);
            const response = await api.getSeguradora(seguradoraId);
            
            if (response.success && response.data) {
                setSeguradora(response.data);
            } else {
                throw new Error(response.message || "Erro ao carregar seguradora");
            }
        } catch (err) {
            console.error("Erro ao carregar seguradora:", err);
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: SeguradoraUpdate) => {
        try {
            const response = await api.updateSeguradora(seguradoraId, data);

            if (response.success) {
                router.push(`/seguradoras/${seguradoraId}`);
            } else {
                throw new Error(response.message || "Erro ao atualizar seguradora");
            }
        } catch (err) {
            console.error("Erro ao atualizar seguradora:", err);
            throw new Error(err instanceof Error ? err.message : "Erro desconhecido");
        }
    };

    if (!canUpdate) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Acesso Negado
                    </h3>
                    <p className="text-gray-500">
                        Você não tem permissão para editar seguradoras.
                    </p>
                    <Button 
                        onClick={() => router.push("/seguradoras")}
                        className="mt-4"
                    >
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !seguradora) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Erro ao carregar dados
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={() => router.push("/seguradoras")}>
                            Voltar
                        </Button>
                        <Button variant="outline" onClick={loadSeguradora}>
                            Tentar novamente
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/seguradoras/${seguradoraId}`)}
                    className="flex items-center gap-2"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Editar Seguradora
                    </h1>
                    <p className="text-gray-500">
                        {seguradora?.nomeSeguradora}
                    </p>
                </div>
            </div>

            {/* Formulário */}
            {seguradora && (
                <SeguradoraForm
                    mode="edit"
                    seguradora={seguradora}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push(`/seguradoras/${seguradoraId}`)}
                />
            )}
        </div>
    );
}
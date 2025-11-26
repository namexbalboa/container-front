"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    ArrowLeftIcon,
    BuildingOfficeIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { useApi } from "@/lib/api";
import { SeguradoraCreate } from "@/types/api";
import { SeguradoraForm } from "@/components/seguradoras";

export default function CriarSeguradoraPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const api = useApi();

    // Verificar permissões
    const canCreate = hasPermission("SEGURADORAS", "CREATE");

    const handleSubmit = async (data: SeguradoraCreate) => {
        try {
            const response = await api.createSeguradora(data);

            if (response.success) {
                router.push("/seguradoras");
            } else {
                throw new Error(response.message || "Erro ao criar seguradora");
            }
        } catch (err) {
            console.error("Erro ao criar seguradora:", err);
            throw new Error(err instanceof Error ? err.message : "Erro desconhecido");
        }
    };

    if (!canCreate) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900  mb-2">
                        Acesso Negado
                    </h3>
                    <p className="text-gray-500 ">
                        Você não tem permissão para criar seguradoras.
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/seguradoras")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 ">
                        Nova Seguradora
                    </h1>
                    <p className="text-gray-500 ">
                        Cadastre uma nova seguradora no sistema
                    </p>
                </div>
            </div>

            <SeguradoraForm
                mode="create"
                onSubmit={handleSubmit}
                onCancel={() => router.push("/seguradoras")}
            />
        </div>
    );
}
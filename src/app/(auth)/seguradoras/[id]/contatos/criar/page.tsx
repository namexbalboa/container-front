"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAlert } from "@/contexts/AlertContext";
import { apiService } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { SeguradoraContatoCreate, Seguradora } from "@/types/api";
import ContatoForm from "@/components/seguradoras/contato-form";

export default function CriarContatoPage() {
    const router = useRouter();
    const params = useParams();
    const { showAlert } = useAlert();
    const { hasPermission } = usePermissions();
    const [isLoading, setIsLoading] = useState(false);
    const [seguradora, setSeguradora] = useState<Seguradora | null>(null);
    const [isLoadingSeguradora, setIsLoadingSeguradora] = useState(true);

    const seguradoraId = Number(params.id);

    useEffect(() => {
        const fetchSeguradora = async () => {
            try {
                setIsLoadingSeguradora(true);
                const response = await apiService.getSeguradora(seguradoraId);
                if (response.success && response.data) {
                    setSeguradora(response.data);
                }
            } catch (error) {
                console.error("Erro ao carregar seguradora:", error);
                showAlert("Erro ao carregar informações da seguradora", "error");
            } finally {
                setIsLoadingSeguradora(false);
            }
        };

        if (hasPermission("SEGURADORAS", "CREATE")) {
            fetchSeguradora();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seguradoraId]);

    const handleSubmit = async (data: SeguradoraContatoCreate) => {
        try {
            setIsLoading(true);
            const response = await apiService.createSeguradoraContato(seguradoraId, data);

            if (response.success) {
                showAlert("Contato criado com sucesso!", "success");
                router.push(`/seguradoras/${seguradoraId}`);
            } else {
                showAlert(response.message || "Erro ao criar contato", "error");
            }
        } catch (error: any) {
            console.error("Erro ao criar contato:", error);
            showAlert(
                error.response?.data?.message || "Erro ao criar contato",
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasPermission("SEGURADORAS", "CREATE")) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Acesso Negado
                    </h2>
                    <p className="text-gray-600">
                        Você não tem permissão para criar contatos.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoadingSeguradora) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!seguradora) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Seguradora não encontrada
                    </h2>
                    <p className="text-gray-600">
                        A seguradora solicitada não existe.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <a href="/seguradoras" className="hover:text-blue-600">
                        Seguradoras
                    </a>
                    <span>/</span>
                    <a
                        href={`/seguradoras/${seguradoraId}`}
                        className="hover:text-blue-600"
                    >
                        {seguradora.nomeSeguradora}
                    </a>
                    <span>/</span>
                    <span className="text-gray-900">Novo Contato</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Adicionar Contato
                </h1>
                <p className="text-gray-600">
                    Adicione um novo contato para {seguradora.nomeSeguradora}
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <ContatoForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
        </div>
    );
}

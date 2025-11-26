"use client";

import { useState, useEffect } from "react";
import { Plus, X, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

interface Container {
    idCeContainer?: number;
    nrContainer: string;
    sequencia: number;
    ativo?: boolean;
    tipoContainer?: string;
}

interface ContainersSectionProps {
    numeroCE?: string;
    value: string[]; // Array de matrículas ISO 6346
    onChange: (containers: string[]) => void;
    disabled?: boolean;
}

// Regex para validar matrícula ISO 6346
const ISO_6346_REGEX = /^[A-Z]{4}\d{7}$/;

export function ContainersSection({ numeroCE, value = [], onChange, disabled = false }: ContainersSectionProps) {
    const api = useApi();
    const [containers, setContainers] = useState<string[]>(value);
    const [newContainer, setNewContainer] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [existingContainers, setExistingContainers] = useState<Container[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Carregar containers existentes se temos um numeroCE
    useEffect(() => {
        if (numeroCE) {
            loadExistingContainers();
        }
    }, [numeroCE]);

    // Sincronizar com prop value
    useEffect(() => {
        setContainers(value);
    }, [value]);

    const loadExistingContainers = async () => {
        if (!numeroCE) return;

        try {
            setIsLoading(true);
            const response = await api.getContainersByCE(numeroCE);

            if (response.success && response.data) {
                setExistingContainers(response.data.containers || []);
            }
        } catch (err) {
            console.error("Erro ao carregar containers:", err);
            // Não mostra toast pois pode ser uma viagem nova sem containers ainda
        } finally {
            setIsLoading(false);
        }
    };

    const validateContainer = (nrContainer: string): boolean => {
        const normalized = nrContainer.trim().toUpperCase();

        if (!ISO_6346_REGEX.test(normalized)) {
            setError("Matrícula inválida. Formato esperado: AAAU1234567 (4 letras + 7 dígitos)");
            return false;
        }

        if (containers.includes(normalized)) {
            setError("Este container já está na lista");
            return false;
        }

        setError(null);
        return true;
    };

    const addContainer = () => {
        const normalized = newContainer.trim().toUpperCase();

        if (!normalized) {
            setError("Digite uma matrícula de container");
            return;
        }

        if (!validateContainer(normalized)) {
            return;
        }

        const updated = [...containers, normalized];
        setContainers(updated);
        onChange(updated);
        setNewContainer("");
        setError(null);
        toast.success(`Container ${normalized} adicionado`);
    };

    const removeContainer = (index: number) => {
        const containerToRemove = containers[index];
        const updated = containers.filter((_, i) => i !== index);
        setContainers(updated);
        onChange(updated);
        toast.success(`Container ${containerToRemove} removido`);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addContainer();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Containers (ISO 6346)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {containers.length === 0
                            ? "Nenhum container adicionado"
                            : `${containers.length} container${containers.length > 1 ? "es" : ""}`}
                    </p>
                </div>

                {existingContainers.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                        {existingContainers.length} no banco
                    </Badge>
                )}
            </div>

            {/* Input para adicionar novo container */}
            {!disabled && (
                <Card className="p-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Ex: MAEU1234567"
                                value={newContainer}
                                onChange={(e) => {
                                    setNewContainer(e.target.value.toUpperCase());
                                    setError(null);
                                }}
                                onKeyPress={handleKeyPress}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={11}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Formato: 4 letras + 7 dígitos (ex: MAEU1234567)
                            </p>
                            {error && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                                    <AlertCircle className="w-3 h-3" />
                                    {error}
                                </div>
                            )}
                        </div>
                        <Button
                            type="button"
                            onClick={addContainer}
                            disabled={isLoading || !newContainer.trim()}
                            className="shrink-0"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                        </Button>
                    </div>
                </Card>
            )}

            {/* Lista de containers */}
            {containers.length > 0 && (
                <div className="space-y-2">
                    {containers.map((container, index) => {
                        const isInDatabase = existingContainers.some(
                            (ec) => ec.nrContainer === container && ec.ativo
                        );

                        return (
                            <Card key={`${container}-${index}`} className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Badge variant="outline" className="font-mono">
                                            #{index + 1}
                                        </Badge>
                                        <span className="font-mono font-semibold text-lg">
                                            {container}
                                        </span>
                                        {isInDatabase && (
                                            <Badge variant="success" className="text-xs">
                                                Vinculado
                                            </Badge>
                                        )}
                                    </div>
                                    {!disabled && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeContainer(index)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {containers.length === 0 && disabled && (
                <Card className="p-6 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum container vinculado a esta viagem</p>
                </Card>
            )}

            {/* Estatísticas */}
            {containers.length > 0 && (
                <Card className="p-3 bg-muted/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total de containers:</span>
                        <span className="font-semibold">{containers.length}</span>
                    </div>
                </Card>
            )}
        </div>
    );
}

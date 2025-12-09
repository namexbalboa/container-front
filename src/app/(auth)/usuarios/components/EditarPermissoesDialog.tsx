"use client";

import { useState, useEffect, useMemo } from "react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { apiService } from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permissao } from "@/types/api";

interface EditarPermissoesDialogProps {
    perfilId: number;
    perfilNome: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface PermissoesPorModulo {
    [modulo: string]: Permissao[];
}

export default function EditarPermissoesDialog({
    perfilId,
    perfilNome,
    isOpen,
    onClose,
    onSuccess,
}: EditarPermissoesDialogProps) {
    const { showAlert } = useAlert();
    const { hasPermission, isAdmin } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [todasPermissoes, setTodasPermissoes] = useState<Permissao[]>([]);
    const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<Set<number>>(new Set());
    const [permissionError, setPermissionError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, perfilId]);

    const loadData = async () => {
        // Verificar se o usuário tem permissão ou é administrador
        if (!isAdmin() && !hasPermission("PERMISSOES", "READ")) {
            setPermissionError(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        setPermissionError(false);
        try {
            const [permissoesResponse, perfilPermissoesResponse] = await Promise.all([
                apiService.getAllPermissoes(),
                apiService.getPerfilPermissoes(perfilId),
            ]);

            if (permissoesResponse.success && permissoesResponse.data) {
                // A resposta pode vir como array direto ou como objeto com items
                let permissoes: Permissao[] = [];

                if (Array.isArray(permissoesResponse.data)) {
                    permissoes = permissoesResponse.data;
                } else if (permissoesResponse.data.items && Array.isArray(permissoesResponse.data.items)) {
                    permissoes = permissoesResponse.data.items;
                }

                setTodasPermissoes(permissoes);
            } else if (!permissoesResponse.success) {
                throw new Error(permissoesResponse.message || "Erro ao carregar permissões");
            }

            if (perfilPermissoesResponse.success && perfilPermissoesResponse.data) {
                const idsAtuais = new Set(
                    perfilPermissoesResponse.data.map((p: any) => p.idPermissao)
                );
                setPermissoesSelecionadas(idsAtuais);
            } else if (!perfilPermissoesResponse.success) {
                throw new Error(perfilPermissoesResponse.message || "Erro ao carregar permissões do perfil");
            }
        } catch (error: any) {
            console.error("Erro ao carregar permissões:", error);

            // Verificar se é erro de permissão
            if (error.message?.includes("administrador") || error.message?.includes("permissão") || error.message?.includes("Acesso")) {
                setPermissionError(true);
            } else {
                showAlert(error.message || "Erro ao carregar permissões", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermissao = (idPermissao: number) => {
        setPermissoesSelecionadas((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(idPermissao)) {
                newSet.delete(idPermissao);
            } else {
                newSet.add(idPermissao);
            }
            return newSet;
        });
    };

    const handleToggleModulo = (modulo: string, permissoes: Permissao[]) => {
        const idsDoModulo = permissoes.map((p) => p.idPermissao);
        const todosAtivos = idsDoModulo.every((id) => permissoesSelecionadas.has(id));

        setPermissoesSelecionadas((prev) => {
            const newSet = new Set(prev);
            if (todosAtivos) {
                idsDoModulo.forEach((id) => newSet.delete(id));
            } else {
                idsDoModulo.forEach((id) => newSet.add(id));
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await apiService.syncPerfilPermissoes(
                perfilId,
                Array.from(permissoesSelecionadas)
            );

            if (response.success) {
                showAlert("Permissões atualizadas com sucesso!", "success");
                onSuccess();
                onClose();
            } else {
                throw new Error(response.message || "Erro ao atualizar permissões");
            }
        } catch (error: any) {
            console.error("Erro ao salvar permissões:", error);
            showAlert(error.message || "Erro ao atualizar permissões", "error");
        } finally {
            setSaving(false);
        }
    };

    // Agrupar permissões por módulo usando useMemo
    const permissoesPorModulo = useMemo(() => {
        if (!Array.isArray(todasPermissoes) || todasPermissoes.length === 0) {
            return {};
        }

        return todasPermissoes.reduce((acc, permissao) => {
            const modulo = permissao.modulo || 'OUTROS';
            if (!acc[modulo]) {
                acc[modulo] = [];
            }
            acc[modulo].push(permissao);
            return acc;
        }, {} as PermissoesPorModulo);
    }, [todasPermissoes]);

    const modulos = useMemo(() => {
        return Object.keys(permissoesPorModulo).sort();
    }, [permissoesPorModulo]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Editar Permissões
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Perfil: {perfilNome}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : permissionError ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Acesso Negado
                            </h3>
                            <p className="text-sm text-gray-600 text-center max-w-md">
                                Você não tem permissão para visualizar e editar permissões.
                                <br />
                                Esta funcionalidade está disponível apenas para administradores.
                            </p>
                        </div>
                    ) : todasPermissoes.length === 0 || modulos.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg mb-2">Nenhuma permissão disponível</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {modulos.map((modulo) => {
                                const permissoesDoModulo = permissoesPorModulo[modulo];
                                const todosAtivos = permissoesDoModulo.every((p) =>
                                    permissoesSelecionadas.has(p.idPermissao)
                                );
                                const algumAtivo = permissoesDoModulo.some((p) =>
                                    permissoesSelecionadas.has(p.idPermissao)
                                );

                                return (
                                    <div key={modulo} className="border rounded-lg p-4">
                                        <div className="flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                checked={todosAtivos}
                                                ref={(input) => {
                                                    if (input) {
                                                        input.indeterminate = algumAtivo && !todosAtivos;
                                                    }
                                                }}
                                                onChange={() =>
                                                    handleToggleModulo(modulo, permissoesDoModulo)
                                                }
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label className="ml-3 text-lg font-semibold text-gray-900">
                                                {modulo}
                                            </label>
                                        </div>

                                        <div className="ml-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {permissoesDoModulo.map((permissao) => (
                                                <div
                                                    key={permissao.idPermissao}
                                                    className="flex items-start"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={permissoesSelecionadas.has(
                                                            permissao.idPermissao
                                                        )}
                                                        onChange={() =>
                                                            handleTogglePermissao(permissao.idPermissao)
                                                        }
                                                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <div className="ml-3">
                                                        <label className="text-sm font-medium text-gray-700">
                                                            {permissao.acao}
                                                        </label>
                                                        {permissao.descricao && (
                                                            <p className="text-xs text-gray-500">
                                                                {permissao.descricao}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                    <p className="text-sm text-gray-600">
                        {permissoesSelecionadas.size} permissão(ões) selecionada(s)
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

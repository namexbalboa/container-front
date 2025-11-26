"use client";

import { useState, useEffect } from "react";
import { SeguradoraContato, SeguradoraContatoCreate, SeguradoraContatoUpdate } from "@/types/api";
import { apiService } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/lib/format-utils";

interface SeguradoraContatosProps {
    seguradoraId: number;
    contatos: SeguradoraContato[];
    onUpdate: () => void;
}

export default function SeguradoraContatos({ seguradoraId, contatos, onUpdate }: SeguradoraContatosProps) {
    const { hasPermission } = usePermissions();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [newContato, setNewContato] = useState<SeguradoraContatoCreate>({
        nome: "",
        cargo: "",
        email: "",
        telefone: "",
        celular: ""
    });

    const handleAdd = async () => {
        if (!hasPermission("SEGURADORAS", "UPDATE")) return;

        try {
            setIsLoading(true);
            await apiService.createSeguradoraContato(seguradoraId, newContato);
            setNewContato({
                nome: "",
                cargo: "",
                email: "",
                telefone: "",
                celular: ""
            });
            setIsAdding(false);
            onUpdate();
        } catch (error) {
            console.error("Erro ao adicionar contato:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (contatoId: number, data: SeguradoraContatoUpdate) => {
        if (!hasPermission("SEGURADORAS", "UPDATE")) return;

        try {
            setIsLoading(true);
            await apiService.updateSeguradoraContato(seguradoraId, contatoId, data);
            setEditingId(null);
            onUpdate();
        } catch (error) {
            console.error("Erro ao atualizar contato:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (contatoId: number) => {
        if (!hasPermission("SEGURADORAS", "DELETE")) return;
        if (!confirm("Tem certeza que deseja excluir este contato?")) return;

        try {
            setIsLoading(true);
            await apiService.deleteSeguradoraContato(seguradoraId, contatoId);
            onUpdate();
        } catch (error) {
            console.error("Erro ao excluir contato:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPhone = (phone: string) => {
        return phone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
    };

    return (
        <div className="bg-white  rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 ">
                    Contatos ({contatos.length})
                </h3>
                {hasPermission("SEGURADORAS", "UPDATE") && (
                    <button
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Adicionar Contato
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="text-md font-medium text-gray-900  mb-4">
                        Novo Contato
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700  mb-1">
                                Nome *
                            </label>
                            <input
                                type="text"
                                value={newContato.nome}
                                onChange={(e) => setNewContato({ ...newContato, nome: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700  mb-1">
                                Cargo
                            </label>
                            <input
                                type="text"
                                value={newContato.cargo}
                                onChange={(e) => setNewContato({ ...newContato, cargo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700  mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={newContato.email}
                                onChange={(e) => setNewContato({ ...newContato, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700  mb-1">
                                Telefone
                            </label>
                            <input
                                type="tel"
                                value={newContato.telefone}
                                onChange={(e) => setNewContato({ ...newContato, telefone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700  mb-1">
                                Celular
                            </label>
                            <input
                                type="tel"
                                value={newContato.celular}
                                onChange={(e) => setNewContato({ ...newContato, celular: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300  rounded-md bg-white  text-gray-900 "
                            />
                        </div>

                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleAdd}
                            disabled={!newContato.nome || isLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                            onClick={() => setIsAdding(false)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {contatos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 ">
                        Nenhum contato cadastrado
                    </div>
                ) : (
                    contatos.map((contato) => (
                        <div
                            key={contato.idContato}
                            className="border border-gray-200  rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 ">
                                        {contato.nome}
                                    </h4>
                                    {contato.cargo && (
                                        <p className="text-sm text-gray-600 ">
                                            {contato.cargo}
                                        </p>
                                    )}
                                </div>
                                {hasPermission("SEGURADORAS", "UPDATE") && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setEditingId(contato.idContato)}
                                            disabled={isLoading}
                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Editar
                                        </button>
                                        {hasPermission("SEGURADORAS", "DELETE") && (
                                            <button
                                                onClick={() => handleDelete(contato.idContato)}
                                                disabled={isLoading}
                                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                            >
                                                Excluir
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {contato.email && (
                                    <div>
                                        <span className="font-medium text-gray-700 ">Email:</span>
                                        <p className="text-gray-600 ">{contato.email}</p>
                                    </div>
                                )}
                                {contato.telefone && (
                                    <div>
                                        <span className="font-medium text-gray-700 ">Telefone:</span>
                                        <p className="text-gray-600 ">{formatPhone(contato.telefone)}</p>
                                    </div>
                                )}
                                {contato.celular && (
                                    <div>
                                        <span className="font-medium text-gray-700 ">Celular:</span>
                                        <p className="text-gray-600 ">{formatPhone(contato.celular)}</p>
                                    </div>
                                )}
                            </div>



                            <div className="mt-3 text-xs text-gray-500 ">
                                Criado em: {formatDate(contato.dataCriacao)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
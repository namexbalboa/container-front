"use client";

import React, { useState, useEffect } from "react";
import { HistoricoAlteracao, Averbacao } from "@/types/api";
import { apiService } from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import { ClockIcon, UserIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, PencilIcon } from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/lib/format-utils";

interface HistoricoAverbacaoProps {
    averbacao: Averbacao;
    isOpen: boolean;
    onClose: () => void;
}

const tipoAlteracaoLabels = {
    CRIACAO: "Criação",
    EDICAO: "Edição",
    APROVACAO: "Aprovação",
    REJEICAO: "Rejeição",
    CANCELAMENTO: "Cancelamento",
    DOCUMENTO_ADICIONADO: "Documento Adicionado",
    DOCUMENTO_REMOVIDO: "Documento Removido"
};

const tipoAlteracaoIcons = {
    CRIACAO: PencilIcon,
    EDICAO: PencilIcon,
    APROVACAO: CheckCircleIcon,
    REJEICAO: XCircleIcon,
    CANCELAMENTO: XCircleIcon,
    DOCUMENTO_ADICIONADO: DocumentTextIcon,
    DOCUMENTO_REMOVIDO: DocumentTextIcon
};

const tipoAlteracaoColors = {
    CRIACAO: "text-blue-600 bg-blue-50",
    EDICAO: "text-yellow-600 bg-yellow-50",
    APROVACAO: "text-green-600 bg-green-50",
    REJEICAO: "text-red-600 bg-red-50",
    CANCELAMENTO: "text-gray-600 bg-gray-50",
    DOCUMENTO_ADICIONADO: "text-purple-600 bg-purple-50",
    DOCUMENTO_REMOVIDO: "text-orange-600 bg-orange-50"
};

export default function HistoricoAverbacao({ averbacao, isOpen, onClose }: HistoricoAverbacaoProps) {
    const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => {
        if (isOpen && averbacao.idAverbacao) {
            fetchHistorico();
        }
    }, [isOpen, averbacao.idAverbacao]);

    const fetchHistorico = async () => {
        try {
            setLoading(true);
            
            // Simulação de dados enquanto o endpoint não está implementado
            const mockHistorico: HistoricoAlteracao[] = [
                {
                    idHistorico: 1,
                    idAverbacao: averbacao.idAverbacao,
                    tipoAlteracao: "CRIACAO",
                    observacoes: "Averbação criada no sistema",
                    usuarioId: 1,
                    usuario: {
                        idUsuario: 1,
                        nomeCompleto: "João Silva",
                        email: "joao@empresa.com",
                        status: "ativo",
                        perfil: {
                            idPerfil: 1,
                            nomePerfil: "Analista",
                            descricao: "Analista de Averbações",
                            nivelAcesso: 2,
                            ativo: true,
                            dataCriacao: "2024-01-01",
                            perfilPermissoes: []
                        }
                    },
                    dataAlteracao: averbacao.dataCriacao
                },
                {
                    idHistorico: 2,
                    idAverbacao: averbacao.idAverbacao,
                    tipoAlteracao: "EDICAO",
                    campoAlterado: "valorMercadoria",
                    valorAnterior: "50000.00",
                    valorNovo: averbacao.valorMercadoria.toString(),
                    observacoes: "Valor da mercadoria atualizado",
                    usuarioId: 1,
                    usuario: {
                        idUsuario: 1,
                        nomeCompleto: "João Silva",
                        email: "joao@empresa.com",
                        status: "ativo",
                        perfil: {
                            idPerfil: 1,
                            nomePerfil: "Analista",
                            descricao: "Analista de Averbações",
                            nivelAcesso: 2,
                            ativo: true,
                            dataCriacao: "2024-01-01",
                            perfilPermissoes: []
                        }
                    },
                    dataAlteracao: averbacao.dataAtualizacao
                }
            ];

            if (averbacao.status === "APROVADO" && averbacao.dataAprovacao) {
                mockHistorico.push({
                    idHistorico: 3,
                    idAverbacao: averbacao.idAverbacao,
                    tipoAlteracao: "APROVACAO",
                    observacoes: averbacao.observacoes || "Averbação aprovada",
                    usuarioId: averbacao.usuarioAprovacao || 2,
                    usuario: {
                        idUsuario: 2,
                        nomeCompleto: "Maria Santos",
                        email: "maria@empresa.com",
                        status: "ativo",
                        perfil: {
                            idPerfil: 1,
                            nomePerfil: "Supervisor",
                            descricao: "Supervisor de Averbações",
                            nivelAcesso: 3,
                            ativo: true,
                            dataCriacao: "2024-01-01",
                            perfilPermissoes: []
                        }
                    },
                    dataAlteracao: averbacao.dataAprovacao
                });
            }

            setHistorico(mockHistorico.sort((a, b) => 
                new Date(b.dataAlteracao).getTime() - new Date(a.dataAlteracao).getTime()
            ));

            // Código para quando o endpoint estiver implementado:
            // const response = await apiService.getHistoricoAverbacao(averbacao.idAverbacao);
            // if (response.success && response.data) {
            //     setHistorico(response.data.data);
            // }
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
            showAlert("error", "Erro ao carregar histórico de alterações");
        } finally {
            setLoading(false);
        }
    };

    const formatarValor = (campo: string, valor: string) => {
        if (campo === "valorMercadoria") {
            return formatCurrency(parseFloat(valor));
        }
        return valor;
    };

    const formatarCampo = (campo: string) => {
        const campos: Record<string, string> = {
            valorMercadoria: "Valor da Mercadoria",
            observacoes: "Observações",
            status: "Status",
            seguradoraId: "Seguradora"
        };
        return campos[campo] || campo;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Histórico de Alterações
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Container: {averbacao.numeroContainer} | 
                                Cliente: {averbacao.cliente?.razaoSocial}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Carregando histórico...</span>
                        </div>
                    ) : historico.length === 0 ? (
                        <div className="text-center py-12">
                            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum histórico encontrado</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Não há registros de alterações para esta averbação.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Timeline */}
                            <div className="flow-root">
                                <ul className="-mb-8">
                                    {historico.map((item, index) => {
                                        const Icon = tipoAlteracaoIcons[item.tipoAlteracao];
                                        const colorClass = tipoAlteracaoColors[item.tipoAlteracao];
                                        
                                        return (
                                            <li key={item.idHistorico}>
                                                <div className="relative pb-8">
                                                    {index !== historico.length - 1 && (
                                                        <span
                                                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${colorClass}`}>
                                                                <Icon className="h-4 w-4" aria-hidden="true" />
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {tipoAlteracaoLabels[item.tipoAlteracao]}
                                                                </p>
                                                                
                                                                {item.campoAlterado && (
                                                                    <div className="mt-2 text-sm text-gray-600">
                                                                        <p className="font-medium">
                                                                            Campo alterado: {formatarCampo(item.campoAlterado)}
                                                                        </p>
                                                                        {item.valorAnterior && (
                                                                            <p className="mt-1">
                                                                                <span className="text-red-600">De:</span> {formatarValor(item.campoAlterado, item.valorAnterior)}
                                                                            </p>
                                                                        )}
                                                                        {item.valorNovo && (
                                                                            <p className="mt-1">
                                                                                <span className="text-green-600">Para:</span> {formatarValor(item.campoAlterado, item.valorNovo)}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                
                                                                {item.observacoes && (
                                                                    <p className="mt-2 text-sm text-gray-600">
                                                                        <span className="font-medium">Observações:</span> {item.observacoes}
                                                                    </p>
                                                                )}
                                                                
                                                                <div className="mt-2 flex items-center text-xs text-gray-500">
                                                                    <UserIcon className="h-4 w-4 mr-1" />
                                                                    <span>{item.usuario?.nomeCompleto || "Sistema"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                <time dateTime={item.dataAlteracao}>
                                                    {formatDate(item.dataAlteracao)}
                                                </time>
                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
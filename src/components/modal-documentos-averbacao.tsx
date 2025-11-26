"use client";

import { useState, useEffect } from "react";
import { DocumentoAverbacao, Averbacao } from "@/types/api";
import { apiService } from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import UploadDocumentos from "./upload-documentos";
import { formatCurrency, formatDate } from "@/lib/format-utils";

interface ModalDocumentosAverbacaoProps {
    isOpen: boolean;
    onClose: () => void;
    averbacao: Averbacao;
}

export default function ModalDocumentosAverbacao({
    isOpen,
    onClose,
    averbacao
}: ModalDocumentosAverbacaoProps) {
    const [documentos, setDocumentos] = useState<DocumentoAverbacao[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showAlert } = useAlert();

    const fetchDocumentos = async () => {
        if (!averbacao?.idAverbacao) return;
        
        setIsLoading(true);
        try {
            const response = await apiService.getDocumentosAverbacao(averbacao.idAverbacao);
            if (response.success && response.data) {
                setDocumentos(response.data);
            } else {
                throw new Error(response.error || "Erro ao carregar documentos");
            }
        } catch (error) {
            console.error("Erro ao carregar documentos:", error);
            showAlert("error", "Erro ao carregar documentos");
            setDocumentos([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && averbacao?.idAverbacao) {
            fetchDocumentos();
        }
    }, [isOpen, averbacao?.idAverbacao]);

    const handleDocumentosChange = (novosDocumentos: DocumentoAverbacao[]) => {
        setDocumentos(novosDocumentos);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "APROVADO":
                return "bg-green-100 text-green-800";
            case "REJEITADO":
                return "bg-red-100 text-red-800";
            case "EM_ANALISE":
                return "bg-yellow-100 text-yellow-800";
            case "PENDENTE":
                return "bg-gray-100 text-gray-800";
            case "CANCELADO":
                return "bg-gray-100 text-gray-600";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const isReadOnly = averbacao?.status === "APROVADO" || averbacao?.status === "REJEITADO";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Documentos da Averbação
                            </h2>
                            <div className="flex items-center space-x-4 mt-2">
                                <p className="text-sm text-gray-600">
                                    Container: <span className="font-medium">{averbacao.numeroContainer}</span>
                                </p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(averbacao.status)}`}>
                                    {averbacao.status}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Carregando documentos...</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Informações da Averbação */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">
                                    Informações da Averbação
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Cliente:</span>
                                        <p className="font-medium">{averbacao.cliente?.razaoSocial || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Seguradora:</span>
                                        <p className="font-medium">{averbacao.seguradora?.nomeSeguradora || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Valor da Mercadoria:</span>
                                        <p className="font-medium">
                                            {formatCurrency(averbacao.valorMercadoria)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Data da Averbação:</span>
                                        <p className="font-medium">
                                            {formatDate(averbacao.dataAverbacao)}
                                        </p>
                                    </div>
                                </div>
                                {averbacao.observacoes && (
                                    <div className="mt-3">
                                        <span className="text-gray-500">Observações:</span>
                                        <p className="font-medium">{averbacao.observacoes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Status de Aprovação */}
                            {isReadOnly && (
                                <div className={`rounded-lg p-4 ${
                                    averbacao.status === "APROVADO" 
                                        ? "bg-green-50 border border-green-200" 
                                        : "bg-red-50 border border-red-200"
                                }`}>
                                    <div className="flex items-center">
                                        <svg 
                                            className={`h-5 w-5 mr-2 ${
                                                averbacao.status === "APROVADO" ? "text-green-600" : "text-red-600"
                                            }`} 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            {averbacao.status === "APROVADO" ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            )}
                                        </svg>
                                        <span className={`text-sm font-medium ${
                                            averbacao.status === "APROVADO" ? "text-green-800" : "text-red-800"
                                        }`}>
                                            Averbação {averbacao.status.toLowerCase()}
                                            {averbacao.dataAprovacao && (
                                                <span className="font-normal">
                                                    {" "}em {formatDate(averbacao.dataAprovacao)}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <p className={`text-sm mt-1 ${
                                        averbacao.status === "APROVADO" ? "text-green-700" : "text-red-700"
                                    }`}>
                                        {averbacao.status === "APROVADO" 
                                            ? "Não é possível adicionar ou remover documentos de averbações aprovadas."
                                            : "Não é possível adicionar ou remover documentos de averbações rejeitadas."
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Upload de Documentos */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Documentos
                                </h3>
                                <UploadDocumentos
                                    averbacaoId={averbacao.idAverbacao}
                                    documentos={documentos}
                                    onDocumentosChange={handleDocumentosChange}
                                    disabled={isReadOnly}
                                />
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
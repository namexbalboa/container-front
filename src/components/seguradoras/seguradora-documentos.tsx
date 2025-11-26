"use client";

import { useState, useRef } from "react";
import { SeguradoraDocumento } from "@/types/api";
import { apiService } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Plus, Trash2, Calendar } from "lucide-react";
import { useAlert } from "@/contexts/AlertContext";
import { formatDate } from "@/lib/format-utils";

interface SeguradoraDocumentosProps {
    seguradoraId: number;
    documentos: SeguradoraDocumento[];
    onUpdate: () => void;
}

export default function SeguradoraDocumentos({ seguradoraId, documentos, onUpdate }: SeguradoraDocumentosProps) {
    const { hasPermission } = usePermissions();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !hasPermission("SEGURADORAS", "UPDATE")) return;

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // Simular progresso de upload
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            await apiService.uploadSeguradoraDocumento(seguradoraId, file, "OUTROS");
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            setTimeout(() => {
                setUploadProgress(0);
                setIsUploading(false);
                onUpdate();
            }, 500);

        } catch (error) {
            console.error("Erro ao fazer upload:", error);
            setIsUploading(false);
            setUploadProgress(0);
        }

        // Limpar input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDownload = async (documentoId: number, nomeArquivo: string) => {
        try {
            setIsLoading(true);
            const blob = await apiService.downloadSeguradoraDocumento(seguradoraId, documentoId);
            
            // Criar URL temporária e fazer download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = nomeArquivo;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Erro ao baixar documento:", error);
        } finally {
            setIsLoading(false);
        }
    };



    const handleDelete = async (documentoId: number) => {
        if (!hasPermission("SEGURADORAS", "DELETE")) return;
        if (!confirm("Tem certeza que deseja excluir este documento?")) return;

        try {
            setIsLoading(true);
            await apiService.deleteSeguradoraDocumento(seguradoraId, documentoId);
            onUpdate();
        } catch (error) {
            console.error("Erro ao excluir documento:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (tipo: string) => {
        switch (tipo.toLowerCase()) {
            case "pdf":
                return "📄";
            case "doc":
            case "docx":
                return "📝";
            case "xls":
            case "xlsx":
                return "📊";
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
                return "🖼️";
            default:
                return "📎";
        }
    };



    return (
        <div className="bg-white  rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 ">
                    Documentos ({documentos.length})
                </h3>
                {hasPermission("SEGURADORAS", "UPDATE") && (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                            disabled={isUploading}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? "Enviando..." : "Adicionar Documento"}
                        </button>
                    </div>
                )}
            </div>

            {isUploading && (
                <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">
                            Enviando documento...
                        </span>
                        <span className="text-sm text-blue-600">
                            {uploadProgress}%
                        </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {documentos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 ">
                        Nenhum documento cadastrado
                    </div>
                ) : (
                    documentos.map((documento) => (
                        <div
                            key={documento.idDocumento}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow border-gray-200 "
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{getFileIcon(documento.tipoDocumento)}</span>
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 ">
                                            {documento.nomeOriginal}
                                        </h4>
                                        <p className="text-sm text-gray-600 ">
                                            {documento.tipoDocumento} • {formatFileSize(documento.tamanho)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {documento.observacoes && (
                                <p className="text-sm text-gray-600  mb-3">
                                    {documento.observacoes}
                                </p>
                            )}

                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 ">
                                <div className="text-xs text-gray-500 ">
                                    Enviado em: {formatDate(documento.dataCriacao)}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleDownload(documento.idDocumento, documento.nomeArquivo)}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        Download
                                    </button>
                                    {hasPermission("SEGURADORAS", "DELETE") && (
                                        <button
                                            onClick={() => handleDelete(documento.idDocumento)}
                                            disabled={isLoading}
                                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        >
                                            Excluir
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 p-4 bg-gray-50  rounded-lg">
                <h4 className="text-sm font-medium text-gray-900  mb-2">
                    Tipos de arquivo aceitos:
                </h4>
                <p className="text-sm text-gray-600 ">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, GIF (máximo 10MB)
                </p>
            </div>
        </div>
    );
}
"use client";

import { useState, useRef } from "react";
import { DocumentoAverbacao } from "@/types/api";
import { apiService } from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";

interface UploadDocumentosProps {
    averbacaoId: number;
    documentos: DocumentoAverbacao[];
    onDocumentosChange: (documentos: DocumentoAverbacao[]) => void;
    disabled?: boolean;
}

const TIPOS_ARQUIVO_ACEITOS = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

const TAMANHO_MAXIMO = 10 * 1024 * 1024; // 10MB

export default function UploadDocumentos({ 
    averbacaoId, 
    documentos, 
    onDocumentosChange, 
    disabled = false 
}: UploadDocumentosProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showAlert } = useAlert();

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const validateFile = (file: File): string | null => {
        if (!TIPOS_ARQUIVO_ACEITOS.includes(file.type)) {
            return "Tipo de arquivo não suportado. Use PDF, imagens (JPG, PNG) ou documentos do Office.";
        }
        
        if (file.size > TAMANHO_MAXIMO) {
            return `Arquivo muito grande. Tamanho máximo: ${formatFileSize(TAMANHO_MAXIMO)}.`;
        }
        
        return null;
    };

    const handleFileUpload = async (files: FileList) => {
        if (disabled || files.length === 0) return;

        setIsUploading(true);
        
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const validationError = validateFile(file);
                if (validationError) {
                    showAlert("error", `${file.name}: ${validationError}`);
                    return null;
                }

                try {
                    const response = await apiService.uploadDocumentoAverbacao(averbacaoId, file);
                    if (response.success && response.data) {
                        return response.data;
                    } else {
                        throw new Error(response.error || "Erro no upload");
                    }
                } catch (error) {
                    console.error(`Erro ao fazer upload de ${file.name}:`, error);
                    showAlert("error", `Erro ao fazer upload de ${file.name}`);
                    return null;
                }
            });

            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter(Boolean) as DocumentoAverbacao[];
            
            if (successfulUploads.length > 0) {
                onDocumentosChange([...documentos, ...successfulUploads]);
                showAlert("success", `${successfulUploads.length} documento(s) enviado(s) com sucesso!`);
            }
        } catch (error) {
            console.error("Erro no upload:", error);
            showAlert("error", "Erro ao fazer upload dos documentos");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDeleteDocument = async (documentoId: number) => {
        if (disabled || !confirm("Tem certeza que deseja excluir este documento?")) {
            return;
        }

        try {
            const response = await apiService.deleteDocumentoAverbacao(averbacaoId, documentoId);
            if (response.success) {
                onDocumentosChange(documentos.filter(doc => doc.idDocumento !== documentoId));
                showAlert("success", "Documento excluído com sucesso!");
            } else {
                throw new Error(response.error || "Erro ao excluir documento");
            }
        } catch (error) {
            console.error("Erro ao excluir documento:", error);
            showAlert("error", "Erro ao excluir documento");
        }
    };

    const handleDownloadDocument = async (documentoId: number, nomeOriginal: string) => {
        try {
            const blob = await apiService.downloadDocumentoAverbacao(averbacaoId, documentoId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = nomeOriginal;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao baixar documento:", error);
            showAlert("error", "Erro ao baixar documento");
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (disabled) return;
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFileUpload(e.target.files);
        }
    };

    return (
        <div className="space-y-4">
            {/* Área de Upload */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                        ? "border-blue-500 bg-blue-50"
                        : disabled
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-300 hover:border-gray-400"
                } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={disabled}
                />
                
                <div className="space-y-2">
                    <svg
                        className={`mx-auto h-12 w-12 ${disabled ? "text-gray-300" : "text-gray-400"}`}
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div className="text-sm">
                        <span className={`font-medium ${disabled ? "text-gray-400" : "text-blue-600"}`}>
                            {isUploading ? "Enviando..." : "Clique para enviar"}
                        </span>
                        {!disabled && (
                            <span className="text-gray-500"> ou arraste e solte</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        PDF, JPG, PNG, DOC, XLS até {formatFileSize(TAMANHO_MAXIMO)}
                    </p>
                </div>
            </div>

            {/* Lista de Documentos */}
            {documentos.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                        Documentos ({documentos.length})
                    </h4>
                    <div className="space-y-2">
                        {documentos.map((documento) => (
                            <div
                                key={documento.idDocumento}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-8 w-8 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {documento.nomeOriginal}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(documento.tamanho)} • {documento.tipoArquivo}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleDownloadDocument(documento.idDocumento, documento.nomeOriginal)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                        title="Baixar documento"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </button>
                                    {!disabled && (
                                        <button
                                            onClick={() => handleDeleteDocument(documento.idDocumento)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                            title="Excluir documento"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect } from "react";
import { Seguradora } from "@/types/api";

interface SeguradoraModalProps {
    isOpen: boolean;
    onClose: () => void;
    seguradora: Seguradora | null;
    title: string;
    children: React.ReactNode;
}

export default function SeguradoraModal({ 
    isOpen, 
    onClose, 
    seguradora, 
    title, 
    children 
}: SeguradoraModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const formatCnpj = (cnpj: string) => {
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ativa":
                return "bg-green-100 text-green-800 ";
            case "inativa":
                return "bg-red-100 text-red-800 ";
            case "suspensa":
                return "bg-yellow-100 text-yellow-800 ";
            default:
                return "bg-gray-100 text-gray-800 ";
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-4xl bg-white  rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 ">
                        <div className="flex items-center space-x-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 ">
                                    {title}
                                </h2>
                                {seguradora && (
                                    <div className="flex items-center space-x-3 mt-1">
                                        <p className="text-sm text-gray-600 ">
                                            {seguradora.nomeSeguradora}
                                        </p>
                                        <span className="text-gray-400">•</span>
                                        <p className="text-sm text-gray-600 ">
                                            {formatCnpj(seguradora.cnpj)}
                                        </p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seguradora.status)}`}>
                                            {seguradora.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600  transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end p-6 border-t border-gray-200 ">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

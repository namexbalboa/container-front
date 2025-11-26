"use strict";

import React, { useState, useRef, useEffect } from "react";
import {
    MagnifyingGlassIcon,
    CommandLineIcon,
    ClockIcon,
    ArrowRightIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { useSearch } from "@/hooks/use-search";
import { SearchResult, SearchHistorico } from "@/types/api";
import { formatRelativeTime } from "@/lib/format-utils";

interface SearchQuickProps {
    onOpenAdvanced: (term?: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchQuick({ 
    onOpenAdvanced, 
    placeholder = "Buscar...",
    className = ""
}: SearchQuickProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const {
        resultados,
        loading,
        sugestoes,
        historico,
        buscarRapido,
        obterSugestoes
    } = useSearch();

    // Fechar dropdown quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Buscar sugestões quando o termo mudar
    useEffect(() => {
        if (searchTerm.trim().length >= 2) {
            const timer = setTimeout(() => {
                obterSugestoes(searchTerm);
                buscarRapido(searchTerm);
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [searchTerm, obterSugestoes, buscarRapido]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSelectedIndex(-1);
        
        if (value.trim().length >= 1) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        const items = [
            ...(sugestoes || []).slice(0, 3),
            ...(resultados || []).slice(0, 5),
            ...(historico || []).slice(0, 3)
        ];

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
                break;
                
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
                break;
                
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    handleSelectItem(items[selectedIndex]);
                } else if (searchTerm.trim()) {
                    onOpenAdvanced(searchTerm);
                    setIsOpen(false);
                }
                break;
                
            case "Escape":
                setIsOpen(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    const handleSelectItem = (item: any) => {
        if (item.tipo === "sugestao") {
            setSearchTerm(item.texto);
            setIsOpen(false);
            onOpenAdvanced(item.texto);
        } else if (item.tipo === "resultado") {
            // Navegar para o resultado
            if (item.url) {
                window.location.href = item.url;
            }
            setIsOpen(false);
        } else if (item.tipo === "historico") {
                    setSearchTerm(item.termo || "");
                    setIsOpen(false);
                    onOpenAdvanced(item.termo);
        }
    };

    const handleFocus = () => {
        if (searchTerm.trim().length >= 1 || (historico && historico.length > 0)) {
            setIsOpen(true);
        }
    };

    const getItemIcon = (item: any) => {
        if (item.tipo === "sugestao") {
            return <MagnifyingGlassIcon className="h-4 w-4" />;
        } else if (item.tipo === "historico") {
            return <ClockIcon className="h-4 w-4" />;
        } else {
            return item.icone ? (
                <div className={`h-4 w-4 rounded ${item.cor || "bg-gray-400"} flex items-center justify-center text-white text-xs`}>
                    {item.icone}
                </div>
            ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
            );
        }
    };

    const formatDate = (dateString: string) => {
        return formatRelativeTime(dateString);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input */}
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300  rounded-lg bg-white  text-gray-900  placeholder-gray-500  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Atalho Cmd+K */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-gray-400">
                    <CommandLineIcon className="h-3 w-3" />
                    <span>K</span>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white  border border-gray-200  rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                            <p className="text-sm text-gray-500  mt-2">Buscando...</p>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* Sugestões */}
                            {sugestoes.length > 0 && (
                                <div className="p-2">
                                    <div className="text-xs font-medium text-gray-500  px-2 py-1 mb-1">
                                        Sugestões
                                    </div>
                                    {sugestoes.slice(0, 3).map((sugestao, index) => (
                                        <button
                                            key={`sugestao-${index}`}
                                            onClick={() => handleSelectItem({ termo: sugestao, tipo: "sugestao" })}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                                                selectedIndex === index
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                        >
                                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{sugestao}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Resultados */}
                            {resultados.length > 0 && (
                                <div className="p-2 border-t border-gray-100 ">
                                    <div className="text-xs font-medium text-gray-500  px-2 py-1 mb-1">
                                        Resultados
                                    </div>
                                    {resultados.slice(0, 5).map((resultado, index) => {
                                        const itemIndex = sugestoes.length + index;
                                        return (
                                            <button
                                                key={resultado.id}
                                                onClick={() => handleSelectItem({ ...resultado, tipo: "resultado" })}
                                                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                                                    selectedIndex === itemIndex
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "hover:bg-gray-50 text-gray-700"
                                                }`}
                                            >
                                                {getItemIcon(resultado)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                        {resultado.titulo}
                                                    </div>
                                                    {resultado.descricao && (
                                                        <div className="text-xs text-gray-500  truncate">
                                                            {resultado.descricao}
                                                        </div>
                                                    )}
                                                </div>
                                                <ArrowRightIcon className="h-3 w-3 text-gray-400" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Histórico */}
                            {historico && historico.length > 0 && searchTerm.trim().length === 0 && (
                                <div className="p-2 border-t border-gray-100">
                                    <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                                        Buscas Recentes
                                    </div>
                                    {historico.slice(0, 3).map((item, index) => {
                                        const itemIndex = (sugestoes?.length || 0) + (resultados?.length || 0) + index;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelectItem({ ...item, tipo: "historico" })}
                                                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                                                    selectedIndex === itemIndex
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "hover:bg-gray-50 text-gray-700"
                                                }`}
                                            >
                                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm truncate">
                                                        {item.termo || "Busca sem termo"}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(item.timestamp)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Busca Avançada */}
                            {searchTerm.trim().length > 0 && (
                                <div className="p-2 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            onOpenAdvanced(searchTerm);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 text-blue-600"
                                    >
                                        <MagnifyingGlassIcon className="h-4 w-4" />
                                        <span className="text-sm">
                                            Busca avançada para "{searchTerm}"
                                        </span>
                                        <ArrowRightIcon className="h-3 w-3 ml-auto" />
                                    </button>
                                </div>
                            )}

                            {/* Sem resultados */}
                            {!loading && searchTerm.trim().length >= 2 && 
                             sugestoes.length === 0 && resultados.length === 0 && (
                                <div className="p-4 text-center">
                                    <p className="text-sm text-gray-500">
                                        Nenhum resultado encontrado
                                    </p>
                                    <button
                                        onClick={() => {
                                            onOpenAdvanced(searchTerm);
                                            setIsOpen(false);
                                        }}
                                        className="mt-2 text-sm text-blue-600 hover:underline"
                                    >
                                        Tentar busca avançada
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
"use client";

/**
 * Utilitários de formatação para evitar problemas de hidratação
 * Garante que a formatação seja consistente entre servidor e cliente
 */

// Hook para verificar se estamos no cliente
import React, { useEffect, useState } from "react";

export function useIsClient() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
}

// Formatação segura de data
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    if (typeof window === "undefined") {
        // No servidor, retorna formato básico
        const d = new Date(date);
        return d.toISOString().split("T")[0];
    }

    // No cliente, usa formatação completa
    const d = new Date(date);
    const defaultOptions: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    };

    return d.toLocaleDateString("pt-BR", { ...defaultOptions, ...options });
}

// Formatação segura de data e hora
export function formatDateTime(date: Date | string): string {
    if (typeof window === "undefined") {
        // No servidor, retorna formato básico
        const d = new Date(date);
        return d.toISOString().replace("T", " ").split(".")[0];
    }

    // No cliente, usa formatação completa
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Formatação segura de hora
export function formatTime(date: Date | string): string {
    if (typeof window === "undefined") {
        // No servidor, retorna formato básico
        const d = new Date(date);
        return d.toISOString().split("T")[1].split(".")[0].substring(0, 8);
    }

    // No cliente, usa formatação completa
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

// Formatação segura de moeda
export function formatCurrency(value: number): string {
    if (typeof window === "undefined") {
        // No servidor, retorna formato básico
        return `R$ ${value.toFixed(2).replace(".", ",")}`;
    }

    // No cliente, usa formatação completa
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(value);
}

// Formatação segura de números
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    if (typeof window === "undefined") {
        // No servidor, retorna formato básico
        return value.toString();
    }

    // No cliente, usa formatação completa
    return new Intl.NumberFormat("pt-BR", options).format(value);
}

// Formatação de tempo relativo (ex: "2h atrás")
export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
        return "Agora há pouco";
    } else if (diffInHours < 24) {
        return `${diffInHours}h atrás`;
    } else if (diffInDays === 1) {
        return "Ontem";
    } else if (diffInDays < 7) {
        return `${diffInDays} dias atrás`;
    } else {
        return formatDate(targetDate);
    }
}

// Componente wrapper para formatação segura
export function SafeFormat({ 
    children, 
    fallback = "..." 
}: { 
    children: () => string; 
    fallback?: string; 
}) {
    const isClient = useIsClient();
    
    if (!isClient) {
        return <span>{fallback}</span>;
    }
    
    return <span>{children()}</span>;
}
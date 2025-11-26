"use strict";

import React from "react";
import { DashboardMetrica } from "@/types/api";
import { formatNumber } from "@/lib/format-utils";
import {
    DocumentTextIcon,
    ClockIcon,
    CubeIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    MinusIcon,
    UserGroupIcon,
    BuildingOfficeIcon
} from "@heroicons/react/24/outline";

interface MetricaCardProps {
    metrica: DashboardMetrica;
    className?: string;
}

const iconMap = {
    DocumentTextIcon,
    ClockIcon,
    CubeIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    UserGroupIcon,
    BuildingOfficeIcon
};

const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200"
};

export function MetricaCard({ metrica, className = "" }: MetricaCardProps) {
    const IconComponent = iconMap[metrica.icone as keyof typeof iconMap] || DocumentTextIcon;
    const colorClass = colorMap[metrica.cor as keyof typeof colorMap] || colorMap.gray;

    const getTendenciaIcon = () => {
        if (!metrica.tendencia) return null;
        
        switch (metrica.tendencia.tipo) {
            case "up":
                return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
            case "down":
                return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
            case "stable":
                return <MinusIcon className="h-4 w-4 text-gray-500" />;
            default:
                return null;
        }
    };

    const getTendenciaColor = () => {
        if (!metrica.tendencia) return "text-gray-500";
        
        switch (metrica.tendencia.tipo) {
            case "up":
                return "text-green-600";
            case "down":
                return "text-red-600";
            case "stable":
                return "text-gray-600";
            default:
                return "text-gray-500";
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg border ${colorClass}`}>
                            <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">{metrica.nome}</p>
                            <p className="text-2xl font-bold text-gray-900">{metrica.valor}</p>
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">{metrica.descricao}</p>
                    
                    {metrica.tendencia && (
                        <div className="flex items-center space-x-1 mt-3">
                            {getTendenciaIcon()}
                            <span className={`text-sm font-medium ${getTendenciaColor()}`}>
                                {metrica.tendencia.valor > 0 ? "+" : ""}{metrica.tendencia.valor}%
                            </span>
                            <span className="text-xs text-gray-500">{metrica.tendencia.periodo}</span>
                        </div>
                    )}
                    
                    {metrica.meta && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Meta: R$ {formatNumber(metrica.meta.valor)}</span>
                                <span>{metrica.meta.progresso.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(metrica.meta.progresso, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
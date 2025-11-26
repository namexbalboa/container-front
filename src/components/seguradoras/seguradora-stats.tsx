"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";
import { formatCurrency } from "@/lib/format-utils";
import { SeguradoraStats as StatsType } from "@/types/api";

interface SeguradoraStatsProps {
    className?: string;
}

export default function SeguradoraStats({ className = "" }: SeguradoraStatsProps) {
    const [stats, setStats] = useState<StatsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await apiService.getSeguradoraStats();
                if (response.data) {
                    setStats(response.data);
                }
            } catch (err) {
                console.error("Erro ao carregar estatísticas:", err);
                setError("Erro ao carregar estatísticas");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white  rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200  rounded mb-2"></div>
                        <div className="h-8 bg-gray-200  rounded mb-2"></div>
                        <div className="h-3 bg-gray-200  rounded w-2/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
                <p className="text-red-600 text-sm">
                    {error || "Erro ao carregar estatísticas"}
                </p>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total de Seguradoras",
            value: stats.totalSeguradoras,
            subtitle: `${stats.seguradorasAtivas} ativas`,
            color: "blue",
            icon: "🏢"
        },
        {
            title: "Seguradoras Ativas",
            value: stats.seguradorasAtivas,
            subtitle: `${((stats.seguradorasAtivas / stats.totalSeguradoras) * 100).toFixed(1)}% do total`,
            color: "green",
            icon: "✅"
        },
        {
            title: "Total Averbado",
            value: formatCurrency(stats.valorTotalAverbado),
            subtitle: `${stats.totalAverbacoes} averbações`,
            color: "purple",
            icon: "💰"
        },
        {
            title: "Tempo Médio",
            value: `${stats.mediaTempoAprovacao}h`,
            subtitle: "aprovação",
            color: "orange",
            icon: "⏱️"
        }
    ];

    const getColorClasses = (color: string) => {
        const colors = {
            blue: "bg-blue-50 border-blue-200 text-blue-600",
            green: "bg-green-50 border-green-200 text-green-600",
            purple: "bg-purple-50 border-purple-200 text-purple-600",
            orange: "bg-orange-50 border-orange-200 text-orange-600"
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
            {statCards.map((card, index) => (
                <div
                    key={index}
                    className={`bg-white  rounded-lg shadow-md p-6 border-l-4 ${getColorClasses(card.color)}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 ">
                            {card.title}
                        </h3>
                        <span className="text-2xl">{card.icon}</span>
                    </div>
                    <div className="mb-2">
                        <p className="text-2xl font-bold text-gray-900 ">
                            {card.value}
                        </p>
                    </div>
                    <p className="text-sm text-gray-500 ">
                        {card.subtitle}
                    </p>
                </div>
            ))}
        </div>
    );
}
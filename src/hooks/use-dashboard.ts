"use client";
"use strict";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardData, DashboardStats, DashboardMetrica, DashboardGrafico, DashboardOperation, DashboardAction } from "@/types/api";
import { apiService } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format-utils";

export function useDashboard() {
    const { data: session, status } = useSession();
    const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Debug: Log session whenever it changes
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            console.log("[useDashboard] Session changed:", {
                status,
                hasSession: !!session,
                hasUser: !!session?.user,
                userId: session?.user?.id,
                hasToken: !!(session as any)?.token,
                hasAccessToken: !!(session as any)?.accessToken,
            });
        }
    }, [session, status]);

    const fetchDashboardData = useCallback(async (showLoading = true) => {
        // Wait for session to be ready and authenticated
        if (status !== "authenticated" || !session?.user?.id) {
            if (process.env.NODE_ENV === "development") {
                console.log("[useDashboard] Skipping fetch - not authenticated", { status, hasUser: !!session?.user?.id });
            }
            return;
        }

        if (process.env.NODE_ENV === "development") {
            console.log("[useDashboard] Starting dashboard fetch...");
        }

        try {
            if (showLoading) setIsLoading(true);
            else setIsRefreshing(true);

            const response = await apiService.getDashboardStats();

            if (response.success && response.data) {
                setDashboardData(response.data);
                setLastUpdate(new Date());
            }
        } catch (error: any) {
            console.error("Erro ao buscar dados do dashboard:", error);

            // Don't show error if user is being logged out
            if (error?.message?.includes("Sessão expirada") ||
                error?.message?.includes("Usuário não encontrado")) {
                // User is being logged out automatically, just return
                return;
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [session?.user?.id, status]);

    const refreshData = useCallback(() => {
        fetchDashboardData(false);
    }, [fetchDashboardData]);

    // Busca inicial - só executa quando sessão estiver autenticada
    useEffect(() => {
        if (status === "authenticated" && session?.user?.id) {
            fetchDashboardData(true);
        } else if (status === "unauthenticated") {
            // Se não autenticado, limpa o loading
            setIsLoading(false);
        }
    }, [status, session?.user?.id, fetchDashboardData]);

    // Auto-refresh a cada 30 segundos - só quando autenticado
    useEffect(() => {
        if (status !== "authenticated" || !session?.user?.id) return;

        const interval = setInterval(() => {
            refreshData();
        }, 30000);

        return () => clearInterval(interval);
    }, [status, session?.user?.id, refreshData]);

    // Função para gerar métricas mock (temporário até a API estar pronta)
    const generateMockMetricas = useCallback((stats: DashboardStats): DashboardMetrica[] => {
        return [
            {
                nome: "Total de Averbações",
                valor: stats.resumo.totalAverbacoes,
                icone: "DocumentTextIcon",
                cor: "blue",
                descricao: "Total de averbações no sistema",
                tendencia: {
                    valor: 12.5,
                    tipo: "up",
                    periodo: "vs mês anterior"
                }
            },
            {
                nome: "Pendentes de Aprovação",
                valor: stats.resumo.averbacoesPendentes,
                icone: "ClockIcon",
                cor: "yellow",
                descricao: "Averbações aguardando aprovação",
                tendencia: {
                    valor: 3.2,
                    tipo: "down",
                    periodo: "vs semana anterior"
                }
            },
            {
                nome: "Containers Ativos",
                valor: stats.resumo.containersAtivos,
                icone: "CubeIcon",
                cor: "green",
                descricao: "Containers em operação",
                tendencia: {
                    valor: 8.1,
                    tipo: "up",
                    periodo: "vs mês anterior"
                }
            },
            {
                nome: "Valor Total Averbado",
                valor: formatCurrency(5000000),
                icone: "CurrencyDollarIcon",
                cor: "purple",
                descricao: "Valor total das averbações",
                tendencia: {
                    valor: 15.7,
                    tipo: "up",
                    periodo: "vs mês anterior"
                },
                meta: {
                    valor: 10000000,
                    progresso: (5000000 / 10000000) * 100
                }
            },
            {
                nome: "Taxa de Aprovação",
                valor: `${(85.5).toFixed(1)}%`,
                icone: "CheckCircleIcon",
                cor: "green",
                descricao: "Percentual de averbações aprovadas",
                tendencia: {
                    valor: 2.3,
                    tipo: "up",
                    periodo: "vs mês anterior"
                }
            },
            {
                nome: "Tempo Médio de Aprovação",
                valor: `${(stats.performance?.tempoMedioProcessamento || 24).toFixed(1)}h`,
                icone: "ClockIcon",
                cor: "orange",
                descricao: "Tempo médio para aprovação",
                tendencia: {
                    valor: 5.4,
                    tipo: "down",
                    periodo: "vs mês anterior"
                }
            }
        ];
    }, []);

    // Função para gerar gráficos mock (temporário até a API estar pronta)
    const generateMockGraficos = useCallback((): DashboardGrafico[] => {
        return [
            {
                tipo: "line",
                titulo: "Averbações por Dia",
                periodo: "7d",
                dados: [
                    { label: "Seg", valor: 12, data: "2024-01-15" },
                    { label: "Ter", valor: 19, data: "2024-01-16" },
                    { label: "Qua", valor: 15, data: "2024-01-17" },
                    { label: "Qui", valor: 22, data: "2024-01-18" },
                    { label: "Sex", valor: 18, data: "2024-01-19" },
                    { label: "Sáb", valor: 8, data: "2024-01-20" },
                    { label: "Dom", valor: 5, data: "2024-01-21" }
                ]
            },
            {
                tipo: "bar",
                titulo: "Status das Averbações",
                periodo: "30d",
                dados: [
                    { label: "Aprovadas", valor: 145, cor: "#10b981" },
                    { label: "Pendentes", valor: 23, cor: "#f59e0b" },
                    { label: "Rejeitadas", valor: 8, cor: "#ef4444" },
                    { label: "Em Análise", valor: 12, cor: "#3b82f6" }
                ]
            },
            {
                tipo: "pie",
                titulo: "Distribuição por Cliente",
                periodo: "30d",
                dados: [
                    { label: "Cliente A", valor: 35, cor: "#3b82f6" },
                    { label: "Cliente B", valor: 28, cor: "#10b981" },
                    { label: "Cliente C", valor: 20, cor: "#f59e0b" },
                    { label: "Cliente D", valor: 12, cor: "#ef4444" },
                    { label: "Outros", valor: 5, cor: "#6b7280" }
                ]
            }
        ];
    }, []);

    // Função para gerar operações mock (temporário até a API estar pronta)
    const generateMockOperations = useCallback((): DashboardOperation[] => {
        return [
            {
                id: 1,
                tipo: "container",
                descricao: "Container ABCD1234 registrado",
                usuario: "João Silva",
                data: "2024-01-21 14:30",
                status: "sucesso"
            },
            {
                id: 2,
                tipo: "averbacao",
                descricao: "Averbação #2024001 criada",
                usuario: "Maria Santos",
                data: "2024-01-21 13:45",
                status: "sucesso"
            },
            {
                id: 3,
                tipo: "cliente",
                descricao: "Cliente Transportes XYZ atualizado",
                usuario: "Pedro Costa",
                data: "2024-01-21 12:15",
                status: "sucesso"
            },
            {
                id: 4,
                tipo: "usuario",
                descricao: "Novo usuário cadastrado",
                usuario: "Admin",
                data: "2024-01-21 11:20",
                status: "pendente"
            },
            {
                id: 5,
                tipo: "averbacao",
                descricao: "Erro ao processar averbação #2024002",
                usuario: "Sistema",
                data: "2024-01-21 10:30",
                status: "erro"
            }
        ];
    }, []);

    // Função para gerar ações mock (temporário até a API estar pronta)
    const generateMockActions = useCallback((): DashboardAction[] => {
        return [
            {
                id: 1,
                tipo: "aprovacao",
                titulo: "Aprovar Averbação",
                descricao: "3 averbações aguardando aprovação",
                prioridade: "alta",
                data: "2024-01-21",
                link: "/averbacoes?status=pendente"
            },
            {
                id: 2,
                tipo: "revisao",
                titulo: "Revisar Containers",
                descricao: "5 containers precisam de revisão",
                prioridade: "media",
                data: "2024-01-21",
                link: "/containers?status=revisao"
            },
            {
                id: 3,
                tipo: "vencimento",
                titulo: "Documentos Vencendo",
                descricao: "2 documentos vencem em 7 dias",
                prioridade: "alta",
                data: "2024-01-28",
                link: "/documentos?vencimento=7d"
            },
            {
                id: 4,
                tipo: "alerta",
                titulo: "Sistema de Backup",
                descricao: "Backup automático executado com sucesso",
                prioridade: "baixa",
                data: "2024-01-21",
                link: "/sistema/logs"
            }
        ];
    }, []);

    // Processar dados do dashboard
    const processedData = dashboardData ? {
        stats: dashboardData,
        metricas: generateMockMetricas(dashboardData),
        graficos: generateMockGraficos(),
        operations: generateMockOperations(),
        actions: generateMockActions(),
        ultimaAtualizacao: new Date().toISOString()
    } : null;

    return {
        dashboardData: processedData,
        isLoading,
        isRefreshing,
        lastUpdate,
        refreshData,
        refetch: () => fetchDashboardData(true)
    };
}
"use client";

import React from "react";
import { useDashboard } from "@/hooks/use-dashboard";
import { MetricaCard } from "@/components/dashboard/metrica-card";
import { GraficoCard } from "@/components/dashboard/grafico-card";
import { SafeFormat, formatTime } from "@/lib/format-utils";
import {
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  TruckIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const { 
    dashboardData, 
    isLoading, 
    isRefreshing, 
    lastUpdate, 
    refreshData 
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Métricas Skeleton */}
          <div className="mb-8">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Gráficos Skeleton */}
          <div className="mb-8">
            <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                  <div className="h-64 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erro ao carregar dados do dashboard</p>
          <button 
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return "Nunca";
    return formatTime(lastUpdate);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Visão geral do sistema em tempo real</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Última atualização: <SafeFormat fallback="Carregando...">{formatLastUpdate}</SafeFormat>
              </div>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Métricas Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.metricas.map((metrica, index) => (
              <MetricaCard key={index} metrica={metrica} />
            ))}
          </div>
        </div>

        {/* Gráficos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Análises</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData.graficos.map((grafico, index) => (
              <GraficoCard key={index} grafico={grafico} />
            ))}
          </div>
        </div>

        {/* Operações Recentes */}
        {dashboardData.operations && dashboardData.operations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Operações Recentes</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.operations.slice(0, 5).map((operation, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TruckIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{operation.descricao}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {operation.usuario}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {operation.tipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            operation.status === "sucesso" 
                              ? "bg-green-100 text-green-800"
                              : operation.status === "erro"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {operation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {operation.data}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Ações Rápidas */}
        {dashboardData.actions && dashboardData.actions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.actions.map((action, index) => {
                const getIcon = () => {
                  switch (action.tipo) {
                    case "aprovacao":
                      return DocumentTextIcon;
                    case "revisao":
                      return TruckIcon;
                    case "vencimento":
                      return UserGroupIcon;
                    case "alerta":
                      return BuildingOfficeIcon;
                    default:
                      return DocumentTextIcon;
                  }
                };
                
                const IconComponent = getIcon();
                
                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        action.prioridade === "alta" ? "bg-red-50 text-red-600" :
                        action.prioridade === "media" ? "bg-yellow-50 text-yellow-600" :
                        action.prioridade === "baixa" ? "bg-green-50 text-green-600" :
                        "bg-gray-50 text-gray-600"
                      }`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{action.titulo}</p>
                        <p className="text-sm text-gray-500">{action.descricao}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
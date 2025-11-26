"use strict";

import React from "react";
import { DashboardGrafico } from "@/types/api";

interface GraficoCardProps {
    grafico: DashboardGrafico;
    className?: string;
}

export function GraficoCard({ grafico, className = "" }: GraficoCardProps) {
    const renderLineChart = () => {
        const maxValue = Math.max(...grafico.dados.map(d => d.valor));
        const minValue = Math.min(...grafico.dados.map(d => d.valor));
        const range = maxValue - minValue || 1;

        return (
            <div className="h-64 flex items-end justify-between space-x-2 px-4 pb-4">
                {grafico.dados.map((item, index) => {
                    const height = ((item.valor - minValue) / range) * 200 + 20;
                    return (
                        <div key={index} className="flex flex-col items-center space-y-2">
                            <div className="relative">
                                <div 
                                    className="w-8 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                                    style={{ height: `${height}px` }}
                                />
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                                    {item.valor}
                                </div>
                            </div>
                            <span className="text-xs text-gray-600">{item.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderBarChart = () => {
        const maxValue = Math.max(...grafico.dados.map(d => d.valor));

        return (
            <div className="h-64 flex items-end justify-between space-x-3 px-4 pb-4">
                {grafico.dados.map((item, index) => {
                    const height = (item.valor / maxValue) * 200;
                    return (
                        <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                            <div className="relative w-full">
                                <div 
                                    className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                                    style={{ 
                                        height: `${height}px`,
                                        backgroundColor: item.cor || "#3b82f6"
                                    }}
                                />
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                                    {item.valor}
                                </div>
                            </div>
                            <span className="text-xs text-gray-600 text-center">{item.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPieChart = () => {
        const total = grafico.dados.reduce((sum, item) => sum + item.valor, 0);
        let currentAngle = 0;

        return (
            <div className="h-64 flex items-center justify-center">
                <div className="relative">
                    <svg width="200" height="200" className="transform -rotate-90">
                        {grafico.dados.map((item, index) => {
                            const percentage = (item.valor / total) * 100;
                            const angle = (item.valor / total) * 360;
                            const x1 = 100 + 80 * Math.cos((currentAngle * Math.PI) / 180);
                            const y1 = 100 + 80 * Math.sin((currentAngle * Math.PI) / 180);
                            const x2 = 100 + 80 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                            const y2 = 100 + 80 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                            
                            const largeArcFlag = angle > 180 ? 1 : 0;
                            const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                            
                            currentAngle += angle;
                            
                            return (
                                <path
                                    key={index}
                                    d={pathData}
                                    fill={item.cor || `hsl(${index * 60}, 70%, 50%)`}
                                    className="hover:opacity-80 transition-opacity"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{total}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                    </div>
                </div>
                <div className="ml-6 space-y-2">
                    {grafico.dados.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.cor || `hsl(${index * 60}, 70%, 50%)` }}
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                            <span className="text-sm font-medium text-gray-900">{item.valor}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderChart = () => {
        switch (grafico.tipo) {
            case "line":
                return renderLineChart();
            case "bar":
                return renderBarChart();
            case "pie":
                return renderPieChart();
            case "area":
                return renderLineChart(); // Simplificado como line chart
            default:
                return <div className="h-64 flex items-center justify-center text-gray-500">Tipo de gráfico não suportado</div>;
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{grafico.titulo}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {grafico.periodo}
                </span>
            </div>
            {renderChart()}
        </div>
    );
}
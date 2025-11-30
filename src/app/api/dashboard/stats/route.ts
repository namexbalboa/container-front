import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        // Mock data baseado na documentação
        const stats = {
            totalAverbacoes: 1247,
            averbacoesPendentes: 23,
            averbacaoesAprovadas: 1156,
            averbacaoesRejeitadas: 68,
            containeresAtivos: 342,
            containeresDisponiveis: 89,
            containeresEmUso: 253,
            valorTotalAverbado: 15750000.50,
            taxaAprovacao: 94.5,
            mediaTempoAprovacao: 2.3,
            seguradoras: {
                ativas: 15,
                total: 18
            },
            clientes: {
                ativos: 67,
                total: 72
            },
            usuarios: {
                ativos: 12,
                total: 15
            }
        };

        return NextResponse.json({
            success: true,
            message: "Estatísticas do dashboard obtidas com sucesso",
            data: stats
        });

    } catch (error) {
        console.error("Erro ao obter estatísticas do dashboard:", error);
        
        return NextResponse.json({
            success: false,
            message: "Erro interno do servidor"
        }, { status: 500 });
    }
}
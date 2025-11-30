import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        // Mock data de histórico de busca
        const historicoSearch = [
            {
                id: "1",
                termo: "container ABCD1234567",
                filtros: {
                    tipo: "container",
                    status: "ativo"
                },
                timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
                resultados: 15
            },
            {
                id: "2", 
                termo: "averbação pendente",
                filtros: {
                    tipo: "averbacao",
                    status: "pendente"
                },
                timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
                resultados: 8
            },
            {
                id: "3",
                termo: "seguradora XYZ",
                filtros: {
                    tipo: "seguradora"
                },
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
                resultados: 23
            },
            {
                id: "4",
                termo: "cliente ABC Ltda",
                filtros: {
                    tipo: "cliente",
                    status: "ativo"
                },
                timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
                resultados: 5
            },
            {
                id: "5",
                termo: "documento vencimento",
                filtros: {
                    tipo: "documento",
                    dataVencimento: "proximo"
                },
                timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 dias atrás
                resultados: 12
            }
        ];

        return NextResponse.json({
            success: true,
            message: "Histórico de busca obtido com sucesso",
            data: historicoSearch
        });

    } catch (error) {
        console.error("Erro ao obter histórico de busca:", error);
        
        return NextResponse.json({
            success: false,
            message: "Erro interno do servidor"
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { params, resultados } = await request.json();

        // Mock: salvar histórico de busca
        console.log("Salvando histórico de busca:", { params, resultados });

        return NextResponse.json({
            success: true,
            message: "Histórico de busca salvo com sucesso",
            data: null
        });

    } catch (error) {
        console.error("Erro ao salvar histórico de busca:", error);
        
        return NextResponse.json({
            success: false,
            message: "Erro interno do servidor"
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Mock: limpar histórico de busca
        console.log("Limpando histórico de busca");

        return NextResponse.json({
            success: true,
            message: "Histórico de busca limpo com sucesso",
            data: null
        });

    } catch (error) {
        console.error("Erro ao limpar histórico de busca:", error);
        
        return NextResponse.json({
            success: false,
            message: "Erro interno do servidor"
        }, { status: 500 });
    }
}
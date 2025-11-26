import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const tipoAlteracao = searchParams.get("tipoAlteracao");
        const usuarioId = searchParams.get("usuarioId");
        const dataInicio = searchParams.get("dataInicio");
        const dataFim = searchParams.get("dataFim");

        // Mock data de histórico de alterações
        const historicoCompleto = [
            {
                idHistorico: 1,
                tipoAlteracao: "CRIACAO",
                entidade: "AVERBACAO",
                entidadeId: 1234,
                descricao: "Averbação criada para container ABCD1234567",
                valorAnterior: null,
                valorNovo: {
                    numeroContainer: "ABCD1234567",
                    valor: 150000.00,
                    seguradora: "Seguradora XYZ"
                },
                usuario: {
                    idUsuario: 1,
                    nomeCompleto: "João Silva",
                    email: "joao@empresa.com"
                },
                dataAlteracao: new Date().toISOString(),
                ip: "192.168.1.100",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            {
                idHistorico: 2,
                tipoAlteracao: "ATUALIZACAO",
                entidade: "CONTAINER",
                entidadeId: 567,
                descricao: "Status do container alterado de 'disponível' para 'em uso'",
                valorAnterior: { status: "disponivel" },
                valorNovo: { status: "em_uso" },
                usuario: {
                    idUsuario: 2,
                    nomeCompleto: "Maria Santos",
                    email: "maria@empresa.com"
                },
                dataAlteracao: new Date(Date.now() - 3600000).toISOString(),
                ip: "192.168.1.101",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            {
                idHistorico: 3,
                tipoAlteracao: "APROVACAO",
                entidade: "AVERBACAO",
                entidadeId: 1235,
                descricao: "Averbação aprovada pelo supervisor",
                valorAnterior: { status: "pendente" },
                valorNovo: { status: "aprovada", observacoes: "Documentação completa" },
                usuario: {
                    idUsuario: 3,
                    nomeCompleto: "Carlos Supervisor",
                    email: "carlos@empresa.com"
                },
                dataAlteracao: new Date(Date.now() - 7200000).toISOString(),
                ip: "192.168.1.102",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            {
                idHistorico: 4,
                tipoAlteracao: "EXCLUSAO",
                entidade: "USUARIO",
                entidadeId: 999,
                descricao: "Usuário removido do sistema",
                valorAnterior: {
                    nomeCompleto: "Usuário Teste",
                    email: "teste@empresa.com",
                    status: "inativo"
                },
                valorNovo: null,
                usuario: {
                    idUsuario: 1,
                    nomeCompleto: "João Silva",
                    email: "joao@empresa.com"
                },
                dataAlteracao: new Date(Date.now() - 10800000).toISOString(),
                ip: "192.168.1.100",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        ];

        // Aplicar filtros
        let historicoFiltrado = historicoCompleto;

        if (tipoAlteracao) {
            historicoFiltrado = historicoFiltrado.filter(h => h.tipoAlteracao === tipoAlteracao);
        }

        if (usuarioId) {
            historicoFiltrado = historicoFiltrado.filter(h => h.usuario.idUsuario === parseInt(usuarioId));
        }

        // Paginação
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const historicoPage = historicoFiltrado.slice(startIndex, endIndex);

        const pagination = {
            page,
            limit,
            total: historicoFiltrado.length,
            pages: Math.ceil(historicoFiltrado.length / limit)
        };

        return NextResponse.json({
            success: true,
            message: "Histórico obtido com sucesso",
            data: {
                data: historicoPage,
                pagination
            }
        });

    } catch (error) {
        console.error("Erro ao obter histórico:", error);
        
        return NextResponse.json({
            success: false,
            message: "Erro interno do servidor"
        }, { status: 500 });
    }
}
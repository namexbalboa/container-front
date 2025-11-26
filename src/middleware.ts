import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ModuloSistema, AcaoPermissao } from "@/types/api";

// Mapeamento de rotas para permissões necessárias
const routePermissions: Record<string, { modulo: ModuloSistema; acao: AcaoPermissao }[]> = {
    "/dashboard/usuarios": [{ modulo: "USER", acao: "READ" }],
    "/dashboard/usuarios/criar": [{ modulo: "USER", acao: "CREATE" }],
    "/dashboard/usuarios/editar": [{ modulo: "USER", acao: "UPDATE" }],
    "/dashboard/containers": [{ modulo: "CONTAINER", acao: "READ" }],
    "/dashboard/containers/criar": [{ modulo: "CONTAINER", acao: "CREATE" }],
    "/dashboard/containers/editar": [{ modulo: "CONTAINER", acao: "UPDATE" }],
    "/dashboard/averbacoes": [{ modulo: "AVERBACAO", acao: "READ" }],
    "/dashboard/averbacoes/criar": [{ modulo: "AVERBACAO", acao: "CREATE" }],
    "/dashboard/averbacoes/editar": [{ modulo: "AVERBACAO", acao: "UPDATE" }],
    "/dashboard/averbacoes/aprovar": [{ modulo: "AVERBACAO", acao: "APPROVE" }],
    "/dashboard/seguradoras": [{ modulo: "SEGURADORA", acao: "READ" }],
    "/dashboard/seguradoras/criar": [{ modulo: "SEGURADORA", acao: "CREATE" }],
    "/dashboard/seguradoras/editar": [{ modulo: "SEGURADORA", acao: "UPDATE" }],
};

// Função para verificar se o usuário tem permissão para acessar uma rota
function hasRoutePermission(pathname: string, userPermissions: any[]): boolean {
    // Busca a rota mais específica que corresponde ao pathname
    const matchingRoute = Object.keys(routePermissions)
        .filter(route => pathname.startsWith(route))
        .sort((a, b) => b.length - a.length)[0]; // Pega a rota mais específica

    if (!matchingRoute) {
        return true; // Se não há regra específica, permite acesso
    }

    const requiredPermissions = routePermissions[matchingRoute];
    
    // Verifica se o usuário tem pelo menos uma das permissões necessárias
    return requiredPermissions.some(required => 
        userPermissions.some(permission => 
            permission.modulo === required.modulo && 
            permission.acao === required.acao
        )
    );
}

export default withAuth(
    function middleware(req) {
        // Middleware simplificado - verificação de permissões será feita no lado do cliente
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Verifica se o usuário está autenticado
                if (!token) return false;

                // Para rotas do dashboard, verifica se o usuário tem status ativo
                if (req.nextUrl.pathname.startsWith("/dashboard")) {
                    return token.status === "ativo";
                }

                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/auth/:path*"
    ],
};

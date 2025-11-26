"use client";

import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { PermissionGuard, AccessDenied } from "@/components/auth/permission-guard";

export default function TestAuthPage() {
    const { data: session, status } = useSession();
    const { permissions, hasPermission, canRead, canCreate, canUpdate, canDelete, canManage } = usePermissions();

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Teste de Autenticação</h1>
            
            {/* Informações da Sessão */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Informações da Sessão</h2>
                <div className="space-y-2">
                    <p><strong>Status:</strong> {status}</p>
                    <p><strong>Nome:</strong> {session?.user?.nome}</p>
                    <p><strong>Email:</strong> {session?.user?.email}</p>
                    <p><strong>CPF:</strong> {session?.user?.cpf}</p>
                    <p><strong>Telefone:</strong> {session?.user?.telefone}</p>
                    <p><strong>Status:</strong> {session?.user?.status}</p>
                    <p><strong>Perfil:</strong> {session?.user?.perfil?.nomePerfil}</p>
                    <p><strong>Token:</strong> {session?.accessToken ? "Presente" : "Ausente"}</p>
                </div>
            </div>

            {/* Permissões do Usuário */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Permissões do Usuário</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissions.map((permission: any, index: number) => (
                        <div key={index} className="border rounded p-3">
                            <p><strong>Módulo:</strong> {permission.modulo}</p>
                            <p><strong>Ação:</strong> {permission.acao}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Teste de Permissões por Módulo */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Teste de Permissões por Módulo</h2>
                
                {["usuarios", "containers", "clientes", "seguradoras", "permissoes"].map((modulo) => (
                    <div key={modulo} className="mb-6 p-4 border rounded">
                        <h3 className="text-lg font-medium mb-3 capitalize">{modulo}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <div className={`p-2 rounded text-center ${canRead(modulo) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                Visualizar: {canRead(modulo) ? "✓" : "✗"}
                            </div>
                            <div className={`p-2 rounded text-center ${canCreate(modulo) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                Criar: {canCreate(modulo) ? "✓" : "✗"}
                            </div>
                            <div className={`p-2 rounded text-center ${canUpdate(modulo) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                Editar: {canUpdate(modulo) ? "✓" : "✗"}
                            </div>
                            <div className={`p-2 rounded text-center ${canDelete(modulo) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                Excluir: {canDelete(modulo) ? "✓" : "✗"}
                            </div>
                            <div className={`p-2 rounded text-center ${canManage(modulo) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                Gerenciar: {canManage(modulo) ? "✓" : "✗"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Teste de Componentes de Proteção */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Teste de Componentes de Proteção</h2>
                
                <div className="space-y-4">
                    <PermissionGuard 
                        modulo="USUARIOS" 
                        acao="READ"
                        fallback={<AccessDenied message="Você não pode visualizar usuários." />}
                    >
                        <div className="p-4 bg-green-100 border border-green-300 rounded">
                            ✓ Você tem permissão para visualizar usuários!
                        </div>
                    </PermissionGuard>

                    <PermissionGuard 
                        modulo="CONTAINERS" 
                        acao="CREATE"
                        fallback={<AccessDenied message="Você não pode criar containers." />}
                    >
                        <div className="p-4 bg-green-100 border border-green-300 rounded">
                            ✓ Você tem permissão para criar containers!
                        </div>
                    </PermissionGuard>

                    <PermissionGuard 
                        modulo="CLIENTES" 
                        acao="DELETE"
                        fallback={<AccessDenied message="Você não pode excluir clientes." />}
                    >
                        <div className="p-4 bg-green-100 border border-green-300 rounded">
                            ✓ Você tem permissão para excluir clientes!
                        </div>
                    </PermissionGuard>
                </div>
            </div>
        </div>
    );
}
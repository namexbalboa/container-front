"use strict";

import { useSession } from "next-auth/react";
import { useMemo, useState, useEffect } from "react";
import { ModuloSistema, AcaoPermissao, Permissao } from "@/types/api";
import { apiService } from "@/lib/api";

interface UsePermissionsReturn {
    hasPermission: (modulo: ModuloSistema, acao: AcaoPermissao) => boolean;
    hasAnyPermission: (modulo: ModuloSistema, acoes: AcaoPermissao[]) => boolean;
    hasAllPermissions: (modulo: ModuloSistema, acoes: AcaoPermissao[]) => boolean;
    canRead: (modulo: ModuloSistema) => boolean;
    canCreate: (modulo: ModuloSistema) => boolean;
    canUpdate: (modulo: ModuloSistema) => boolean;
    canDelete: (modulo: ModuloSistema) => boolean;
    canApprove: (modulo: ModuloSistema) => boolean;
    isAdmin: boolean;
    isAnalista: boolean;
    userPermissions: Permissao[];
    userProfile: string | null;
    loading: boolean;
}

/**
 * Hook para gerenciar permissões baseadas em módulos do sistema v2
 * Suporta verificação granular de permissões por módulo e ação
 */
export function usePermissions(): UsePermissionsReturn {
    const { data: session, status } = useSession();
    const [userPermissions, setUserPermissions] = useState<Permissao[]>([]);
    const [userProfile, setUserProfile] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Buscar permissões do usuário via API
    useEffect(() => {
        async function fetchUserPermissions() {
            if (!session?.user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await apiService.getUsuario(parseInt(session.user.id));
                
                if (response.success && response.data) {
                    const permissions = response.data.perfil?.perfilPermissoes?.map((pp: any) => pp.permissao) || [];
                    setUserPermissions(permissions);
                    setUserProfile(response.data.perfil?.nomePerfil || null);
                }
            } catch (error) {
                console.error("Erro ao buscar permissões do usuário:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchUserPermissions();
    }, [session?.user?.id]);

    const isAdmin = useMemo(() => {
        return userProfile === "ADMIN";
    }, [userProfile]);

    const isAnalista = useMemo(() => {
        return userProfile === "ANALISTA";
    }, [userProfile]);

    /**
     * Verifica se o usuário tem uma permissão específica
     */
    const hasPermission = useMemo(() => {
        return (modulo: ModuloSistema, acao: AcaoPermissao): boolean => {
            try {
                // Admin tem todas as permissões
                if (isAdmin) return true;

                // Verificar se existe a permissão específica
                return userPermissions.some((permissao: Permissao) => 
                    permissao.modulo === modulo && permissao.acao === acao
                );
            } catch (error) {
                console.error("Erro ao verificar permissão:", error);
                return false;
            }
        };
    }, [userPermissions, isAdmin]);

    /**
     * Verifica se o usuário tem pelo menos uma das permissões especificadas
     */
    const hasAnyPermission = useMemo(() => {
        return (modulo: ModuloSistema, acoes: AcaoPermissao[]): boolean => {
            try {
                if (isAdmin) return true;
                return acoes.some(acao => hasPermission(modulo, acao));
            } catch (error) {
                console.error("Erro ao verificar permissões:", error);
                return false;
            }
        };
    }, [hasPermission, isAdmin]);

    /**
     * Verifica se o usuário tem todas as permissões especificadas
     */
    const hasAllPermissions = useMemo(() => {
        return (modulo: ModuloSistema, acoes: AcaoPermissao[]): boolean => {
            try {
                if (isAdmin) return true;
                return acoes.every(acao => hasPermission(modulo, acao));
            } catch (error) {
                console.error("Erro ao verificar permissões:", error);
                return false;
            }
        };
    }, [hasPermission, isAdmin]);

    /**
     * Verifica se o usuário pode ler dados de um módulo
     */
    const canRead = useMemo(() => {
        return (modulo: ModuloSistema): boolean => {
            return hasPermission(modulo, "READ");
        };
    }, [hasPermission]);

    /**
     * Verifica se o usuário pode criar dados em um módulo
     */
    const canCreate = useMemo(() => {
        return (modulo: ModuloSistema): boolean => {
            return hasPermission(modulo, "CREATE");
        };
    }, [hasPermission]);

    /**
     * Verifica se o usuário pode atualizar dados de um módulo
     */
    const canUpdate = useMemo(() => {
        return (modulo: ModuloSistema): boolean => {
            return hasPermission(modulo, "UPDATE");
        };
    }, [hasPermission]);

    /**
     * Verifica se o usuário pode deletar dados de um módulo
     */
    const canDelete = useMemo(() => {
        return (modulo: ModuloSistema): boolean => {
            return hasPermission(modulo, "DELETE");
        };
    }, [hasPermission]);

    /**
     * Verifica se o usuário pode aprovar itens de um módulo
     */
    const canApprove = useMemo(() => {
        return (modulo: ModuloSistema): boolean => {
            return hasPermission(modulo, "APPROVE");
        };
    }, [hasPermission]);

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canRead,
        canCreate,
        canUpdate,
        canDelete,
        canApprove,
        isAdmin,
        isAnalista,
        userPermissions,
        userProfile,
        loading: status === "loading" || loading,
    };
}

/**
 * Hook para verificar permissões específicas de um módulo
 * Útil para componentes que trabalham com um módulo específico
 */
export function useModulePermissions(modulo: ModuloSistema) {
    const permissions = usePermissions();

    return useMemo(() => ({
        canRead: permissions.canRead(modulo),
        canCreate: permissions.canCreate(modulo),
        canUpdate: permissions.canUpdate(modulo),
        canDelete: permissions.canDelete(modulo),
        canApprove: permissions.canApprove(modulo),
        hasPermission: (acao: AcaoPermissao) => permissions.hasPermission(modulo, acao),
        hasAnyPermission: (acoes: AcaoPermissao[]) => permissions.hasAnyPermission(modulo, acoes),
        hasAllPermissions: (acoes: AcaoPermissao[]) => permissions.hasAllPermissions(modulo, acoes),
        isAdmin: permissions.isAdmin,
        isAnalista: permissions.isAnalista,
        userPermissions: permissions.userPermissions,
        userProfile: permissions.userProfile,
        loading: permissions.loading,
    }), [modulo, permissions]);
}

/**
 * Hook para verificar se o usuário pode acessar uma rota específica
 * Baseado nas permissões necessárias para a rota
 */
export function useRoutePermissions(
    requiredModule?: ModuloSistema,
    requiredActions?: AcaoPermissao[]
) {
    const permissions = usePermissions();

    return useMemo(() => {
        if (!requiredModule) return true;
        
        if (!requiredActions || requiredActions.length === 0) {
            return permissions.canRead(requiredModule);
        }

        return permissions.hasAnyPermission(requiredModule, requiredActions);
    }, [permissions, requiredModule, requiredActions]);
}
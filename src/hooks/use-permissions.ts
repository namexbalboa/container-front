import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { ModuloSistema, AcaoPermissao, Permissao } from "@/types/api";

export const usePermissions = () => {
    const { data: session } = useSession();

    const permissions = useMemo(() => {
        // Fazemos type assertion para acessar as propriedades customizadas
        const customUser = session?.user as any;

        if (process.env.NODE_ENV === "development") {
            console.log('[use-permissions] Session user:', {
                hasUser: !!customUser,
                hasPerfil: !!customUser?.perfil,
                hasPerfilPermissoes: !!customUser?.perfil?.perfilPermissoes,
                hasPermissoes: !!customUser?.permissoes,
                perfilPermsCount: customUser?.perfil?.perfilPermissoes?.length || 0,
                permissoesCount: customUser?.permissoes?.length || 0
            });
        }

        if (Array.isArray(customUser?.permissoes) && customUser.permissoes.length > 0) {
            if (process.env.NODE_ENV === "development") {
                console.log('[use-permissions] Using permissoes from session:', customUser.permissoes);
            }
            return customUser.permissoes;
        }

        if (!customUser?.perfil?.perfilPermissoes) {
            if (process.env.NODE_ENV === "development") {
                console.log('[use-permissions] No perfilPermissoes found, returning empty array');
            }
            return [];
        }

        const perms = customUser.perfil.perfilPermissoes.map((pp: any) => pp.permissao);
        if (process.env.NODE_ENV === "development") {
            console.log('[use-permissions] Mapped permissions from perfil:', perms);
        }
        return perms;
    }, [session]);

    const hasPermission = (modulo: ModuloSistema | string, acao: AcaoPermissao | string): boolean => {
        if (!permissions.length) {
            if (process.env.NODE_ENV === "development") {
                console.log('[use-permissions] hasPermission - No permissions found');
            }
            return false;
        }

        // Normalizar para maiúsculas para comparação
        const moduloUpper = modulo.toUpperCase();
        const acaoUpper = acao.toUpperCase();

        const hasAccess = permissions.some((permission: Permissao) =>
            permission.modulo === moduloUpper && permission.acao === acaoUpper
        );

        if (process.env.NODE_ENV === "development" && modulo === "SEGURADORAS") {
            console.log('[use-permissions] Checking SEGURADORAS permission:', {
                modulo: moduloUpper,
                acao: acaoUpper,
                hasAccess,
                totalPermissions: permissions.length,
                seguradorasPermissions: permissions.filter((p: Permissao) => p.modulo === 'SEGURADORAS')
            });
        }

        return hasAccess;
    };

    const hasAnyPermission = (modulo: ModuloSistema | string, acoes: (AcaoPermissao | string)[]): boolean => {
        return acoes.some(acao => hasPermission(modulo, acao));
    };

    const hasAllPermissions = (modulo: ModuloSistema | string, acoes: (AcaoPermissao | string)[]): boolean => {
        return acoes.every(acao => hasPermission(modulo, acao));
    };

    const getModulePermissions = (modulo: ModuloSistema | string): string[] => {
        const moduloUpper = modulo.toUpperCase();
        return permissions
            .filter((permission: Permissao) => permission.modulo === moduloUpper)
            .map((permission: Permissao) => permission.acao);
    };

    const canRead = (modulo: ModuloSistema | string): boolean => {
        return hasPermission(modulo, "READ");
    };

    const canCreate = (modulo: ModuloSistema | string): boolean => {
        return hasPermission(modulo, "CREATE");
    };

    const canUpdate = (modulo: ModuloSistema | string): boolean => {
        return hasPermission(modulo, "UPDATE");
    };

    const canDelete = (modulo: ModuloSistema | string): boolean => {
        return hasPermission(modulo, "DELETE");
    };

    const canManage = (modulo: ModuloSistema | string): boolean => {
        return hasPermission(modulo, "MANAGE");
    };

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        getModulePermissions,
        canRead,
        canCreate,
        canUpdate,
        canDelete,
        canManage,
    };
};

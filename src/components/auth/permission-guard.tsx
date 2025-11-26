"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions-v2";
import { ModuloSistema, AcaoPermissao } from "@/types/api";

interface PermissionGuardProps {
    children: ReactNode;
    modulo: ModuloSistema | string;
    acao: AcaoPermissao | string;
    fallback?: ReactNode;
    requireAll?: boolean;
}

interface MultiplePermissionGuardProps {
    children: ReactNode;
    permissions: Array<{ modulo: ModuloSistema | string; acao: AcaoPermissao | string }>;
    fallback?: ReactNode;
    requireAll?: boolean;
}

export const PermissionGuard = ({ 
    children, 
    modulo, 
    acao, 
    fallback = null 
}: PermissionGuardProps) => {
    const { hasPermission } = usePermissions();

    if (!hasPermission(modulo as ModuloSistema, acao as AcaoPermissao)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export const MultiplePermissionGuard = ({ 
    children, 
    permissions, 
    fallback = null, 
    requireAll = false 
}: MultiplePermissionGuardProps) => {
    const { hasPermission } = usePermissions();

    const hasAccess = requireAll
        ? permissions.every(({ modulo, acao }) => hasPermission(modulo as ModuloSistema, acao as AcaoPermissao))
        : permissions.some(({ modulo, acao }) => hasPermission(modulo as ModuloSistema, acao as AcaoPermissao));

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// Componente para exibir mensagem de acesso negado
interface AccessDeniedProps {
    message?: string;
}

export const AccessDenied = ({ message = "Você não tem permissão para acessar esta funcionalidade." }: AccessDeniedProps) => (
    <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
            <p className="text-gray-600">{message}</p>
        </div>
    </div>
);
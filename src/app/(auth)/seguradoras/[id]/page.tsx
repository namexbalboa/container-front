"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    ArrowLeftIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ChartBarIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { 
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon as ExclamationTriangleSolidIcon
} from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernTabs, ModernTabsList, ModernTabsTrigger, ModernTabsContent } from "@/components/ui/modern-tabs";
import { usePermissions } from "@/hooks/use-permissions";
import { useApi } from "@/lib/api";
import { Seguradora, SeguradoraContato, SeguradoraDocumento } from "@/types/api";
import { formatCurrency, formatDate } from "@/lib/format-utils";

export default function SeguradoraDetalhesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const { hasPermission } = usePermissions();
    const api = useApi();

    const seguradoraId = parseInt(params.id as string);

    // Estados
    const [seguradora, setSeguradora] = useState<Seguradora | null>(null);
    const [contatos, setContatos] = useState<SeguradoraContato[]>([]);
    const [documentos, setDocumentos] = useState<SeguradoraDocumento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Verificar permissões
    const canRead = hasPermission("SEGURADORAS", "READ");
    const canUpdate = hasPermission("SEGURADORAS", "UPDATE");
    const canDelete = hasPermission("SEGURADORAS", "DELETE");

    // Carregar dados
    useEffect(() => {
        if (!canRead) {
            setError("Você não tem permissão para visualizar seguradoras");
            setLoading(false);
            return;
        }

        if (isNaN(seguradoraId)) {
            setError("ID da seguradora inválido");
            setLoading(false);
            return;
        }

        loadSeguradora();
        loadContatos();
        loadDocumentos();
    }, [seguradoraId, canRead]);

    const loadSeguradora = async () => {
        try {
            setLoading(true);
            const response = await api.getSeguradora(seguradoraId);
            
            if (response.success && response.data) {
                setSeguradora(response.data);
            } else {
                throw new Error(response.message || "Erro ao carregar seguradora");
            }
        } catch (err) {
            console.error("Erro ao carregar seguradora:", err);
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    };

    const loadContatos = async () => {
        try {
            const response = await api.getSeguradoraContatos(seguradoraId);
            if (response.success && response.data) {
                setContatos(response.data);
            }
        } catch (err) {
            console.error("Erro ao carregar contatos:", err);
        }
    };

    const loadDocumentos = async () => {
        try {
            const response = await api.getSeguradoraDocumentos(seguradoraId);
            if (response.success && response.data) {
                setDocumentos(response.data);
            }
        } catch (err) {
            console.error("Erro ao carregar documentos:", err);
        }
    };

    const handleDelete = async () => {
        if (!canDelete || !seguradora) {
            alert("Você não tem permissão para excluir seguradoras");
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir a seguradora "${seguradora.nomeSeguradora}"?`)) {
            return;
        }

        try {
            const response = await api.deleteSeguradora(seguradoraId);
            if (response.success) {
                router.push("/seguradoras");
            } else {
                throw new Error(response.message || "Erro ao excluir seguradora");
            }
        } catch (err) {
            console.error("Erro ao excluir seguradora:", err);
            alert(err instanceof Error ? err.message : "Erro desconhecido");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ativa":
                return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
            case "inativa":
                return <XCircleIcon className="h-4 w-4 text-red-500" />;
            case "suspensa":
                return <ExclamationTriangleSolidIcon className="h-4 w-4 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            ativa: "bg-green-100 text-green-800  ",
            inativa: "bg-red-100 text-red-800  ",
            suspensa: "bg-yellow-100 text-yellow-800  dark:text-yellow-300"
        };

        return (
            <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
            </Badge>
        );
    };



    if (!canRead) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900  mb-2">
                        Acesso Negado
                    </h3>
                    <p className="text-gray-500 ">
                        Você não tem permissão para visualizar seguradoras.
                    </p>
                    <Button 
                        onClick={() => router.push("/seguradoras")}
                        className="mt-4"
                    >
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !seguradora) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900  mb-2">
                        Erro ao carregar dados
                    </h3>
                    <p className="text-gray-500  mb-4">
                        {error || "Seguradora não encontrada"}
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={() => router.push("/seguradoras")}>
                            Voltar
                        </Button>
                        <Button variant="outline" onClick={loadSeguradora}>
                            Tentar novamente
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/seguradoras")}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 ">
                            {seguradora.nomeSeguradora}
                        </h1>
                        <p className="text-gray-500 ">
                            CNPJ: {seguradora.cnpj}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canUpdate && (
                        <Button
                            onClick={() => router.push(`/seguradoras/${seguradoraId}/editar`)}
                            className="flex items-center gap-2"
                        >
                            <PencilIcon className="h-4 w-4" />
                            Editar
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="flex items-center gap-2"
                        >
                            <TrashIcon className="h-4 w-4" />
                            Excluir
                        </Button>
                    )}
                </div>
            </div>

            {/* Informações Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {getStatusBadge(seguradora.status)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Averbações</CardTitle>
                        <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{seguradora.totalAverbacoes || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Total processadas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                        <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {seguradora.valorTotalAverbado ? formatCurrency(seguradora.valorTotalAverbado) : "R$ 0"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Valor averbado
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                        <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{seguradora.mediaTempoAprovacao || 0}h</div>
                        <p className="text-xs text-muted-foreground">
                            Aprovação média
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs com Detalhes */}
            <ModernTabs defaultValue="informacoes" className="space-y-4">
                <ModernTabsList>
                    <ModernTabsTrigger value="informacoes" icon={<BuildingOfficeIcon className="h-5 w-5" />}>
                        Informações
                    </ModernTabsTrigger>
                    <ModernTabsTrigger value="contatos" icon={<UserGroupIcon className="h-5 w-5" />}>
                        Contatos ({contatos.length})
                    </ModernTabsTrigger>
                    <ModernTabsTrigger value="documentos" icon={<DocumentTextIcon className="h-5 w-5" />}>
                        Documentos ({documentos.length})
                    </ModernTabsTrigger>
                </ModernTabsList>

                <ModernTabsContent value="informacoes" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Dados Básicos */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados Básicos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 ">
                                            Nome
                                        </label>
                                        <p className="text-sm text-gray-900 ">
                                            {seguradora.nomeSeguradora}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 ">
                                            CNPJ
                                        </label>
                                        <p className="text-sm text-gray-900 ">
                                            {seguradora.cnpj}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 ">
                                            Email
                                        </label>
                                        <p className="text-sm text-gray-900  flex items-center gap-1">
                                            <EnvelopeIcon className="h-3 w-3" />
                                            {seguradora.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 ">
                                            Telefone
                                        </label>
                                        <p className="text-sm text-gray-900  flex items-center gap-1">
                                            <PhoneIcon className="h-3 w-3" />
                                            {seguradora.telefone}
                                        </p>
                                    </div>
                                    {seguradora.celular && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 ">
                                                Celular
                                            </label>
                                            <p className="text-sm text-gray-900  flex items-center gap-1">
                                                <PhoneIcon className="h-3 w-3" />
                                                {seguradora.celular}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 ">
                                            Data de Criação
                                        </label>
                                        <p className="text-sm text-gray-900 ">
                                            {formatDate(seguradora.dataCriacao)}
                                        </p>
                                    </div>
                                    {seguradora.dataAtualizacao && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 ">
                                                Última Atualização
                                            </label>
                                            <p className="text-sm text-gray-900 ">
                                                {formatDate(seguradora.dataAtualizacao)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Endereço */}
                        {seguradora.endereco && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPinIcon className="h-5 w-5" />
                                        Endereço
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {typeof seguradora.endereco === 'string' ? (
                                        <p className="text-sm text-gray-900">
                                            {seguradora.endereco}
                                        </p>
                                    ) : (
                                        <>
                                            {seguradora.endereco.logradouro && (
                                                <p className="text-sm text-gray-900">
                                                    {seguradora.endereco.logradouro}
                                                    {seguradora.endereco.numero && `, ${seguradora.endereco.numero}`}
                                                    {seguradora.endereco.complemento && ` - ${seguradora.endereco.complemento}`}
                                                </p>
                                            )}
                                            {seguradora.endereco.bairro && (
                                                <p className="text-sm text-gray-900">
                                                    {seguradora.endereco.bairro}
                                                </p>
                                            )}
                                            {(seguradora.endereco.cidade || seguradora.endereco.estado) && (
                                                <p className="text-sm text-gray-900">
                                                    {seguradora.endereco.cidade}
                                                    {seguradora.endereco.estado && ` - ${seguradora.endereco.estado}`}
                                                </p>
                                            )}
                                            {seguradora.endereco.cep && (
                                                <p className="text-sm text-gray-500">
                                                    CEP: {seguradora.endereco.cep}
                                                </p>
                                            )}
                                            {seguradora.endereco.pais && (
                                                <p className="text-sm text-gray-500">
                                                    {seguradora.endereco.pais}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Observações */}
                    {seguradora.observacoes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Observações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-900  whitespace-pre-wrap">
                                    {seguradora.observacoes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </ModernTabsContent>

                <ModernTabsContent value="contatos" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Contatos</h3>
                        {canUpdate && (
                            <Button
                                onClick={() => router.push(`/seguradoras/${seguradoraId}/contatos/criar`)}
                                className="flex items-center gap-2"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Novo Contato
                            </Button>
                        )}
                    </div>

                    {contatos.length === 0 ? (
                        <Card>
                            <CardContent className="flex items-center justify-center h-32">
                                <div className="text-center">
                                    <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 ">
                                        Nenhum contato cadastrado
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contatos.map((contato) => (
                                <Card key={contato.idContato}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-gray-900 ">
                                                    {contato.nome}
                                                </h4>
                                                <p className="text-sm text-gray-500 ">
                                                    {contato.cargo}
                                                </p>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-900  flex items-center gap-1">
                                                        <EnvelopeIcon className="h-3 w-3" />
                                                        {contato.email}
                                                    </p>
                                                    <p className="text-sm text-gray-900  flex items-center gap-1">
                                                        <PhoneIcon className="h-3 w-3" />
                                                        {contato.telefone}
                                                    </p>
                                                </div>
                                                {contato.principal && (
                                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 ">
                                                        Principal
                                                    </Badge>
                                                )}
                                            </div>
                                            {canUpdate && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/seguradoras/${seguradoraId}/contatos/${contato.idContato}/editar`)}
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ModernTabsContent>

                <ModernTabsContent value="documentos" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Documentos</h3>
                        {canUpdate && (
                            <Button
                                onClick={() => router.push(`/seguradoras/${seguradoraId}/documentos/upload`)}
                                className="flex items-center gap-2"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Upload Documento
                            </Button>
                        )}
                    </div>

                    {documentos.length === 0 ? (
                        <Card>
                            <CardContent className="flex items-center justify-center h-32">
                                <div className="text-center">
                                    <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 ">
                                        Nenhum documento cadastrado
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {documentos.map((documento) => (
                                <Card key={documento.idDocumento}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                                                <div>
                                                    <h4 className="font-medium text-gray-900 ">
                                                        {documento.nomeArquivo}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 ">
                                                        {documento.tipoDocumento} • {formatDate(documento.dataCriacao)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(documento.caminhoArquivo, "_blank")}
                                                >
                                                    Ver
                                                </Button>
                                                {canUpdate && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/seguradoras/${seguradoraId}/documentos/${documento.idDocumento}/editar`)}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ModernTabsContent>
            </ModernTabs>
        </div>
    );
}
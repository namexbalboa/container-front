import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { usePermissions } from "../use-permissions";
import { Session } from "next-auth";
import { Perfil } from "@/types/api";

// Mock do next-auth/react
jest.mock("next-auth/react");

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("usePermissions Hook", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("deve retornar false quando não há sessão", () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: "unauthenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        expect(result.current.hasPermission("USER", "READ")).toBe(false);
        expect(result.current.hasAnyPermission("USER", ["READ", "CREATE"])).toBe(false);
        expect(result.current.hasAllPermissions("USER", ["READ", "CREATE"])).toBe(false);
        expect(result.current.permissions).toEqual([]);
    });

    it("deve retornar false quando usuário não tem perfil", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    nome: "Teste",
                    email: "test@test.com",
                    nomeCompleto: "Teste",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: null as any,
                },
                token: "test-token",
                accessToken: "test-access-token",
                expires: "2024-12-31",
            } as Session,
            status: "authenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        expect(result.current.hasPermission("USER", "READ")).toBe(false);
        expect(result.current.permissions).toEqual([]);
    });

    it("deve retornar false quando perfil não tem permissões", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    nome: "Teste",
                    email: "test@test.com",
                    nomeCompleto: "Teste",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: {
                        idPerfil: 1,
                        nomePerfil: "Teste",
                        descricao: "Perfil de teste",
                        nivelAcesso: null,
                        ativo: true,
                        dataCriacao: "2024-01-01",
                        perfilPermissoes: [],
                    },
                },
                token: "test-token",
                accessToken: "test-access-token",
                expires: "2024-12-31",
            } as Session,
            status: "authenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        expect(result.current.hasPermission("USER", "READ")).toBe(false);
        expect(result.current.permissions).toEqual([]);
    });

    it("deve verificar permissão específica corretamente", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    nome: "Teste",
                    email: "test@test.com",
                    nomeCompleto: "Teste",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: {
                        idPerfil: 1,
                        nomePerfil: "Admin",
                        descricao: "Administrador",
                        nivelAcesso: null,
                        ativo: true,
                        dataCriacao: "2024-01-01",
                        perfilPermissoes: [
                            {
                                idPerfilPermissao: 1,
                                idPerfil: 1,
                                idPermissao: 1,
                                permissao: {
                                    idPermissao: 1,
                                    nomePermissao: "USER_READ",
                                    descricao: "Listar usuários",
                                    modulo: "USER",
                                    acao: "READ",
                                },
                            },
                            {
                                idPerfilPermissao: 2,
                                idPerfil: 1,
                                idPermissao: 2,
                                permissao: {
                                    idPermissao: 2,
                                    nomePermissao: "USER_CREATE",
                                    descricao: "Criar usuários",
                                    modulo: "USER",
                                    acao: "CREATE",
                                },
                            },
                        ],
                    },
                },
                token: "test-token",
                accessToken: "test-access-token",
                expires: "2024-12-31",
            } as Session,
            status: "authenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        expect(result.current.hasPermission("USER", "READ")).toBe(true);
        expect(result.current.hasPermission("USER", "CREATE")).toBe(true);
        expect(result.current.hasPermission("USER", "DELETE")).toBe(false);
        expect(result.current.permissions).toHaveLength(2);
    });

    it("deve verificar hasAnyPermission corretamente", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    nome: "Teste",
                    email: "test@test.com",
                    nomeCompleto: "Teste",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: {
                        idPerfil: 1,
                        nomePerfil: "Admin",
                        descricao: "Administrador",
                        nivelAcesso: null,
                        ativo: true,
                        dataCriacao: "2024-01-01",
                        perfilPermissoes: [
                            {
                                idPerfilPermissao: 1,
                                idPerfil: 1,
                                idPermissao: 1,
                                permissao: {
                                    idPermissao: 1,
                                    nomePermissao: "USER_READ",
                                    descricao: "Listar usuários",
                                    modulo: "USER",
                                    acao: "READ",
                                },
                            },
                        ],
                    },
                },
                token: "test-token",
                accessToken: "test-access-token",
                expires: "2024-12-31",
            } as Session,
            status: "authenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        // Tem pelo menos uma das permissões
        expect(result.current.hasAnyPermission("USER", ["READ", "CREATE"])).toBe(true);
        
        // Não tem nenhuma das permissões
        expect(result.current.hasAnyPermission("USER", ["DELETE", "UPDATE"])).toBe(false);
        
        // Array vazio deve retornar false
        expect(result.current.hasAnyPermission("USER", [])).toBe(false);
    });

    it("deve verificar hasAllPermissions corretamente", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    nome: "Teste",
                    email: "test@test.com",
                    nomeCompleto: "Teste",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: {
                        idPerfil: 1,
                        nomePerfil: "Admin",
                        descricao: "Administrador",
                        nivelAcesso: null,
                        ativo: true,
                        dataCriacao: "2024-01-01",
                        perfilPermissoes: [
                            {
                                idPerfilPermissao: 1,
                                idPerfil: 1,
                                idPermissao: 1,
                                permissao: {
                                    idPermissao: 1,
                                    nomePermissao: "USER_READ",
                                    descricao: "Listar usuários",
                                    modulo: "USER",
                                acao: "READ",
                            },
                        },
                        {
                            idPerfilPermissao: 2,
                            idPerfil: 1,
                            idPermissao: 2,
                            permissao: {
                                idPermissao: 2,
                                nomePermissao: "USER_CREATE",
                                descricao: "Criar usuários",
                                modulo: "USER",
                                    acao: "CREATE",
                                },
                            },
                        ],
                    },
                },
                token: "test-token",
                accessToken: "test-access-token",
                expires: "2024-12-31",
            } as Session,
            status: "authenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        // Tem todas as permissões solicitadas
        expect(result.current.hasAllPermissions("USER", ["READ", "CREATE"])).toBe(true);
        
        // Não tem todas as permissões solicitadas
        expect(result.current.hasAllPermissions("USER", ["READ", "DELETE"])).toBe(false);
        
        // Array vazio deve retornar true
        expect(result.current.hasAllPermissions("USER", [])).toBe(true);
    });

    it("deve converter parâmetros para uppercase automaticamente", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    nome: "Teste",
                    email: "test@test.com",
                    nomeCompleto: "Teste",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: {
                        idPerfil: 1,
                        nomePerfil: "Admin",
                        descricao: "Administrador",
                        nivelAcesso: null,
                        ativo: true,
                        dataCriacao: "2024-01-01",
                        perfilPermissoes: [
                            {
                                idPerfilPermissao: 1,
                                idPerfil: 1,
                                idPermissao: 1,
                                permissao: {
                                    idPermissao: 1,
                                    nomePermissao: "USER_READ",
                                    descricao: "Listar usuários",
                                    modulo: "USER",
                                    acao: "READ",
                                },
                            },
                        ],
                    },
                },
                token: "test-token",
                accessToken: "test-access-token",
                expires: "2024-12-31",
            } as Session,
            status: "authenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        // O hook converte automaticamente para uppercase
        expect(result.current.hasPermission("USER", "READ")).toBe(true);
        expect(result.current.hasPermission("user", "read")).toBe(true);
        expect(result.current.hasPermission("User", "Read")).toBe(true);
    });

    it("deve testar métodos de conveniência", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    nome: "Teste",
                    email: "test@test.com",
                    nomeCompleto: "Teste",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: {
                        idPerfil: 1,
                        nomePerfil: "Admin",
                        descricao: "Administrador",
                        nivelAcesso: null,
                        ativo: true,
                        dataCriacao: "2024-01-01",
                        perfilPermissoes: [
                            {
                                idPerfilPermissao: 1,
                                idPerfil: 1,
                                idPermissao: 1,
                                permissao: {
                                    idPermissao: 1,
                                    nomePermissao: "USER_READ",
                                    descricao: "Listar usuários",
                                    modulo: "USER",
                                acao: "READ",
                            },
                        },
                        {
                            idPerfilPermissao: 2,
                            idPerfil: 1,
                            idPermissao: 2,
                            permissao: {
                                idPermissao: 2,
                                nomePermissao: "USER_CREATE",
                                descricao: "Criar usuários",
                                modulo: "USER",
                                    acao: "CREATE",
                                },
                            },
                        ],
                    },
                },
                token: "test-token",
                accessToken: "test-access-token",
                expires: "2024-12-31",
            } as Session,
            status: "authenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        expect(result.current.canRead("USER")).toBe(true);
        expect(result.current.canCreate("USER")).toBe(true);
        expect(result.current.canUpdate("USER")).toBe(false);
        expect(result.current.canDelete("USER")).toBe(false);
        expect(result.current.canManage("USER")).toBe(false);
    });

    it("deve retornar permissões de módulo específico", () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    nome: "Teste",
                    email: "test@test.com",
                    nomeCompleto: "Teste",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: {
                        idPerfil: 1,
                        nomePerfil: "Admin",
                        descricao: "Administrador",
                        nivelAcesso: null,
                        ativo: true,
                        dataCriacao: "2024-01-01",
                        perfilPermissoes: [
                            {
                                idPerfilPermissao: 1,
                                idPerfil: 1,
                                idPermissao: 1,
                                permissao: {
                                    idPermissao: 1,
                                    nomePermissao: "USER_READ",
                                    descricao: "Listar usuários",
                                    modulo: "USER",
                                    acao: "READ",
                                },
                            },
                            {
                                idPerfilPermissao: 2,
                                idPerfil: 1,
                                idPermissao: 2,
                                permissao: {
                                    idPermissao: 2,
                                    nomePermissao: "CONTAINER_CREATE",
                                    descricao: "Criar containers",
                                    modulo: "CONTAINER",
                                    acao: "CREATE",
                                },
                            },
                        ],
                    },
                },
                token: "test-token",
                accessToken: "test-access-token",
                expires: "2024-12-31",
            } as Session,
            status: "authenticated",
            update: jest.fn(),
        });

        const { result } = renderHook(() => usePermissions());

        expect(result.current.getModulePermissions("USER")).toEqual(["READ"]);
        expect(result.current.getModulePermissions("CONTAINER")).toEqual(["CREATE"]);
        expect(result.current.getModulePermissions("CLIENTES")).toEqual([]);
    });
});
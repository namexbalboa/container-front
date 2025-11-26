import { authOptions } from "../auth";
import { ApiResponse, AuthResponse } from "@/types/api";

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Auth Configuration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.API_URL = "http://localhost:3001";
    });

    describe("CredentialsProvider authorize function", () => {
        // Extrair a função authorize do authOptions
        const credentialsProvider = authOptions.providers.find(
            (provider: any) => provider.id === "credentials"
        ) as any;
        const authorize = credentialsProvider?.options?.authorize;

        beforeEach(() => {
            mockFetch.mockClear();
        });

        it("deve ter função authorize definida", () => {
            expect(authorize).toBeDefined();
            expect(typeof authorize).toBe("function");
        });

        it("deve ter variáveis de ambiente definidas", () => {
            expect(process.env.API_URL).toBeDefined();
            expect(process.env.API_URL).toBe("http://localhost:3001");
        });



        it("deve retornar null quando email não é fornecido", async () => {
            const credentials = { senha: "123456" };

            const result = await authorize(credentials as any);
            expect(result).toBeNull();
        });

        it("deve retornar null quando senha não é fornecida", async () => {
            const credentials = { email: "test@example.com" };

            const result = await authorize(credentials as any);
            expect(result).toBeNull();
        });

        it("deve retornar null quando credenciais são undefined", async () => {
            const result = await authorize(undefined);
            expect(result).toBeNull();
        });

        it("deve fazer login com sucesso com credenciais válidas", async () => {
            const credentials = { email: "admin@test.com", senha: "123456" };
            
            const mockResponse: ApiResponse<AuthResponse> = {
                success: true,
                message: "Login realizado com sucesso",
                data: {
                    usuario: {
                        id: 1,
                        nome: "Admin",
                        email: "admin@test.com",
                        perfil: { 
                            idPerfil: 1, 
                            nomePerfil: "Admin",
                            descricao: "Administrador",
                            nivelAcesso: null,
                            ativo: true,
                            dataCriacao: "2024-01-01",
                            perfilPermissoes: []
                        },
                        cpf: "12345678901",
                        telefone: "11999999999",
                        status: "ativo"
                    },
                    token: "mock-jwt-token",
                    refreshToken: "mock-refresh-token"
                }
            };

            // Configurar o mock para retornar uma resposta válida
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response);

            const result = await authorize(credentials);

            // Verificar se o resultado está correto
            expect(result).toMatchObject({
                id: "1",
                name: "Admin",
                email: "admin@test.com",
                usuario: {
                    idUsuario: 1,
                    nome: "Admin",
                    email: "admin@test.com",
                    perfil: { 
                        idPerfil: 1, 
                        nomePerfil: "Admin",
                    },
                    status: "ativo",
                    permissoes: []
                },
                accessToken: "mock-jwt-token",
                refreshToken: "mock-refresh-token",
            });
            expect(result).toHaveProperty("accessTokenExpires");

            // Verificar se o fetch foi chamado
            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:3001/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: "admin@test.com",
                        senha: "123456"
                    }),
                }
            );
        });

        it("deve retornar null quando API retorna erro HTTP", async () => {
            const credentials = {
                email: "invalid@test.com",
                senha: "wrongpassword"
            };

            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    message: "Credenciais inválidas"
                })
            });

            const result = await authorize(credentials as any);
            expect(result).toBeNull();
        });

        it("deve retornar null quando API retorna success: false", async () => {
            const credentials = {
                email: "test@test.com",
                senha: "123456"
            };

            const mockApiResponse: ApiResponse<AuthResponse> = {
                success: false,
                message: "Usuário não encontrado"
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponse
            });

            const result = await authorize(credentials as any);
            expect(result).toBeNull();
        });

        it("deve retornar null quando fetch falha", async () => {
            const credentials = {
                email: "test@test.com",
                senha: "123456"
            };

            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            const result = await authorize(credentials as any);
            expect(result).toBeNull();
        });
    });

    describe("JWT Callback", () => {
        const jwtCallback = authOptions.callbacks?.jwt;

        it("deve adicionar dados do usuário ao token na primeira vez", async () => {
            const mockUser = {
                id: "1",
                name: "Test User",
                email: "test@test.com",
                usuario: {
                    id: 1,
                    nome: "Test User",
                    email: "test@test.com",
                    status: "ativo" as const,
                    perfil: { 
                        idPerfil: 1, 
                        nomePerfil: "Admin",
                        perfilPermissoes: []
                    },
                    permissoes: []
                },
                accessToken: "jwt-token",
                refreshToken: undefined,
                accessTokenExpires: undefined
            };

            const mockToken = {
                id: "",
                name: "",
                email: "",
                nome: "",
                status: "ativo" as const,
                perfilId: undefined,
                perfilNome: "",
                permissoes: [],
                accessToken: ""
            };

            const result = await (jwtCallback as any)({
                token: mockToken,
                user: mockUser as any
            });

            expect(result).toMatchObject({
                id: "1",
                name: "Test User",
                email: "test@test.com",
                nome: "Test User",
                status: "ativo",
                perfilId: 1,
                perfilNome: "Admin",
                permissoes: [],
                accessToken: "jwt-token",
            });
        });

        it("deve manter token existente quando user não é fornecido e token ainda válido", async () => {
            const mockToken = {
                id: "1",
                name: "Existing User",
                email: "existing@test.com",
                nome: "Existing User",
                status: "ativo" as const,
                perfilId: 1,
                perfilNome: "Admin",
                permissoes: [],
                accessToken: "existing-token",
                refreshToken: "existing-refresh-token",
                accessTokenExpires: Date.now() + (60 * 60 * 1000) // Token válido por mais 1 hora
            };

            const result = await (jwtCallback as any)({
                token: mockToken,
                user: undefined
            });

            expect(result).toEqual(mockToken);
        });

        it("deve renovar token quando expirado", async () => {
            const mockToken = {
                id: "1",
                name: "Existing User",
                email: "existing@test.com",
                nome: "Existing User",
                status: "ativo" as const,
                perfilId: 1,
                perfilNome: "Admin",
                permissoes: [],
                accessToken: "expired-token",
                refreshToken: "refresh-token",
                accessTokenExpires: Date.now() - 1000 // Token expirado
            };

            // Mock da API de refresh
            const mockRefreshResponse = {
                success: true,
                data: {
                    token: "new-access-token",
                    refreshToken: "new-refresh-token"
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRefreshResponse
            });

            const result = await (jwtCallback as any)({
                token: mockToken,
                user: undefined
            });

            expect(result).toEqual({
                ...mockToken,
                accessToken: "new-access-token",
                accessTokenExpires: expect.any(Number),
                refreshToken: "new-refresh-token"
            });

            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:3001/api/auth/refresh-token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        refreshToken: "refresh-token",
                    }),
                }
            );
        });
    });

    describe("Session Callback", () => {
        const sessionCallback = authOptions.callbacks?.session;

        it("deve criar sessão com dados do token", async () => {
            const mockToken = {
                id: "1",
                name: "Test User",
                email: "test@test.com",
                nome: "Test User",
                status: "ativo",
                perfilId: 1,
                perfilNome: "Admin",
                permissoes: [],
                accessToken: "jwt-token"
            };

            const mockSession = {
                user: {},
                expires: "2024-12-31"
            };

            const result = await (sessionCallback as any)({
                session: mockSession,
                token: mockToken
            });

            expect(result).toEqual({
                user: {
                    id: "1",
                    name: "Test User",
                    nome: "Test User",
                    nomeCompleto: "Test User",
                    email: "test@test.com",
                    status: "ativo",
                    perfilId: 1,
                    perfilNome: "Admin",
                    permissoes: [],
                    perfil: {
                        idPerfil: 1,
                        nomePerfil: "Admin",
                        perfilPermissoes: []
                    }
                },
                token: "jwt-token",
                expires: "2024-12-31",
                accessToken: "jwt-token"
            });
        });
    });
});

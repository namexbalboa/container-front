import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginCredentials, ApiResponse, AuthResponse, UsuarioAuth, RefreshTokenResponse } from "@/types/api";

type NormalizedUsuario = ReturnType<typeof normalizeUsuario>;

function getApiBaseUrl() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
    if (!apiUrl) {
        throw new Error("API base URL is not configured. Set NEXT_PUBLIC_API_URL or API_URL.");
    }
    return apiUrl.replace(/\/$/, "");
}

function buildApiUrl(path: string) {
    const baseUrl = getApiBaseUrl();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
}

function normalizeUsuario(usuario: UsuarioAuth) {
    const perfil = usuario.perfil ?? {
        idPerfil: 0,
        nomePerfil: "",
        descricao: "",
        nivelAcesso: null,
        ativo: false,
        dataCriacao: "",
        perfilPermissoes: [],
    };

    const permissoesCompactas = (perfil.perfilPermissoes ?? []).map((pp: any) => {
        // A API retorna pp.permissoes (plural) conforme o Prisma schema
        const permissao = pp?.permissoes ?? pp?.permissao ?? {};
        return {
            idPermissao: permissao.idPermissao ?? 0,
            modulo: permissao.modulo ?? "",
            acao: permissao.acao ?? "",
        };
    }).filter((permissao: any) => permissao.modulo && permissao.acao);

    return {
        idUsuario: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        status: usuario.status,
        perfil: {
            idPerfil: perfil.idPerfil ?? 0,
            nomePerfil: perfil.nomePerfil ?? "",
        },
        permissoes: permissoesCompactas,
    };
}

const AUTH_LOGIN_PATH = "/api/auth/login";
const AUTH_REFRESH_PATH = process.env.NEXT_PUBLIC_AUTH_REFRESH_PATH ?? "/api/auth/refresh-token";

async function refreshAccessToken(token: any) {
    try {
        if (!token?.refreshToken) {
            throw new Error("RefreshToken not found in token");
        }

        const response = await fetch(buildApiUrl(AUTH_REFRESH_PATH), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refreshToken: token.refreshToken,
            }),
        });

        const contentType = response.headers && typeof response.headers.get === "function"
            ? response.headers.get("content-type")
            : "application/json";

        if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const refreshedTokens: ApiResponse<RefreshTokenResponse> = await response.json();

        if (!response.ok || !refreshedTokens.success || !refreshedTokens.data) {
            if (refreshedTokens.message && refreshedTokens.message.includes("Record not found")) {
                throw new Error("UserNotFound");
            }
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.data.token,
            accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
            refreshToken: refreshedTokens.data.refreshToken ?? token.refreshToken,
        };
    } catch (error) {
        if (error instanceof Error && error.message === "UserNotFound") {
            return {
                ...token,
                error: "UserNotFound",
                accessToken: null,
                refreshToken: null,
            };
        }

        console.error("Erro ao renovar token:", {
            error,
            errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
            apiUrl: (() => {
                try {
                    return buildApiUrl(AUTH_REFRESH_PATH);
                } catch (buildError) {
                    return "API URL not configured";
                }
            })(),
        });

        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                senha: { label: "Senha", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.senha) {
                    return null;
                }
                
                try {
                    const loginData: LoginCredentials = {
                        email: credentials.email,
                        senha: credentials.senha
                    };
                    
                    const response = await fetch(buildApiUrl(AUTH_LOGIN_PATH), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(loginData),
                    });

                    const apiResponse: ApiResponse<AuthResponse> = await response.json();

                    if (!response.ok) {
                        console.error("Erro HTTP na autenticação:", {
                            status: response.status,
                            message: apiResponse.message || response.statusText
                        });

                        // Return null with error details for better error handling
                        return null;
                    }

                    if (!apiResponse.success || !apiResponse.data) {
                        console.error("Erro na resposta da API:", apiResponse.message);
                        return null;
                    }

                    const { usuario, token: accessToken, refreshToken } = apiResponse.data;
                    const usuarioNormalizado = normalizeUsuario(usuario);
                    const usuarioNome = usuario.nome;

                    const user = {
                        id: usuarioNormalizado.idUsuario.toString(),
                        name: usuarioNome,
                        email: usuario.email,
                        usuario: usuarioNormalizado,
                        accessToken,
                        refreshToken,
                        accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
                    } as User & {
                        usuario: NormalizedUsuario;
                        accessToken: string;
                        refreshToken: string;
                        accessTokenExpires: number;
                    };

                    return user;
                } catch (error) {
                    console.error("Erro na autenticação:", error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60,
    },
    events: {
        async signOut() {
            // Redirect to login on signout
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
    },
    callbacks: {
        async jwt({ token, user }): Promise<any> {
            if (user) {
                const customUser = user as User & {
                    usuario: NormalizedUsuario;
                    accessToken: string;
                    refreshToken: string;
                    accessTokenExpires: number;
                };
                
                token.id = user.id;
                token.name = user.name || "";
                token.email = user.email || "";
                
                if (customUser.usuario) {
                    token.nome = customUser.usuario.nome;
                    token.status = customUser.usuario.status as "ativo" | "inativo" | "bloqueado";
                    token.perfilId = customUser.usuario.perfil?.idPerfil;
                    token.perfilNome = customUser.usuario.perfil?.nomePerfil ?? "";
                    token.permissoes = customUser.usuario.permissoes ?? [];
                }
                
                token.accessToken = customUser.accessToken;
                token.refreshToken = customUser.refreshToken;
                token.accessTokenExpires = customUser.accessTokenExpires;
                
                return token;
            }

            if (Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            if (token && session.user) {
                if (token.error) {
                    if (token.error === "UserNotFound") {
                        // User not found - force logout
                        if (typeof window !== "undefined") {
                            window.location.href = "/login";
                        }
                        throw new Error("Usuário não encontrado ou inativo");
                    }
                    // Token refresh error - force logout
                    if (typeof window !== "undefined") {
                        window.location.href = "/login";
                    }
                    throw new Error("Sessão expirada. Faça login novamente.");
                }

                session.user.id = token.id as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;

                const tokenNome = (token as any).nome as string | undefined;
                (session.user as any).nome = tokenNome ?? session.user.name;
                (session.user as any).nomeCompleto = tokenNome ?? session.user.name;
                (session.user as any).status = token.status as "ativo" | "inativo" | "bloqueado";
                (session.user as any).perfilId = token.perfilId;
                (session.user as any).perfilNome = (token as any).perfilNome ?? "";
                const permissoes = ((token as any).permissoes ?? []) as Array<{ modulo: string; acao: string }>;
                (session.user as any).permissoes = permissoes;
                (session.user as any).perfil = {
                    idPerfil: token.perfilId ?? 0,
                    nomePerfil: (token as any).perfilNome ?? "",
                    perfilPermissoes: permissoes.map((permissao) => ({ permissao })),
                };

                (session as any).accessToken = token.accessToken as string;
                (session as any).token = token.accessToken as string;

                // Debug logging
                if (process.env.NODE_ENV === "development") {
                    console.log("[NextAuth] Session callback - Token set:", {
                        hasAccessToken: !!(token.accessToken as string),
                        tokenPrefix: (token.accessToken as string)?.substring(0, 20) + "...",
                        userId: session.user.id,
                        userEmail: session.user.email
                    });
                }
            }
            return session;
        }
    },
    debug: process.env.NODE_ENV === "development",
};

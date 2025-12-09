import { getSession } from "next-auth/react";
import {
    ApiResponse,
    PaginationParams,
    PaginationResponse,
    Usuario,
    UsuarioAuth,
    Container,
    ContainerFilters,
    ContainerStatus,
    ContainerTrip,
    ContainerTripFilters,
    ContainerTripUpdate,
    TripsByClientFilters,
    Cliente,
    Seguradora,
    SeguradoraCreate,
    SeguradoraUpdate,
    SeguradoraFilters,
    SeguradoraContato,
    SeguradoraContatoCreate,
    SeguradoraContatoUpdate,
    SeguradoraDocumento,
    SeguradoraStats,
    Averbacao,
    DashboardData,
    SearchResponse,
    SearchParams,
    SearchFilters,
    SearchOrdenacao,
    SearchSugestao,
    AuthResponse,
    RefreshTokenResponse,
    UsuarioCreate,
    UsuarioUpdate,
    ContainerCreate,
    ContainerUpdate,
    ContainerTipo,
    ClienteCreate,
    ClienteUpdate,
    AverbacaoCreate,
    AverbacaoUpdate,
    AverbacaoApproval,
    AverbacaoFilters,
    AverbacaoRelatorio,
    DocumentoAverbacao,
    HistoricoAlteracao,
    HistoricoFilters,
    DashboardStats,
    PaginatedResponse,
    HistoricoResponse,
    HistoricoStats
} from "@/types/api";
import {
    ParametroSeguro,
    CreateParametroSeguroData,
    UpdateParametroSeguroData,
    CalculoSeguroRequest,
    CalculoSeguroResponse,
    ParametroSeguroFilters,
    ParametroSeguroListResponse
} from "@/types/parametro-seguro";
import {
    Perfil,
    PerfilFilters,
    PerfilCreate,
    PerfilUpdate
} from "@/types/perfil";
import { normalizeContainer, normalizeContainerTipo, normalizePaginatedResponse } from "./api-normalizers";

// Global token storage for API calls (set by SessionSyncProvider)
let globalToken: string | null = null;

export function setGlobalAuthToken(token: string | null) {
    globalToken = token;
    if (process.env.NODE_ENV === "development") {
        console.log("[API] Global token updated:", token ? `${token.substring(0, 20)}...` : "null");
    }
}

class ApiService {
    private baseURL: string;

    constructor() {
        this.baseURL = this.resolveBaseUrl();
    }

    private resolveBaseUrl(): string {
        const fallbackBase = "http://localhost:8000";
        const rawBase =
            (process.env.NEXT_PUBLIC_API_URL ||
                process.env.API_URL ||
                fallbackBase).trim();

        const normalizedBase = rawBase.replace(/\/+$/, "");
        const rawBasePath = (process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api").trim();

        if (!rawBasePath) {
            return normalizedBase || fallbackBase;
        }

        const normalizedPath = `/${rawBasePath.replace(/^\/+/, "").replace(/\/+$/, "")}`;

        if (normalizedBase.toLowerCase().endsWith(normalizedPath.toLowerCase())) {
            return normalizedBase;
        }

        return `${normalizedBase}${normalizedPath}`;
    }

    private async getAuthHeaders(): Promise<HeadersInit> {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        try {
            // First, try to use the global token (set by SessionSyncProvider)
            let token = globalToken;

            // If no global token, fall back to getSession()
            if (!token) {
                const session = await getSession();

                // Debug logging in development
                if (process.env.NODE_ENV === "development") {
                    console.log("[API] getAuthHeaders - No global token, trying getSession():", {
                        hasSession: !!session,
                        hasUser: !!(session as any)?.user,
                        hasToken: !!(session as any)?.token,
                        hasAccessToken: !!(session as any)?.accessToken,
                        sessionKeys: session ? Object.keys(session) : [],
                        userKeys: (session as any)?.user ? Object.keys((session as any).user) : []
                    });
                }

                // Try both token and accessToken fields
                token = (session as any)?.token || (session as any)?.accessToken;
            } else if (process.env.NODE_ENV === "development") {
                console.log("[API] getAuthHeaders - Using global token");
            }

            if (token) {
                headers.Authorization = `Bearer ${token}`;
                if (process.env.NODE_ENV === "development") {
                    console.log("[API] ✅ Authorization header added. Token (first 20 chars):", token.substring(0, 20) + "...");
                }
            } else {
                if (process.env.NODE_ENV === "development") {
                    console.warn("[API] ⚠️ No token found - API call will be unauthenticated");
                }
            }
        } catch (error) {
            console.error("[API] Error getting session:", error);
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const contentType = response.headers.get("content-type") ?? "";

        // Handle 401 Unauthorized - logout user
        if (response.status === 401) {
            console.error("[API] ❌ 401 Unauthorized received:", {
                url: response.url,
                status: response.status,
                statusText: response.statusText,
                contentType
            });

            // Try to get error message from response
            let errorMessage = "Sessão expirada. Faça login novamente.";
            try {
                if (contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                    console.error("[API] Error details:", errorData);
                } else {
                    const errorText = await response.text();
                    console.error("[API] Error text:", errorText);
                    if (errorText) errorMessage = errorText;
                }
            } catch (e) {
                console.error("[API] Could not parse error response:", e);
            }

            if (typeof window !== "undefined") {
                const { signOut } = await import("next-auth/react");
                await signOut({ callbackUrl: "/login" });
            }
            throw new Error(errorMessage);
        }

        if (!contentType.includes("application/json")) {
            const text = await response.text();

            if (response.status === 404) {
                return {
                    success: false,
                    message: "Recurso não encontrado",
                    error: text || `404 Not Found: ${response.url ?? ""}`,
                } as ApiResponse<T>;
            }

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            throw new Error("Resposta inesperada da API (conteúdo não é JSON).");
        }

        const data: ApiResponse<T> = await response.json();

        if (!response.ok) {
            const message = data?.message || data?.error || `Erro ${response.status}: ${response.statusText}`;

            // Check if error message indicates user not found or inactive
            if (message.includes("Usuário não encontrado") || message.includes("inativo")) {
                if (typeof window !== "undefined") {
                    const { signOut } = await import("next-auth/react");
                    await signOut({ callbackUrl: "/login" });
                }
            }

            throw new Error(message);
        }

        return data;
    }

    private buildQueryString(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                searchParams.append(key, value.toString());
            }
        });

        return searchParams.toString();
    }

    private sanitizePayload<T extends Record<string, any>>(payload: T): T {
        const sanitized: Record<string, any> = {};

        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                sanitized[key] = value;
            }
        });

        return sanitized as T;
    }

    private mapPaginated<T>(response: ApiResponse<any>, mapper: (item: any) => T): ApiResponse<PaginatedResponse<T>> {
        return {
            ...response,
            data: normalizePaginatedResponse(response.data, mapper),
        };
    }

    // Métodos HTTP genéricos
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        try {
            const url = new URL(`${this.baseURL}${endpoint}`);

            if (params) {
                const queryString = this.buildQueryString(params);
                if (queryString) {
                    url.search = queryString;
                }
            }

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: await this.getAuthHeaders(),
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
            }
            throw error;
        }
    }

    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: "POST",
                headers: await this.getAuthHeaders(),
                body: data ? JSON.stringify(data) : undefined,
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
            }
            throw error;
        }
    }

    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: "PUT",
                headers: await this.getAuthHeaders(),
                body: data ? JSON.stringify(data) : undefined,
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
            }
            throw error;
        }
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: "DELETE",
                headers: await this.getAuthHeaders(),
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
            }
            throw error;
        }
    }

    // Autenticação - Atualizado conforme nova documentação
    async login(email: string, senha: string): Promise<ApiResponse<AuthResponse>> {
        return this.post<AuthResponse>("/auth/login", { email, senha });
    }

    async register(userData: UsuarioCreate): Promise<ApiResponse<Usuario>> {
        return this.post<Usuario>("/auth/register", userData);
    }

    async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
        return this.post<RefreshTokenResponse>("/auth/refresh-token", { refreshToken });
    }

    async logout(): Promise<ApiResponse<void>> {
        return this.post<void>("/auth/logout");
    }

    async getProfile(): Promise<ApiResponse<Usuario>> {
        return this.get<Usuario>("/auth/profile");
    }

    async updateProfile(userData: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
        return this.put<Usuario>("/auth/profile", userData);
    }

    async changePassword(senhaAtual: string, novaSenha: string): Promise<ApiResponse<void>> {
        return this.put<void>("/auth/change-password", { senhaAtual, novaSenha });
    }

    // Métodos específicos para usuários v2
    async getUsuarios(params?: PaginationParams & { status?: string; perfil?: string; search?: string }) {
        return this.get<{ usuarios: Usuario[]; pagination: PaginationResponse }>("/usuarios", params);
    }

    async getUsuario(id: number) {
        return this.get<Usuario>(`/usuarios/${id}`);
    }

    async createUsuario(data: UsuarioCreate) {
        return this.post<Usuario>("/usuarios", data);
    }

    async updateUsuario(id: number, data: UsuarioUpdate) {
        return this.put<Usuario>(`/usuarios/${id}`, data);
    }

    async deleteUsuario(id: number) {
        return this.delete<void>(`/usuarios/${id}`);
    }

    async updateUsuarioStatus(id: number, status: "ativo" | "inativo") {
        return this.put<Usuario>(`/usuarios/${id}/status`, { status });
    }

    // Métodos específicos para containers v2
    async getContainers(params?: ContainerFilters): Promise<ApiResponse<PaginatedResponse<Container>>> {
        const response = await this.get<any>("/containers", params);
        return this.mapPaginated(response, normalizeContainer);
    }

    async getContainer(id: number): Promise<ApiResponse<Container>> {
        const response = await this.get<any>(`/containers/${id}`);
        return {
            ...response,
            data: response.data ? normalizeContainer(response.data) : undefined,
        };
    }

    async createContainer(data: ContainerCreate): Promise<ApiResponse<Container>> {
        const payload = this.sanitizePayload({
            nrContainer: data.nrContainer,
            idTipoContainer: data.idTipoContainer,
            proprietario: data.proprietario,
            anoFabricacao: data.anoFabricacao,
            valorContainer: data.valorContainer,
            statusContainer: data.statusContainer,
            observacoes: data.observacoes,
        });

        const response = await this.post<any>("/containers", payload);
        return {
            ...response,
            data: response.data ? normalizeContainer(response.data) : undefined,
        };
    }

    async updateContainer(id: number, data: ContainerUpdate): Promise<ApiResponse<Container>> {
        const payload = this.sanitizePayload({
            idTipoContainer: data.idTipoContainer,
            proprietario: data.proprietario,
            anoFabricacao: data.anoFabricacao,
            valorContainer: data.valorContainer,
            statusContainer: data.statusContainer,
            observacoes: data.observacoes,
        });

        const response = await this.put<any>(`/containers/${id}`, payload);
        return {
            ...response,
            data: response.data ? normalizeContainer(response.data) : undefined,
        };
    }

    async deleteContainer(id: number) {
        return this.delete<void>(`/containers/${id}`);
    }

    async searchContainers(termo: string, params?: Record<string, any>): Promise<ApiResponse<Container[]>> {
        const response = await this.get<any>("/containers/search/query", { termo, ...params });
        const rawItems = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data?.items)
                ? response.data.items
                : [];

        return {
            ...response,
            data: rawItems.map(normalizeContainer),
        };
    }

    async getContainersByStatus(status: ContainerStatus): Promise<ApiResponse<Container[]>> {
        const response = await this.get<any>(`/containers/status/${status}`);
        const items = Array.isArray(response.data) ? response.data : [];

        return {
            ...response,
            data: items.map(normalizeContainer),
        };
    }

    // ==================== CONTAINER TRIPS ====================

    async getTrips(params?: ContainerTripFilters): Promise<ApiResponse<PaginatedResponse<ContainerTrip>>> {
        return this.get<PaginatedResponse<ContainerTrip>>("/trips", params);
    }

    async getTrip(id: number): Promise<ApiResponse<ContainerTrip>> {
        return this.get<ContainerTrip>(`/trips/${id}`);
    }

    async updateTrip(id: number, data: ContainerTripUpdate): Promise<ApiResponse<ContainerTrip>> {
        return this.put<ContainerTrip>(`/trips/${id}`, data);
    }

    async deleteTrip(id: number): Promise<ApiResponse<void>> {
        return this.delete<void>(`/trips/${id}`);
    }

    async getContainersByCE(numeroCE: string): Promise<ApiResponse<{
        numeroCE: string;
        containers: Array<{
            idCeContainer: number;
            nrContainer: string;
            sequencia: number;
            ativo: boolean;
            tipoContainer?: string;
        }>;
        total: number;
    }>> {
        return this.get(`/trips/ce/${numeroCE}/containers`);
    }

    async getTripsByDateRange(dataInicio: string, dataFim: string, idCliente?: number): Promise<ApiResponse<ContainerTrip[]>> {
        const params: Record<string, any> = { dataInicio, dataFim };
        if (idCliente) params.idCliente = idCliente;
        return this.get<ContainerTrip[]>("/trips/date-range", params);
    }

    /**
     * Get trips by client and date range with pagination and filters
     * Used in Averbação Wizard Step 2
     */
    async getTripsByClient(filters: TripsByClientFilters): Promise<ApiResponse<PaginatedResponse<ContainerTrip>>> {
        return this.get<PaginatedResponse<ContainerTrip>>("/trips/by-client", filters);
    }

    /**
     * Get trips by IDs
     * Used in Averbação Wizard Step 3 to filter containers by selected trips
     */
    async getTripsByIds(tripIds: number[]): Promise<ApiResponse<ContainerTrip[]>> {
        return this.get<ContainerTrip[]>("/trips/by-ids", {
            ids: tripIds.join(',')
        });
    }

    async getContainersByDateRange(dataInicio: string, dataFim: string): Promise<ApiResponse<Container[]>> {
        const response = await this.get<any>("/containers/date-range/filter", { dataInicio, dataFim });
        const items = Array.isArray(response.data) ? response.data : [];

        return {
            ...response,
            data: items.map(normalizeContainer),
        };
    }

    async getContainerByNumber(numero: string): Promise<ApiResponse<Container>> {
        const response = await this.get<any>(`/containers/number/${numero}`);
        return {
            ...response,
            data: response.data ? normalizeContainer(response.data) : undefined,
        };
    }

    async getContainerTipos(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<ContainerTipo>>> {
        const response = await this.get<any>("/containers/tipos", params);
        return this.mapPaginated(response, (item) => {
            const tipo = normalizeContainerTipo(item);
            if (tipo) {
                const idTipo = Number.isNaN(tipo.idTipoContainer) ? Number(item?.idTipoContainer ?? item?.id ?? 0) : tipo.idTipoContainer;
                return {
                    ...tipo,
                    idTipoContainer: idTipo,
                };
            }

            return {
                idTipoContainer: Number(item?.idTipoContainer ?? item?.id ?? 0),
                tipoContainer: String(item?.tipoContainer ?? item?.nome ?? ""),
                descricao: item?.descricao ?? item?.description ?? undefined,
                pesoMaximoKg: typeof item?.pesoMaximoKg === "number" ? item.pesoMaximoKg : item?.pesoMaximo ?? undefined,
                ativo: typeof item?.ativo === "boolean" ? item.ativo : (item?.status ? item.status === "ativo" : undefined),
            };
        });
    }

    // Métodos específicos para averbações v2
    async getAverbacoes(params?: Partial<AverbacaoFilters>) {
        return this.get<PaginatedResponse<Averbacao>>("/averbacoes", params);
    }

    async getAverbacao(id: number) {
        return this.get<Averbacao>(`/averbacoes/${id}`);
    }

    async createAverbacao(data: AverbacaoCreate) {
        return this.post<Averbacao>("/averbacoes", data);
    }

    async updateAverbacao(id: number, data: AverbacaoUpdate) {
        return this.put<Averbacao>(`/averbacoes/${id}`, data);
    }

    async deleteAverbacao(id: number) {
        return this.delete<void>(`/averbacoes/${id}`);
    }

    async searchAverbacoes(termo: string, params?: PaginationParams) {
        return this.get<Averbacao[]>("/averbacoes/search", { termo, ...params });
    }

    async getAverbacoesByCliente(clienteId: number, params?: PaginationParams) {
        return this.get<Averbacao[]>(`/averbacoes/cliente/${clienteId}`, params);
    }

    async getAverbacoesByStatus(status: string, params?: PaginationParams) {
        return this.get<Averbacao[]>("/averbacoes/status", { status, ...params });
    }

    async approveAverbacao(id: number, data: AverbacaoApproval) {
        return this.put<Averbacao>(`/averbacoes/${id}/approve`, data);
    }

    async rejectAverbacao(id: number, data: AverbacaoApproval) {
        return this.put<Averbacao>(`/averbacoes/${id}/reject`, data);
    }

    async getRelatorioAverbacao(id: number) {
        return this.get<AverbacaoRelatorio>(`/averbacoes/${id}/relatorio`);
    }

    async recalcularAverbacao(id: number, dataReferencia?: string) {
        return this.post<RecalculoAverbacaoResponse>(
            `/averbacoes/${id}/recalcular`,
            dataReferencia ? { dataReferencia } : {}
        );
    }

    // Métodos para documentos de averbações
    async getDocumentosAverbacao(averbacaoId: number) {
        return this.get<DocumentoAverbacao[]>(`/averbacoes/${averbacaoId}/documentos`);
    }

    async uploadDocumentoAverbacao(averbacaoId: number, file: File, tipo?: string, descricao?: string): Promise<ApiResponse<DocumentoAverbacao>> {
        const formData = new FormData();
        formData.append("arquivo", file);
        if (tipo) formData.append("tipo", tipo);
        if (descricao) formData.append("descricao", descricao);

        const session = await getSession();
        const headers: HeadersInit = {};
        
        if (session?.token) {
            headers.Authorization = `Bearer ${session.token}`;
        }

        const response = await fetch(`${this.baseURL}/averbacoes/${averbacaoId}/documentos`, {
            method: "POST",
            headers,
            body: formData,
        });

        return this.handleResponse<DocumentoAverbacao>(response);
    }

    async deleteDocumentoAverbacao(averbacaoId: number, documentoId: number) {
        return this.delete<void>(`/averbacoes/${averbacaoId}/documentos/${documentoId}`);
    }

    async downloadDocumentoAverbacao(averbacaoId: number, documentoId: number) {
        const session = await getSession();
        const headers: HeadersInit = {};
        
        if (session?.token) {
            headers.Authorization = `Bearer ${session.token}`;
        }

        const response = await fetch(`${this.baseURL}/averbacoes/${averbacaoId}/documentos/${documentoId}/download`, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error("Erro ao baixar documento");
        }

        return response.blob();
    }

    // Métodos específicos para clientes v2
    async getClientes(params?: PaginationParams & { 
        status?: string; 
        search?: string;
    }): Promise<ApiResponse<PaginatedResponse<Cliente>>> {
        const response = await this.get<any>("/clientes", params);
        return this.mapPaginated(response, item => item as Cliente);
    }

    async getCliente(id: number) {
        return this.get<Cliente>(`/clientes/${id}`);
    }

    async createCliente(data: ClienteCreate) {
        return this.post<Cliente>("/clientes", data);
    }

    async updateCliente(id: number, data: ClienteUpdate) {
        return this.put<Cliente>(`/clientes/${id}`, data);
    }

    async deleteCliente(id: number) {
        return this.delete<void>(`/clientes/${id}`);
    }

    async updateClienteStatus(id: number, status: "ativo" | "inativo") {
        return this.put<Cliente>(`/clientes/${id}/status`, { status });
    }

    async getClienteWithFiliais(id: number) {
        return this.get<Cliente>(`/clientes/${id}/filiais`);
    }

    // Métodos para parâmetros de seguro (ClienteContainerSeguro)
    async getParametrosSeguroCliente(idCliente: number) {
        return this.get<ClienteContainerSeguro[]>(`/parametros-seguro/cliente/${idCliente}`);
    }

    async getParametroSeguro(idCliente: number, idTipoContainer: number) {
        return this.get<ClienteContainerSeguro>(`/parametros-seguro/cliente/${idCliente}/tipo/${idTipoContainer}`);
    }

    async getHistoricoParametroSeguro(idCliente: number, idTipoContainer: number) {
        return this.get<ClienteContainerSeguro[]>(`/parametros-seguro/cliente/${idCliente}/tipo/${idTipoContainer}/historico`);
    }

    async createParametroSeguro(data: ClienteContainerSeguroCreate) {
        return this.post<ClienteContainerSeguro>("/parametros-seguro", data);
    }

    async createParametrosPadrao(idCliente: number) {
        return this.post<{ created: number; parametros: ClienteContainerSeguro[] }>(
            `/parametros-seguro/cliente/${idCliente}/criar-padrao`,
            {}
        );
    }

    async updateParametroSeguro(idCliente: number, idTipoContainer: number, data: ClienteContainerSeguroUpdate) {
        return this.put<ClienteContainerSeguro>(
            `/parametros-seguro/cliente/${idCliente}/tipo/${idTipoContainer}`,
            data
        );
    }

    async deleteParametroSeguro(idCliente: number, idTipoContainer: number) {
        return this.delete<void>(`/parametros-seguro/cliente/${idCliente}/tipo/${idTipoContainer}`);
    }

    async getEstatisticasParametrosSeguro() {
        return this.get<any>("/parametros-seguro/estatisticas");
    }

    // Métodos específicos para seguradoras v2
    async getSeguradoras(params?: SeguradoraFilters): Promise<ApiResponse<PaginatedResponse<Seguradora>>> {
        const response = await this.get<any>("/seguradoras", params);
        return this.mapPaginated(response, item => item as Seguradora);
    }

    async getSeguradora(id: number) {
        return this.get<Seguradora>(`/seguradoras/${id}`);
    }

    async createSeguradora(data: SeguradoraCreate) {
        return this.post<Seguradora>("/seguradoras", data);
    }

    async updateSeguradora(id: number, data: SeguradoraUpdate) {
        return this.put<Seguradora>(`/seguradoras/${id}`, data);
    }

    async deleteSeguradora(id: number) {
        return this.delete<void>(`/seguradoras/${id}`);
    }

    async updateSeguradoraStatus(id: number, status: "ativa" | "inativa" | "suspensa") {
        return this.put<Seguradora>(`/seguradoras/${id}/status`, { status });
    }

    async searchSeguradoras(termo: string, params?: PaginationParams) {
        return this.get<{ seguradoras: Seguradora[]; pagination: PaginationResponse }>("/seguradoras/search", { termo, ...params });
    }

    async getSeguradorasByStatus(status: string, params?: PaginationParams) {
        return this.get<{ seguradoras: Seguradora[]; pagination: PaginationResponse }>("/seguradoras/status", { status, ...params });
    }

    async getSeguradoraStats(): Promise<ApiResponse<SeguradoraStats>> {
        return this.get<SeguradoraStats>("/seguradoras/stats");
    }

    // Métodos para contatos de seguradoras
    async getSeguradoraContatos(seguradoraId: number) {
        return this.get<SeguradoraContato[]>(`/seguradoras/${seguradoraId}/contatos`);
    }

    async getSeguradoraContato(seguradoraId: number, contatoId: number) {
        return this.get<SeguradoraContato>(`/seguradoras/${seguradoraId}/contatos/${contatoId}`);
    }

    async createSeguradoraContato(seguradoraId: number, data: SeguradoraContatoCreate) {
        return this.post<SeguradoraContato>(`/seguradoras/${seguradoraId}/contatos`, data);
    }

    async updateSeguradoraContato(seguradoraId: number, contatoId: number, data: SeguradoraContatoUpdate) {
        return this.put<SeguradoraContato>(`/seguradoras/${seguradoraId}/contatos/${contatoId}`, data);
    }

    async deleteSeguradoraContato(seguradoraId: number, contatoId: number) {
        return this.delete<void>(`/seguradoras/${seguradoraId}/contatos/${contatoId}`);
    }

    async setContatoPrincipal(seguradoraId: number, contatoId: number) {
        return this.put<SeguradoraContato>(`/seguradoras/${seguradoraId}/contatos/${contatoId}/principal`, {});
    }

    // Métodos para documentos de seguradoras
    async getSeguradoraDocumentos(seguradoraId: number) {
        return this.get<SeguradoraDocumento[]>(`/seguradoras/${seguradoraId}/documentos`);
    }

    async uploadSeguradoraDocumento(seguradoraId: number, file: File, tipoDocumento: string, observacoes?: string): Promise<ApiResponse<SeguradoraDocumento>> {
        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("tipoDocumento", tipoDocumento);
        if (observacoes) {
            formData.append("observacoes", observacoes);
        }

        const session = await getSession();
        const response = await fetch(`${this.baseURL}/seguradoras/${seguradoraId}/documentos`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session?.token}`,
            },
            body: formData,
        });

        return this.handleResponse<SeguradoraDocumento>(response);
    }

    async deleteSeguradoraDocumento(seguradoraId: number, documentoId: number) {
        return this.delete<void>(`/seguradoras/${seguradoraId}/documentos/${documentoId}`);
    }

    async downloadSeguradoraDocumento(seguradoraId: number, documentoId: number) {
        const session = await getSession();
        const response = await fetch(`${this.baseURL}/seguradoras/${seguradoraId}/documentos/${documentoId}/download`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${session?.token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Erro ao baixar documento");
        }

        return response.blob();
    }

    async updateSeguradoraDocumento(seguradoraId: number, documentoId: number, data: { observacoes?: string; dataVencimento?: string }) {
        return this.put<SeguradoraDocumento>(`/seguradoras/${seguradoraId}/documentos/${documentoId}`, data);
    }

    // Métodos específicos para permissões v2
    async getPermissoes(params?: PaginationParams) {
        return this.get<any[]>("/permissoes", params);
    }

    async getPermissao(id: number) {
        return this.get<any>(`/permissoes/${id}`);
    }

    async createPermissao(data: any) {
        return this.post<any>("/permissoes", data);
    }

    async updatePermissao(id: number, data: any) {
        return this.put<any>(`/permissoes/${id}`, data);
    }

    async deletePermissao(id: number) {
        return this.delete<void>(`/permissoes/${id}`);
    }

    // Dashboard v2 - Atualizado conforme nova documentação
    async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
        return this.get<DashboardStats>("/dashboard/stats");
    }

    async getDashboardOperations(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<any>>> {
        return this.get<PaginatedResponse<any>>("/dashboard/operations", params);
    }

    async getDashboardActions(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<any>>> {
        return this.get<PaginatedResponse<any>>("/dashboard/actions", params);
    }

    // Histórico de alterações
    async getHistoricoAverbacao(averbacaoId: number, params?: HistoricoFilters) {
        return this.get<{ data: HistoricoAlteracao[]; pagination: PaginationResponse }>(`/averbacoes/${averbacaoId}/historico`, params);
    }

    async getHistoricoCompleto(params?: HistoricoFilters) {
        return this.get<{ data: HistoricoAlteracao[]; pagination: PaginationResponse }>("/historico-alteracoes", params);
    }

    // Busca avançada v2
    async search(params: SearchParams): Promise<ApiResponse<SearchResponse>> {
        return this.get<SearchResponse>("/search", params);
    }

    async searchSugestoes(termo: string): Promise<ApiResponse<SearchSugestao[]>> {
        return this.get<SearchSugestao[]>("/search/sugestoes", { termo });
    }

    async searchQuick(termo: string): Promise<ApiResponse<SearchResponse>> {
        return this.get<SearchResponse>("/search/quick", { termo, limit: 5 });
    }

    // Upload de arquivos v2
    async uploadFile(file: File, tipo?: string): Promise<ApiResponse<any>> {
        const formData = new FormData();
        formData.append("file", file);
        if (tipo) formData.append("tipo", tipo);

        const session = await getSession();
        const headers: HeadersInit = {};
        
        if (session?.token) {
            headers.Authorization = `Bearer ${session.token}`;
        }

        const response = await fetch(`${this.baseURL}/upload`, {
            method: "POST",
            headers,
            body: formData,
        });

        return this.handleResponse<any>(response);
    }

    // Histórico v2 - Conforme nova documentação
    async getHistorico(params?: {
        tabela?: string;
        operacao?: "CREATE" | "UPDATE" | "DELETE";
        usuario?: number;
        dataInicio?: string;
        dataFim?: string;
        page?: number;
        limit?: number;
    }) {
        return this.get<HistoricoResponse>("/historico", params);
    }

    async getHistoricoStats(periodo?: number) {
        const params = periodo ? { periodo } : undefined;
        return this.get<HistoricoStats>("/historico/stats", params);
    }

    // ====================================
    // PARÂMETROS DE SEGURO
    // ====================================

    async getParametrosSeguro(filters?: ParametroSeguroFilters) {
        return this.get<ParametroSeguroListResponse>("/parametros-seguro", filters);
    }

    async getParametrosSeguroAtivos() {
        return this.get<{ data: ParametroSeguro[] }>("/parametros-seguro/ativos");
    }

    async getParametroSeguroGeralById(id: number) {
        return this.get<{ data: ParametroSeguro }>(`/parametros-seguro/${id}`);
    }

    async createParametroSeguroGeral(data: CreateParametroSeguroData) {
        return this.post<{ data: ParametroSeguro }>("/parametros-seguro", data);
    }

    async updateParametroSeguroGeral(id: number, data: UpdateParametroSeguroData) {
        return this.put<{ data: ParametroSeguro }>(`/parametros-seguro/${id}`, data);
    }

    async deleteParametroSeguroGeral(id: number) {
        return this.delete(`/parametros-seguro/${id}`);
    }

    async calcularSeguro(data: CalculoSeguroRequest) {
        return this.post<{ data: CalculoSeguroResponse }>("/parametros-seguro/calcular", data);
    }

    // ==================== PERFIS ====================

    async getPerfis(filters?: PerfilFilters) {
        const params = new URLSearchParams();

        if (filters?.page) params.append("page", String(filters.page));
        if (filters?.limit) params.append("limit", String(filters.limit));
        if (filters?.search) params.append("search", filters.search);
        if (filters?.ativo !== undefined) params.append("ativo", String(filters.ativo));
        if (filters?.nivelAcesso) params.append("nivelAcesso", String(filters.nivelAcesso));

        const queryString = params.toString();
        return this.get<{ data: Perfil[]; pagination: any }>(
            `/perfis${queryString ? `?${queryString}` : ""}`
        );
    }

    async getPerfilById(id: number) {
        return this.get<{ data: Perfil }>(`/perfis/${id}`);
    }

    async createPerfil(data: PerfilCreate) {
        return this.post<{ data: Perfil }>("/perfis", data);
    }

    async updatePerfil(id: number, data: PerfilUpdate) {
        return this.put<{ data: Perfil }>(`/perfis/${id}`, data);
    }

    async deletePerfil(id: number) {
        return this.delete(`/perfis/${id}`);
    }

    async getPerfisAtivos() {
        return this.get<{ data: Perfil[] }>("/perfis?ativo=true&limit=1000");
    }

    async getPerfilPermissoes(idPerfil: number) {
        return this.get<{ data: any[] }>(`/perfis/${idPerfil}/permissoes`);
    }

    async syncPerfilPermissoes(idPerfil: number, permissoes: number[] | Array<{ idPermissao: number }>) {
        return this.put<{ data: any[] }>(`/perfis/${idPerfil}/permissoes`, { permissoes });
    }

    async getAllPermissoes() {
        return this.get<{ data: any[] }>("/permissoes?limit=100");
    }
}

// Instância singleton
export const apiService = new ApiService();

// Hook personalizado para usar o serviço de API
export const useApi = () => {
    return apiService;
};

export { getOpenApiClient } from "./openapi/client";


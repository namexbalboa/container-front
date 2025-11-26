import { Container, ContainerStatus, ContainerTipo, PaginatedResponse, PaginationInfo } from "@/types/api";

const DEFAULT_PAGINATION: PaginationInfo = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
};

const COLLECTION_KEYS = [
    "items",
    "data",
    "containers",
    "averbacoes",
    "usuarios",
    "clientes",
    "seguradoras",
    "results",
];

export function normalizePagination(raw?: any): PaginationInfo {
    if (!raw || typeof raw !== "object") {
        return { ...DEFAULT_PAGINATION };
    }

    const page = raw.page ?? raw.currentPage ?? raw.current_page ?? DEFAULT_PAGINATION.currentPage;
    const limit = raw.limit ?? raw.itemsPerPage ?? raw.per_page ?? DEFAULT_PAGINATION.itemsPerPage;
    const total = raw.total ?? raw.totalItems ?? raw.total_items ?? DEFAULT_PAGINATION.totalItems;
    const totalPages = raw.totalPages ?? raw.pages ?? raw.total_pages ?? DEFAULT_PAGINATION.totalPages;
    const hasNext = raw.hasNext ?? raw.hasNextPage ?? raw.has_next ?? DEFAULT_PAGINATION.hasNextPage;
    const hasPrev = raw.hasPrev ?? raw.hasPreviousPage ?? raw.has_prev ?? DEFAULT_PAGINATION.hasPreviousPage;

    return {
        currentPage: Number(page) || DEFAULT_PAGINATION.currentPage,
        itemsPerPage: Number(limit) || DEFAULT_PAGINATION.itemsPerPage,
        totalItems: Number(total) || DEFAULT_PAGINATION.totalItems,
        totalPages: Number(totalPages) || DEFAULT_PAGINATION.totalPages,
        hasNextPage: Boolean(hasNext),
        hasPreviousPage: Boolean(hasPrev),
    };
}

function extractCollection(payload: any): { items: any[]; pagination: any } {
    if (!payload) {
        return { items: [], pagination: undefined };
    }

    if (Array.isArray(payload)) {
        return { items: payload, pagination: undefined };
    }

    if (Array.isArray(payload.items)) {
        return { items: payload.items, pagination: payload.pagination ?? payload.meta };
    }

    for (const key of COLLECTION_KEYS) {
        if (Array.isArray(payload[key])) {
            return { items: payload[key], pagination: payload.pagination ?? payload.meta ?? payload[key + "Pagination"] };
        }
    }

    if (typeof payload.data === "object" && !Array.isArray(payload.data)) {
        return extractCollection(payload.data);
    }

    return { items: [], pagination: payload.pagination ?? payload.meta };
}

export function normalizePaginatedResponse<T>(
    payload: any,
    mapper?: (item: any) => T
): PaginatedResponse<T> {
    const { items, pagination } = extractCollection(payload);
    const normalizedItems = mapper ? items.map(mapper) : (items as T[]);

    return {
        items: normalizedItems ?? [],
        pagination: normalizePagination(pagination),
    };
}

function normalizeStatus(status?: string): ContainerStatus {
    const normalized = (status ?? "").toLowerCase();
    if (normalized === "ativo" || normalized === "inativo" || normalized === "entregue") {
        return normalized as ContainerStatus;
    }
    if (normalized === "em_transito" || normalized === "em-transito" || normalized === "em transito") {
        return "em_transito";
    }
    return "ativo";
}

export function normalizeContainerTipo(tipo: any): ContainerTipo | undefined {
    if (!tipo) return undefined;

    if (typeof tipo === "string") {
        return {
            idTipoContainer: Number.NaN,
            tipoContainer: tipo,
        };
    }

    return {
        idTipoContainer: Number(tipo.idTipoContainer ?? tipo.id ?? tipo.tipoContainerId ?? Number.NaN),
        tipoContainer: tipo.tipoContainer ?? tipo.nome ?? tipo.name ?? "",
        descricao: tipo.descricao ?? tipo.description ?? undefined,
        pesoMaximoKg: typeof tipo.pesoMaximoKg === "number" ? tipo.pesoMaximoKg : undefined,
        ativo: typeof tipo.ativo === "boolean" ? tipo.ativo : undefined,
    };
}

export function normalizeContainer(raw: any): Container {
    if (!raw || typeof raw !== "object") {
        return {
            idContainerRegistro: 0,
            nrContainer: "",
            idTipoContainer: 0,
            statusContainer: "ativo",
            dataRegistro: new Date(0).toISOString(),
        };
    }

    const tipoContainer = normalizeContainerTipo(
        raw.tipoContainer ?? raw.tipo ?? raw.containerTipo ?? raw.container_type
    );

    const status = normalizeStatus(raw.statusContainer ?? raw.status);

    return {
        idContainerRegistro: Number(raw.idContainerRegistro ?? raw.idContainer ?? raw.id ?? 0),
        nrContainer: String(raw.nrContainer ?? raw.numeroContainer ?? raw.numero ?? ""),
        idTipoContainer: Number(raw.idTipoContainer ?? tipoContainer?.idTipoContainer ?? 0),
        statusContainer: status,
        proprietario: raw.proprietario ?? raw.owner ?? undefined,
        anoFabricacao: raw.anoFabricacao ? Number(raw.anoFabricacao) : undefined,
        valorContainer: raw.valorContainer !== undefined ? Number(raw.valorContainer) : undefined,
        dataRegistro: raw.dataRegistro ?? raw.dataCriacao ?? raw.createdAt ?? new Date().toISOString(),
        dataAtualizacao: raw.dataAtualizacao ?? raw.updatedAt ?? undefined,
        observacoes: raw.observacoes ?? raw.notes ?? undefined,
        tipoContainer,
        numero: String(raw.nrContainer ?? raw.numeroContainer ?? raw.numero ?? ""),
        status,
    };
}

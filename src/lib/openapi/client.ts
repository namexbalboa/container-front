import createClient from "openapi-fetch";
import { getSession } from "next-auth/react";

import type { paths } from "@/types/api-contract";

const FALLBACK_BASE_URL = "http://localhost:8000";
const FALLBACK_BASE_PATH = "/api";

let cachedBaseUrl: string | null = null;
let cachedClient: ReturnType<typeof createClient<paths>> | null = null;

function resolveBaseUrl(): string {
    if (cachedBaseUrl) {
        return cachedBaseUrl;
    }

    const rawBase = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || FALLBACK_BASE_URL).trim();
    const normalizedBase = rawBase.replace(/\/+$/, "");
    const rawPath = (process.env.NEXT_PUBLIC_API_BASE_PATH ?? FALLBACK_BASE_PATH).trim();
    const normalizedPath = rawPath ? `/${rawPath.replace(/^\/+/, "").replace(/\/+$/, "")}` : "";

    if (normalizedBase.toLowerCase().endsWith(normalizedPath.toLowerCase())) {
        cachedBaseUrl = normalizedBase;
    } else {
        cachedBaseUrl = `${normalizedBase}${normalizedPath}`;
    }

    return cachedBaseUrl;
}

export function getOpenApiClient() {
    if (cachedClient) {
        return cachedClient;
    }

    const client = createClient<paths>({
        baseUrl: resolveBaseUrl(),
    });

    client.use(async (request, next) => {
        const session = await getSession();
        const headers = new Headers(request.headers);

        headers.set("Accept", "application/json");

        if (session?.token && !headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${session.token}`);
        }

        if (!headers.has("Content-Type") && request.method !== "GET" && request.method !== "HEAD") {
            headers.set("Content-Type", "application/json");
        }

        const response = await next(new Request(request, { headers }));
        return response;
    });

    cachedClient = client;
    return client;
}

export type OpenApiClient = ReturnType<typeof getOpenApiClient>;

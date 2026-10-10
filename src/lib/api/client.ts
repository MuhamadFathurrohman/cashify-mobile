import { clearTokens, getTokens } from "@/lib/storage/keychain";
import { ApiError } from "@/types/api";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiRequestError extends Error {
    constructor (
        public code: string,
        message: string,
        public status: number,
        public details?: ApiError["error"]["details"]
    ) {
        super(message);
        this.name = "ApiRequestError";
    }
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    requiresAuth = true
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (requiresAuth) {
        const tokens = await getTokens();
        if (!tokens) {
            throw new ApiRequestError("UNAUTHORIZED", "Sesi tidak ditemukan", 401);
        }
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const body = await response.json();

    if (!response.ok) {
        const error = body as ApiError;
        if (response.status === 401) {
            await clearTokens();
        }
        throw new ApiRequestError(
            error.error.code,
            error.error.message,
            response.status,
            error.error.details
        );
    }

    return body as T;
}

export const apiClient = {
    get: <T>(path: string) =>
        request<T>(path),

    post: <T>(path: string, body: unknown, requiresAuth = true) =>
        request<T>(path, {method: "POST", body: JSON.stringify(body) }, requiresAuth),

    patch: <T>(path: string, body: unknown) =>
        request<T>(path, {method: "PATCH", body: JSON.stringify(body) }),

    delete: <T>(path: string) =>
        request<T>(path, {method: "DELETE"}),
}
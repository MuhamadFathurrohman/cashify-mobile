import { clearTokens, getTokens, saveTokens } from "@/lib/storage/keychain";
import type { ApiError, RefreshRequest, RefreshResponse } from "@/types/api";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
// Batas tunggu respons; tanpa ini fetch bisa menggantung (mis. bootstrap macet di splash)
const REQUEST_TIMEOUT_MS = 15_000;

export class ApiRequestError extends Error {
    constructor(
        public code: string,
        message: string,
        public status: number,
        public details?: ApiError["error"]["details"]
    ) {
        super(message);
        this.name = "ApiRequestError";
    }
}

// Diisi auth store: dipanggil saat sesi tidak bisa dipulihkan (token dihapus)
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
    sessionExpiredHandler = handler;
}

async function expireSession() {
    await clearTokens();
    sessionExpiredHandler?.();
}

async function send(
    path: string,
    options: RequestInit,
    accessToken?: string
): Promise<Response> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
            signal: controller.signal,
        });
    } catch {
        // fetch hanya melempar error jika request tidak sampai ke server
        throw new ApiRequestError(
            "NETWORK_ERROR",
            controller.signal.aborted
                ? "Server tidak merespons. Coba lagi."
                : "Tidak dapat terhubung ke server. Periksa koneksi kamu.",
            0
        );
    } finally {
        clearTimeout(timer);
    }
}

// Body bisa bukan JSON (mis. HTML dari proxy), jangan sampai melempar SyntaxError
async function parseBody(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return undefined;
    }
}

function toApiError(status: number, body: unknown): ApiRequestError {
    const error = (body as Partial<ApiError> | undefined)?.error;
    if (error?.code && error.message) {
        return new ApiRequestError(error.code, error.message, status, error.details);
    }
    return new ApiRequestError(
        "INVALID_RESPONSE",
        "Server memberikan respons yang tidak valid. Coba lagi.",
        status
    );
}

function isRefreshResponse(body: unknown): body is RefreshResponse {
    const session = (body as Partial<RefreshResponse> | undefined)?.session;
    return !!session?.access_token && !!session?.refresh_token;
}

// true = token baru tersimpan, false = refresh token ditolak (sesi berakhir).
// Kegagalan sementara (jaringan, 429, 5xx) dilempar agar token tidak ikut terhapus.
async function doRefresh(): Promise<boolean> {
    const tokens = await getTokens();
    if (!tokens) return false;

    const payload: RefreshRequest = { refresh_token: tokens.refreshToken };
    const response = await send("/auth/refresh", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    const body = await parseBody(response);

    if (response.ok && isRefreshResponse(body)) {
        await saveTokens({
            accessToken: body.session.access_token,
            refreshToken: body.session.refresh_token,
        });
        return true;
    }
    if (response.status === 400 || response.status === 401) return false;
    throw toApiError(response.status, body);
}

// Satu refresh untuk semua request paralel: refresh token dirotasi,
// jadi dua refresh bersamaan bisa saling membatalkan
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
    if (!refreshing) {
        refreshing = doRefresh().finally(() => {
            refreshing = null;
        });
    }
    return refreshing;
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    requiresAuth = true,
    isRetry = false
): Promise<T> {
    let accessToken: string | undefined;

    if (requiresAuth) {
        const tokens = await getTokens();
        if (!tokens) {
            await expireSession();
            throw new ApiRequestError("UNAUTHORIZED", "Sesi tidak ditemukan", 401);
        }
        accessToken = tokens.accessToken;
    }

    const response = await send(path, options, accessToken);

    if (response.status === 204) {
        return undefined as T;
    }

    const body = await parseBody(response);

    if (response.ok) {
        if (body === undefined) throw toApiError(response.status, body);
        return body as T;
    }

    // 401 pada endpoint publik (mis. login salah) bukan tanda sesi berakhir
    if (response.status === 401 && requiresAuth) {
        if (!isRetry && (await refreshSession())) {
            return request<T>(path, options, requiresAuth, true);
        }
        await expireSession();
    }

    throw toApiError(response.status, body);
}

export const apiClient = {
    get: <T>(path: string) =>
        request<T>(path),

    post: <T>(path: string, body: unknown, requiresAuth = true) =>
        request<T>(path, { method: "POST", body: JSON.stringify(body) }, requiresAuth),

    patch: <T>(path: string, body: unknown) =>
        request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

    delete: <T>(path: string) =>
        request<T>(path, { method: "DELETE" }),
};
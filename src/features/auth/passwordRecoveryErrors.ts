import { ApiRequestError } from "@/lib/api/client";

export interface RecoveryErrorResult {
    // Terisi bila error milik kolom email (tampil di bawah kolom); kosong → toast
    field?: "email";
    message: string;
    // Terisi bila server menyebut waktu tunggu (429)
    retryAfterSeconds?: number;
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

export function resolveForgotPasswordError(error: Error): RecoveryErrorResult {
    if (!(error instanceof ApiRequestError)) {
        return { message: GENERIC_MESSAGE };
    }

    const details = error.details ?? [];

    switch (error.code) {
        case "VALIDATION_ERROR":
            return details.some((d) => d.field === "email")
                ? {
                    field: "email",
                    message: error.message || "Format email tidak valid",
                }
                : { message: error.message || GENERIC_MESSAGE };

        case "RATE_LIMITED": {
            // Nilai dari Supabase di backend di-hardcode 60 detik; jangan menyebut durasi di pesan
            const retryAfterSeconds = details.find(
                (d) => typeof d.retry_after_seconds === "number",
            )?.retry_after_seconds;
            return {
                message: "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.",
                retryAfterSeconds,
            };
        }

        case "INTERNAL_ERROR":
            return { message: "Terjadi kesalahan pada server. Coba lagi nanti." };

        // SERVICE_UNAVAILABLE, NETWORK_ERROR, INVALID_RESPONSE: pesan sudah berbahasa Indonesia
        default:
            return { message: error.message || GENERIC_MESSAGE };
    }
}

export interface ResetErrorResult {
    // Terisi bila error milik kolom kata sandi (tampil di bawah kolom); kosong → toast
    field?: "password";
    message: string;
    // Token pemulihan tidak bisa dipakai lagi: arahkan minta tautan baru
    invalidLink?: boolean;
}

const INVALID_LINK_MESSAGE = "Tautan tidak valid atau sudah dipakai. Minta tautan baru.";

export function resolveResetPasswordError(error: Error): ResetErrorResult {
    if (!(error instanceof ApiRequestError)) {
        return { message: GENERIC_MESSAGE };
    }

    const details = error.details ?? [];

    switch (error.code) {
        case "UNAUTHORIZED":
            return { message: INVALID_LINK_MESSAGE, invalidLink: true };

        case "VALIDATION_ERROR": {
            if (details.some((d) => d.field === "token")) {
                return { message: INVALID_LINK_MESSAGE, invalidLink: true };
            }
            const issue = details.find((d) => d.field === "password")?.issue;
            if (issue === "same_password") {
                return {
                    field: "password",
                    message: "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
                };
            }
            if (issue === "weak_password") {
                return {
                    field: "password",
                    message: "Kata sandi terlalu lemah. Coba kombinasi lain.",
                };
            }
            if (details.some((d) => d.field === "password")) {
                return { field: "password", message: error.message || GENERIC_MESSAGE };
            }
            return { message: error.message || GENERIC_MESSAGE };
        }

        case "INTERNAL_ERROR":
            return { message: "Terjadi kesalahan pada server. Coba lagi nanti." };

        // SERVICE_UNAVAILABLE, NETWORK_ERROR, INVALID_RESPONSE: pesan sudah berbahasa Indonesia
        default:
            return { message: error.message || GENERIC_MESSAGE };
    }
}
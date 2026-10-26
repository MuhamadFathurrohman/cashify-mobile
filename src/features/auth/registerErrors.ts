import { ApiRequestError } from "@/lib/api/client";

export type RegisterErrorField = "email" | "password";

export interface RegisterErrorResult {
    // Terisi bila error milik satu kolom (tampil di bawah kolom); kosong → tampilkan sebagai toast.
    field?: RegisterErrorField;
    message: string;
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

function formatRetryAfter(seconds: number): string {
    return `${Math.max(1, Math.ceil(seconds / 60))} menit`;
}

export function resolveRegisterError(error: Error): RegisterErrorResult {
    if (!(error instanceof ApiRequestError)) {
        return { message: GENERIC_MESSAGE };
    }

    const details = error.details ?? [];

    switch (error.code) {
        case "CONFLICT":
            // 409: email sudah terpakai (termasuk metode masuk lain); pesan server sudah berbahasa Indonesia
            return { field: "email", message: error.message };

        case "VALIDATION_ERROR":
            if (
                details.some(
                    (d) => d.field === "password" && d.issue === "weak_password",
                )
            ) {
                return {
                    field: "password",
                    message: "Kata sandi terlalu lemah. Coba kombinasi lain.",
                };
            }
            return { message: error.message || GENERIC_MESSAGE };

        case "RATE_LIMITED": {
            // Jangan menyebut durasi bila server tidak mengirim retry_after_seconds
            const retryAfter = details.find(
                (d) => typeof d.retry_after_seconds === "number",
            )?.retry_after_seconds;
            return {
                message: retryAfter
                    ? `Terlalu banyak percobaan. Coba lagi dalam ${formatRetryAfter(retryAfter)}.`
                    : "Terlalu banyak percobaan pendaftaran. Coba lagi nanti.",
            };
        }

        case "INTERNAL_ERROR":
            return { message: "Terjadi kesalahan pada server. Coba lagi nanti." };

        // SERVICE_UNAVAILABLE, NETWORK_ERROR, INVALID_RESPONSE: pesan sudah berbahasa Indonesia
        default:
            return { message: error.message || GENERIC_MESSAGE };
    }
}
// ⚠️ DEV BUILD REQUIRED: file ini dipakai saat Google Sign-In aktif.
// Aktifkan setelah development build siap dan webClientId diisi di app.json.

import { ApiRequestError } from "@/lib/api/client";

// ─── Kode error dari @react-native-google-signin/google-signin ────────────────
// Referensi: https://react-native-google-signin.github.io/docs/errors
const GOOGLE_SIGNIN_ERROR = {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",   // user menutup dialog
    IN_PROGRESS: "IN_PROGRESS",               // sign-in sedang berjalan
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
    SIGN_IN_REQUIRED: "SIGN_IN_REQUIRED",
    ONE_TAP_START_FAILED: "ONE_TAP_START_FAILED",
} as const;

// ─── Helper: format retry_after_seconds → "X menit" ──────────────────────────
function formatRetryAfter(seconds: number): string {
    return `${Math.max(1, Math.ceil(seconds / 60))} menit`;
}

// ─── Resolver error Google Sign-In native ────────────────────────────────────
// Mengembalikan null jika error tidak perlu ditampilkan ke user (mis. cancel)
export function resolveGoogleSignInError(error: unknown): string | null {
    if (error instanceof Error) {
        const code = (error as any).code as string | undefined;

        // User menutup dialog sendiri — tidak perlu toast
        if (code === GOOGLE_SIGNIN_ERROR.SIGN_IN_CANCELLED) return null;

        // Sign-in sedang berjalan (ketukan ganda) — tidak perlu toast
        if (code === GOOGLE_SIGNIN_ERROR.IN_PROGRESS) return null;

        // Google Play Services tidak tersedia — jarang di emulator modern
        if (code === GOOGLE_SIGNIN_ERROR.PLAY_SERVICES_NOT_AVAILABLE) {
            return "Google Play Services tidak tersedia di perangkat ini.";
        }

        // One Tap gagal — fallback ke flow standar sudah ditangani di handler
        if (code === GOOGLE_SIGNIN_ERROR.ONE_TAP_START_FAILED) return null;
    }

    return "Gagal menghubungkan ke Google. Coba lagi.";
}

// ─── Resolver error dari backend POST /auth/google ───────────────────────────
export function resolveGoogleAuthError(error: Error): string {
    if (error instanceof ApiRequestError) {
        switch (error.code) {
            case "UNAUTHORIZED":
                return "Token Google tidak valid. Coba masuk ulang.";
            case "CONFLICT":
                // Email terdaftar via password — arahkan user ke login biasa
                return "Email ini sudah terdaftar dengan metode lain. Gunakan email dan password untuk masuk.";
            case "RATE_LIMITED": {
                const retryAfter = (error.details ?? []).find(
                    (d) => typeof d.retry_after_seconds === "number",
                )?.retry_after_seconds;
                return retryAfter
                    ? `Terlalu banyak percobaan. Coba lagi dalam ${formatRetryAfter(retryAfter)}.`
                    : "Terlalu banyak percobaan. Coba lagi nanti.";
            }
            case "SERVICE_UNAVAILABLE":
                return "Layanan sedang tidak tersedia. Coba lagi nanti.";
            default:
                return error.message ?? "Terjadi kesalahan. Coba lagi.";
        }
    }
    return "Tidak dapat terhubung ke server. Periksa koneksi kamu.";
}
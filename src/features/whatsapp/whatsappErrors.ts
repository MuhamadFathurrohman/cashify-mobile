import { ApiRequestError } from "@/lib/api/client";

// Pesan backend berbahasa Indonesia dan aman ditampilkan. Dipakai apa adanya untuk
// 404, 409, 429, 503, dan gagal jaringan; kode lain diberi pesan umum.
function backendMessage(err: unknown): string | null {
    if (!(err instanceof ApiRequestError)) return null;
    if (err.code === "NETWORK_ERROR") return err.message;
    if ([404, 409, 429, 503].includes(err.status)) return err.message;
    return null;
}

// POST /whatsapp/link/request
export function describeLinkError(err: unknown): string {
    return (
        backendMessage(err) ??
        "Nomor tidak dapat dihubungkan. Periksa nomor dan coba lagi."
    );
}

// POST /whatsapp/link/resend
export function describeResendError(err: unknown): string {
    if (err instanceof ApiRequestError && err.status === 404) {
        return "Permintaan kode sudah tidak aktif. Kembali dan masukkan nomor lagi.";
    }
    return backendMessage(err) ?? "Kode tidak dapat dikirim ulang. Coba lagi.";
}

// POST /whatsapp/link/verify
export function describeVerifyError(err: unknown): string {
    if (err instanceof ApiRequestError) {
        if (err.details?.some((d) => d.issue === "attempts_exhausted")) {
            return "Percobaan habis. Minta kode baru.";
        }
        const invalid = err.details?.find((d) => d.issue === "invalid");
        if (invalid) {
            return typeof invalid.attempts_left === "number"
                ? `Kode salah. Sisa percobaan: ${invalid.attempts_left}.`
                : "Kode salah. Periksa dan coba lagi.";
        }
    }
    return backendMessage(err) ?? "Verifikasi gagal. Coba lagi.";
}

// Sisa jeda dari backend (429); null bila tidak ada
export function getRetryAfterSeconds(err: unknown): number | null {
    if (!(err instanceof ApiRequestError)) return null;
    const detail = err.details?.find(
        (d) => typeof d.retry_after_seconds === "number"
    );
    return detail?.retry_after_seconds ?? null;
}
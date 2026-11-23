import { ApiRequestError } from "@/lib/api/client";

// Pesan jaringan dari apiClient sudah berbahasa Indonesia dan lebih spesifik
// daripada pesan fallback tiap layar. Galat lain memakai fallback milik konteks.
// Dipakai bersama oleh Tambah, Detail, dan Ubah transaksi agar kalimatnya konsisten.
export function networkOrFallbackMessage(
    error: unknown,
    fallback: string,
): string {
    return error instanceof ApiRequestError && error.code === "NETWORK_ERROR"
        ? error.message
        : fallback;
}

import { ApiRequestError } from "@/lib/api/client";

export type TransactionFormField =
    | "amount"
    | "categoryId"
    | "accountId"
    | "date"
    | "description";

export interface TransactionErrorInfo {
    message: string;
    // Diisi bila galat bisa dikaitkan ke satu kolom; kosong = tampilkan sebagai toast
    field?: TransactionFormField;
}

// Nama field pada details[] mengikuti nama kunci body (❓ belum diuji dengan respons nyata)
const FIELD_MAP: Record<string, TransactionFormField> = {
    amount: "amount",
    category_id: "categoryId",
    account_id: "accountId",
    date: "date",
    description: "description",
};

const GENERIC_MESSAGE = "Transaksi gagal disimpan. Coba lagi.";

// Pesan backend dipakai apa adanya untuk VALIDATION_ERROR (berbahasa Indonesia menurut
// contoh di OpenAPI) karena daftar nilai `issue` belum terdokumentasi lengkap; tidak ada
// pemetaan `issue` yang ditebak di sini.
export function resolveTransactionError(error: unknown): TransactionErrorInfo {
    if (!(error instanceof ApiRequestError)) {
        return { message: GENERIC_MESSAGE };
    }

    switch (error.code) {
        case "VALIDATION_ERROR": {
            const detail = error.details?.find(
                (item) => item.field !== undefined && item.field in FIELD_MAP
            );
            return {
                message: error.message,
                field: detail?.field ? FIELD_MAP[detail.field] : undefined,
            };
        }
        case "NOT_FOUND":
            // Untuk POST /transactions: kategori atau dompet tidak ditemukan
            return {
                message: "Kategori atau dompet tidak ditemukan. Muat ulang lalu coba lagi.",
            };
        case "RATE_LIMITED": {
            const seconds = error.details?.find(
                (item) => item.retry_after_seconds !== undefined
            )?.retry_after_seconds;
            return {
                message: seconds
                    ? `Terlalu banyak permintaan. Coba lagi dalam ${seconds} detik.`
                    : "Terlalu banyak permintaan. Coba lagi sebentar lagi.",
            };
        }
        case "UNAUTHORIZED":
            return { message: "Sesi berakhir. Silakan masuk kembali." };
        case "NETWORK_ERROR":
            // Pesan dari apiClient sudah berbahasa Indonesia (offline atau timeout)
            return { message: error.message };
        case "SERVICE_UNAVAILABLE":
        case "INTERNAL_ERROR":
            return { message: "Terjadi gangguan di server. Coba lagi sebentar lagi." };
        default:
            return {
                message: error.status >= 500
                    ? "Terjadi gangguan di server. Coba lagi sebentar lagi."
                    : error.message || GENERIC_MESSAGE,
            };
    }
}
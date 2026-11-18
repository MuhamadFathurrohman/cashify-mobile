import type { TransactionListParams, TransactionType } from "@/types/api";

// Kunci query domain transaksi. Dashboard punya kunci sendiri (dashboardKeys).
export const transactionKeys = {
    // Dipakai useCreateTransaction untuk invalidasi seluruh domain transaksi
    all: ["transactions"] as const,

    // Prefix untuk semua query daftar transaksi
    lists: () => ["transactions", "list"] as const,

    // Kunci spesifik per kombinasi filter aktif.
    // cursor dan limit sengaja tidak disertakan: keduanya adalah detail pagination,
    // bukan identitas filter. Perubahan filter menghasilkan key baru dan TanStack Query
    // otomatis me-reset infinite scroll.
    list: (params: TransactionListParams) =>
        ["transactions", "list", params] as const,
};

export const categoryKeys = {
    all: ["categories"] as const,
    byType: (type: TransactionType) => ["categories", type] as const,
};

export const accountKeys = {
    all: ["accounts"] as const,
};
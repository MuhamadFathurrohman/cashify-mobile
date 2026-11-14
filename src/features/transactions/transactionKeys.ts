import type { TransactionType } from "@/types/api";

// Kunci query domain transaksi. Dashboard punya kunci sendiri (dashboardKeys).
export const transactionKeys = {
    all: ["transactions"] as const,
};

export const categoryKeys = {
    all: ["categories"] as const,
    byType: (type: TransactionType) => ["categories", type] as const,
};

export const accountKeys = {
    all: ["accounts"] as const,
};
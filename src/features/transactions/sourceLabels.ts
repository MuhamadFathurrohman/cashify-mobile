import type { TransactionSource } from "@/types/api";

// Label sumber transaksi dipakai daftar riwayat dan layar detail agar tidak berbeda.
export const SOURCE_LABELS: Record<TransactionSource, string> = {
    manual: "Manual",
    whatsapp: "WhatsApp",
    recurring: "Recurring",
    import: "Import",
};

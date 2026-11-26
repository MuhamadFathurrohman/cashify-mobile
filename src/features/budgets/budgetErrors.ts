import { ApiRequestError } from "@/lib/api/client";
import { networkOrFallbackMessage } from "@/features/transactions/transactionErrorMessages";

// Kolom form yang bisa ditandai merah. "form" = galat umum, ditampilkan sebagai toast
// (mis. periode sudah punya anggaran).
export type BudgetFormField =
  | "name"
  | "total"
  | "category"
  | "amount"
  | "threshold"
  | "form";

export interface BudgetErrorInfo {
  field: BudgetFormField;
  message: string;
}

const GENERIC_MESSAGE = "Anggaran gagal disimpan. Coba lagi.";

// Nama field mengikuti kunci body backend (budgets.schema.ts). `categories` bukan
// kolom di UI (alokasi diwakili kolom nominal kategori), jadi dipetakan ke `amount`.
type BackendField = BudgetFormField | "categories";

const FIELD_BY_NAME: Record<string, BackendField> = {
  name: "name",
  total_amount: "total",
  categories: "categories",
  category_id: "category",
  amount: "amount",
  alert_threshold: "threshold",
  period_start: "form",
};

// `issue` sudah dipakai backend untuk membedakan sebab penolakan.
const MESSAGE_BY_ISSUE: Record<string, string> = {
  overlap: "Bulan ini sudah punya anggaran. Muat ulang daftar untuk melihatnya.",
  exceeds_total: "Total alokasi kategori melebihi total anggaran.",
  type_mismatch: "Kategori pemasukan tidak bisa dianggarkan.",
};

// `categories` bukan kolom di UI (alokasi diwakili kolom nominal kategori).
function normalizeField(field: BackendField): BudgetFormField {
  return field === "categories" ? "amount" : field;
}

export function resolveBudgetError(error: unknown): BudgetErrorInfo {
  if (!(error instanceof ApiRequestError)) {
    return { field: "form", message: GENERIC_MESSAGE };
  }

  if (error.code === "NETWORK_ERROR") {
    return { field: "form", message: error.message };
  }

  const detail = error.details?.find((item) => item.issue || item.field);
  const issueMessage = detail?.issue ? MESSAGE_BY_ISSUE[detail.issue] : undefined;
  if (issueMessage) {
    const field = FIELD_BY_NAME[detail?.field ?? ""] ?? "form";
    return { field: normalizeField(field), message: issueMessage };
  }

  if (error.status === 404) {
    return {
      field: "form",
      message: "Anggaran tidak ditemukan. Muat ulang daftar lalu coba lagi.",
    };
  }

  if (error.status === 409) {
    return {
      field: "form",
      message: MESSAGE_BY_ISSUE.overlap,
    };
  }

  const field = detail?.field ? FIELD_BY_NAME[detail.field] : undefined;
  if (field) {
    // Pesan validasi backend berbahasa Indonesia; pakai apa adanya.
    return { field: normalizeField(field), message: error.message };
  }

  return { field: "form", message: error.message || GENERIC_MESSAGE };
}

// Galat memuat daftar/detail: pesan jaringan dari apiClient lebih spesifik.
export function budgetLoadErrorMessage(error: unknown, fallback: string): string {
  return networkOrFallbackMessage(error, fallback);
}

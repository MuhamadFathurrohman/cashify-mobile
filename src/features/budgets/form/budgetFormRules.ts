import type { BudgetDetail, CreateBudgetRequest } from "@/types/api";
import { formatPlainRupiah } from "@/utils/money";
import type { BudgetFormField } from "../budgetErrors";

// Batas backend (MAX_INT32) untuk total_amount dan amount.
export const MAX_AMOUNT = 2_147_483_647;
export const DEFAULT_THRESHOLD = 80;
export const THRESHOLD_PRESETS = [70, 80, 90] as const;

// Dua nominal punya skala berbeda, jadi pintasannya dipisah: total anggaran
// sebulan lebih besar daripada alokasi satu kategori.
export const TOTAL_PRESETS = [500_000, 1_000_000, 2_000_000, 5_000_000] as const;
export const CATEGORY_PRESETS = [250_000, 500_000, 1_000_000, 2_000_000] as const;

export function presetLabel(value: number): string {
  if (value >= 1_000_000) return `+${value / 1_000_000} jt`;
  return `+${value / 1_000} rb`;
}

export type BudgetFormErrors = Partial<Record<BudgetFormField, string>>;

// Urutan ini dipakai bersama oleh ringkasan error dan penentuan field pertama
// yang perlu difokuskan/digulir. "name" dan "form" tidak punya kolom di UI.
export const BUDGET_FIELD_ORDER = [
  "total",
  "category",
  "amount",
  "threshold",
] as const;

export type BudgetErrorField = (typeof BUDGET_FIELD_ORDER)[number];

const BUDGET_FIELD_LABELS: Record<BudgetErrorField, string> = {
  total: "Total Anggaran",
  category: "Kategori",
  amount: "Batas Kategori",
  threshold: "Batas Peringatan",
};

export interface BudgetErrorMessage {
  field: BudgetErrorField;
  label: string;
  message: string;
}

export function getBudgetErrorMessages(
  errors: BudgetFormErrors,
): BudgetErrorMessage[] {
  return BUDGET_FIELD_ORDER.flatMap((field) => {
    const message = errors[field];
    return message
      ? [{ field, label: BUDGET_FIELD_LABELS[field], message }]
      : [];
  });
}

export function firstBudgetErrorField(
  errors: BudgetFormErrors,
): BudgetErrorField | null {
  return getBudgetErrorMessages(errors)[0]?.field ?? null;
}

export interface TotalStepValues {
  total: number;
  // Total alokasi kategori yang sudah tersimpan (mode tambah anggaran per kategori).
  allocated: number;
}

export interface CategoryStepValues {
  categoryId: string;
  amount: number;
  threshold: number;
  total: number;
  allocated: number;
}

// `excludeCategoryId` dipakai saat mengedit satu kategori: batas atas kolomnya
// dihitung dari alokasi kategori lain, supaya nilai lama tidak dihitung dua kali.
export function totalAllocated(
  categories: Pick<BudgetDetail["categories"][number], "amount" | "category_id">[],
  excludeCategoryId?: string,
): number {
  return categories.reduce(
    (sum, category) =>
      category.category_id === excludeCategoryId ? sum : sum + category.amount,
    0,
  );
}

// Langkah 1 (dan aksi "Ubah Total"): plafon bulan. Saat membuat anggaran belum
// ada alokasi, jadi `allocated` = 0 dan batas bawahnya hanya Rp 1.
export function validateTotalStep(values: TotalStepValues): BudgetFormErrors {
  const errors: BudgetFormErrors = {};

  if (values.total <= 0) {
    errors.total = "Total anggaran harus lebih dari Rp 0.";
  } else if (values.total > MAX_AMOUNT) {
    errors.total = "Total anggaran terlalu besar.";
  } else if (values.allocated > values.total) {
    errors.total = `Total tidak boleh lebih kecil dari alokasi tersimpan (${formatPlainRupiah(values.allocated)}).`;
  }

  return errors;
}

// Langkah 2: kategori + batasnya. Aturan klien mencerminkan backend:
// kategori wajib, nominal > 0, Σ alokasi ≤ total, dan ambang 1–100.
export function validateCategoryStep(
  values: CategoryStepValues,
): BudgetFormErrors {
  const errors: BudgetFormErrors = {};

  if (!values.categoryId) {
    errors.category = "Pilih kategori pengeluaran.";
  }

  if (values.amount <= 0) {
    errors.amount = "Batas kategori harus lebih dari Rp 0.";
  } else if (values.amount > MAX_AMOUNT) {
    errors.amount = "Batas kategori terlalu besar.";
  } else if (values.allocated + values.amount > values.total) {
    const remaining = Math.max(values.total - values.allocated, 0);
    errors.amount = `Alokasi melebihi total. Sisa yang bisa dialokasikan ${formatPlainRupiah(remaining)}.`;
  }

  if (
    !Number.isInteger(values.threshold) ||
    values.threshold < 1 ||
    values.threshold > 100
  ) {
    errors.threshold = "Batas peringatan harus 1–100%.";
  }

  return errors;
}

export function hasBudgetFormError(errors: BudgetFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

// Satu kategori per pengiriman: mode "buat" mengirim alokasi pertama, kategori
// berikutnya ditambahkan lewat PATCH dari tombol "Tambah Anggaran per Kategori".
// `name` sengaja tidak dikirim: nama anggaran tidak ditampilkan di aplikasi.
export function createBudgetBody(input: {
  total: number;
  categoryId: string;
  amount: number;
  threshold: number;
  periodStart: string;
}): CreateBudgetRequest {
  return {
    period_type: "monthly",
    period_start: input.periodStart,
    total_amount: input.total,
    // Dikirim eksplisit agar tidak bergantung pada default Zod backend.
    auto_renew: true,
    rollover_enabled: false,
    categories: [
      {
        category_id: input.categoryId,
        amount: input.amount,
        alert_threshold: input.threshold,
      },
    ],
  };
}

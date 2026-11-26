import { ApiRequestError, apiClient } from "@/lib/api/client";
import type { Budget, BudgetDetail, BudgetListResponse } from "@/types/api";
import { useQuery } from "@tanstack/react-query";

// ─── Kunci query ─────────────────────────────────────────────────────────────

// Detail berada di bawah `all` supaya invalidasi setelah POST/PATCH ikut
// menyegarkan detail bulan yang sedang ditampilkan.
export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => ["budgets", "list"] as const,
  detail: (id: string) => ["budgets", "detail", id] as const,
};

// ─── API ─────────────────────────────────────────────────────────────────────

// `status=all` agar pengguna bisa membuka bulan-bulan sebelumnya dari pemilih bulan.
async function fetchBudgets(): Promise<Budget[]> {
  const response = await apiClient.get<BudgetListResponse>("/budgets?status=all");
  return response.data;
}

async function fetchBudget(id: string): Promise<BudgetDetail> {
  return apiClient.get<BudgetDetail>(`/budgets/${id}`);
}

// 404 pada detail berarti anggaran sudah tidak ada (mis. dihapus di perangkat lain);
// mengulang permintaan tidak akan mengubah hasilnya.
function retryUnlessMissing(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiRequestError && error.status === 404) return false;
  return failureCount < 2;
}

// ─── Hook baca ───────────────────────────────────────────────────────────────

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.lists(),
    queryFn: fetchBudgets,
  });
}

// Daftar bulan hanya memuat metadata; progres (spent/percent/status) hanya ada di
// detail, jadi layar memuat detail bulan yang dipilih. `id` null = belum ada bulan.
export function useBudgetDetail(id: string | null) {
  return useQuery({
    queryKey: budgetKeys.detail(id ?? "none"),
    queryFn: () => fetchBudget(id as string),
    enabled: Boolean(id),
    retry: retryUnlessMissing,
  });
}

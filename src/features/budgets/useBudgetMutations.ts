import { dashboardKeys } from "@/features/dashboard/useDashboard";
import { apiClient } from "@/lib/api/client";
import type {
  Budget,
  BudgetCategoryInput,
  BudgetDetail,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetKeys } from "./budgetQueries";

// POST /budgets tidak idempoten: mengulang otomatis bisa membuat dua anggaran
// (yang kedua ditolak 409, tapi tetap memicu permintaan sia-sia), jadi tanpa retry.
async function createBudget(body: CreateBudgetRequest): Promise<Budget> {
  return apiClient.post<Budget>("/budgets", body);
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudget,
    retry: 0,
    onSuccess: () => {
      // Daftar bulan menentukan anggaran mana yang aktif, jadi harus disegarkan.
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export interface AddBudgetCategoryInput {
  budget: Pick<BudgetDetail, "id" | "categories">;
  categoryId: string;
  amount: number;
  threshold: number;
}

// PATCH /budgets/{id} mengganti SELURUH daftar kategori, bukan menambah sebagian.
// Alokasi lama karena itu harus dikirim ulang bersama kategori baru.
export function mergeCategories({
  budget,
  categoryId,
  amount,
  threshold,
}: AddBudgetCategoryInput): BudgetCategoryInput[] {
  return [
    ...budget.categories.map((category) => ({
      category_id: category.category_id,
      amount: category.amount,
      alert_threshold: category.alert_threshold,
    })),
    { category_id: categoryId, amount, alert_threshold: threshold },
  ];
}

async function addBudgetCategory(
  input: AddBudgetCategoryInput,
): Promise<Budget> {
  // Tanpa `total_amount`: total diubah lewat aksinya sendiri agar PATCH kategori
  // tidak diam-diam menimpa nilai total yang lain.
  const body: UpdateBudgetRequest = { categories: mergeCategories(input) };
  return apiClient.patch<Budget>(`/budgets/${input.budget.id}`, body);
}

// ⚠️ POST dan PATCH mengembalikan bentuk `Budget` (tanpa spent/percent/status);
// hanya GET /budgets/{id} dan /current yang mengembalikan `BudgetDetail`. Karena
// itu respons mutasi tidak boleh ditulis ke cache detail — detail harus diambil
// ulang, kalau tidak layar membaca progres yang tidak ada.
export function useAddBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBudgetCategory,
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export interface UpdateBudgetTotalInput {
  budgetId: string;
  totalAmount: number;
}

async function updateBudgetTotal({
  budgetId,
  totalAmount,
}: UpdateBudgetTotalInput): Promise<Budget> {
  const body: UpdateBudgetRequest = { total_amount: totalAmount };
  return apiClient.patch<Budget>(`/budgets/${budgetId}`, body);
}

// Hanya mengubah plafon. Alokasi kategori dikirim terpisah oleh
// useAddBudgetCategory, jadi keduanya tidak saling menimpa.
export function useUpdateBudgetTotal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBudgetTotal,
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export interface UpdateBudgetCategoryInput {
  budget: Pick<BudgetDetail, "id" | "categories">;
  categoryId: string;
  amount: number;
  threshold: number;
}

function toCategoryInput(
  category: Pick<
    BudgetDetail["categories"][number],
    "category_id" | "amount" | "alert_threshold"
  >,
): BudgetCategoryInput {
  return {
    category_id: category.category_id,
    amount: category.amount,
    alert_threshold: category.alert_threshold,
  };
}

// PATCH mengganti seluruh daftar. Kategori yang diedit diganti nominal/ambangnya,
// kategori lain dikirim apa adanya supaya tidak ikut berubah.
export function replaceCategory({
  budget,
  categoryId,
  amount,
  threshold,
}: UpdateBudgetCategoryInput): BudgetCategoryInput[] {
  return budget.categories.map((category) =>
    category.category_id === categoryId
      ? { category_id: categoryId, amount, alert_threshold: threshold }
      : toCategoryInput(category),
  );
}

// Tanpa kategori yang dihapus. Backend menghapus alokasi yang tidak ada di daftar;
// `total_amount` tidak ikut dikirim sehingga plafon tetap.
export function omitCategory(
  budget: Pick<BudgetDetail, "id" | "categories">,
  categoryId: string,
): BudgetCategoryInput[] {
  return budget.categories
    .filter((category) => category.category_id !== categoryId)
    .map(toCategoryInput);
}

async function patchCategories(
  budgetId: string,
  categories: BudgetCategoryInput[],
): Promise<Budget> {
  const body: UpdateBudgetRequest = { categories };
  return apiClient.patch<Budget>(`/budgets/${budgetId}`, body);
}

export function useUpdateBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBudgetCategoryInput) =>
      patchCategories(input.budget.id, replaceCategory(input)),
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useRemoveBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Pick<UpdateBudgetCategoryInput, "budget" | "categoryId">) =>
      patchCategories(input.budget.id, omitCategory(input.budget, input.categoryId)),
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

import { apiClient } from "@/lib/api/client";
import type { Category, CategoryListResponse, TransactionType } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { categoryKeys } from "./transactionKeys";

// Kategori jarang berubah (kustom belum ada: Phase 2), jadi cache lebih lama dari default
const CATEGORIES_STALE_MS = 30 * 60 * 1000;

// Hasil sudah terurut menurut `sort_order` dari backend; jangan diurutkan ulang.
// Salinan seed milik pengguna tampil dengan is_system=false, jadi is_system
// tidak boleh dipakai untuk menyaring atau membedakan kategori.
async function fetchCategories(type: TransactionType): Promise<Category[]> {
    const response = await apiClient.get<CategoryListResponse>(
        `/categories?type=${type}`
    );
    return response.data;
}

export function useCategories(type: TransactionType) {
    return useQuery({
        queryKey: categoryKeys.byType(type),
        queryFn: () => fetchCategories(type),
        staleTime: CATEGORIES_STALE_MS,
    });
}
import { apiClient } from "@/lib/api/client";
import type { TransactionListParams, TransactionListResponse } from "@/types/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { transactionKeys } from "../transactionKeys";

const LIST_LIMIT = 20;

async function fetchTransactions(
    params: TransactionListParams,
    cursor: string | undefined,
): Promise<TransactionListResponse> {
    const query = new URLSearchParams();

    if (params.type) query.set("type", params.type);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.category_id) query.set("category_id", params.category_id);
    if (params.account_id) query.set("account_id", params.account_id);
    if (params.source) query.set("source", params.source);
    if (params.q?.trim()) query.set("q", params.q.trim());
    if (cursor) query.set("cursor", cursor);

    query.set("limit", String(LIST_LIMIT));

    return apiClient.get<TransactionListResponse>(`/transactions?${query.toString()}`);
}

// Hook daftar transaksi dengan cursor pagination.
// params tidak menyertakan cursor dan limit — keduanya dikelola hook secara internal.
// Perubahan params menghasilkan queryKey baru; TanStack Query otomatis me-reset
// dan memulai fetch dari halaman pertama.
export function useTransactions(params: TransactionListParams) {
    const query = useInfiniteQuery({
        queryKey: transactionKeys.list(params),
        queryFn: ({ pageParam }) =>
            fetchTransactions(params, pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
    });

    // Flatten semua halaman menjadi satu array untuk dipakai layar
    const transactions = query.data?.pages.flatMap((page) => page.data) ?? [];

    return {
        ...query,
        transactions,
    };
}
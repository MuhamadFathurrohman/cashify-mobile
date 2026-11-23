import { apiClient } from "@/lib/api/client";
import type { TransactionDetail } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { transactionKeys } from "../transactionKeys";

async function fetchTransactionDetail(id: string): Promise<TransactionDetail> {
    return apiClient.get<TransactionDetail>(`/transactions/${id}`);
}

// Detail satu transaksi (GET /transactions/{id}): Transaction + source_message.
// Dijalankan hanya bila id tersedia; staleTime/gcTime/retry mengikuti default QueryClient.
export function useTransactionDetail(id: string | undefined) {
    return useQuery({
        queryKey: transactionKeys.detail(id ?? ""),
        queryFn: () => fetchTransactionDetail(id ?? ""),
        enabled: Boolean(id),
    });
}

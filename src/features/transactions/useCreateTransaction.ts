import { dashboardKeys } from "@/features/dashboard/useDashboard";
import { apiClient } from "@/lib/api/client";
import type { CreateTransactionRequest, Transaction } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionKeys } from "./transactionKeys";

async function createTransaction(body: CreateTransactionRequest): Promise<Transaction> {
    return apiClient.post<Transaction>("/transactions", body);
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTransaction,
        // POST /transactions tidak punya kunci idempotensi: mengulang otomatis
        // bisa membuat transaksi ganda, jadi jangan pernah di-retry.
        retry: 0,
        onSuccess: () => {
            // Sengaja tanpa return/await: mutasi selesai segera sehingga layar bisa
            // ditutup, sementara Beranda menyegarkan diri di latar belakang.
            void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
}
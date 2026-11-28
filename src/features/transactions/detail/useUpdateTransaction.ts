import { dashboardKeys } from "@/features/dashboard/useDashboard";
import { reportKeys } from "@/features/reports/reportQueries";
import { apiClient } from "@/lib/api/client";
import type {
    Transaction,
    TransactionDetail,
    UpdateTransactionRequest,
} from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionKeys } from "../transactionKeys";

interface UpdateTransactionVariables {
    id: string;
    body: UpdateTransactionRequest;
}

async function updateTransaction({
    id,
    body,
}: UpdateTransactionVariables): Promise<Transaction> {
    return apiClient.patch<Transaction>(`/transactions/${id}`, body);
}

// PATCH /transactions/{id} memakai updated_at sebagai penjaga konflik, jadi tidak
// di-retry: pengulangan otomatis berisiko menimpa perubahan pengguna lain.
export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateTransaction,
        retry: 0,
        onSuccess: (transaction) => {
            // Respons PATCH sudah memuat updated_at terbaru, jadi detail langsung
            // diperbarui; source_message tidak dikirim PATCH sehingga dipertahankan
            // dari cache lama dan disegarkan oleh invalidasi di bawah.
            queryClient.setQueryData<TransactionDetail>(
                transactionKeys.detail(transaction.id),
                (old) => (old ? { ...old, ...transaction } : old),
            );
            // Sengaja tanpa return/await: layar boleh ditutup segera, sementara
            // riwayat, Beranda, dan Laporan menyegarkan diri di latar belakang.
            void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            void queryClient.invalidateQueries({ queryKey: reportKeys.all });
            void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
}

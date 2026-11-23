import { dashboardKeys } from "@/features/dashboard/useDashboard";
import { apiClient } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionKeys } from "../transactionKeys";

async function deleteTransaction(id: string): Promise<void> {
    // DELETE soft delete membalas 204 tanpa body
    await apiClient.delete<void>(`/transactions/${id}`);
}

// DELETE /transactions/{id}. Tanpa retry: hasil request yang ambigu tidak boleh
// menghasilkan permintaan ulang (pola yang sama dengan POST/PATCH).
export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTransaction,
        retry: 0,
        // onSettled: 404 berarti transaksi sudah tidak ada, dan kegagalan jaringan
        // pun tetap layak menyegarkan daftar. Cache detail tidak dihapus di sini karena
        // query detail masih diamati layar yang sedang menutup diri; invalidasi sudah
        // membuatnya basi sehingga pemuatan berikutnya mengambil data terbaru.
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
}

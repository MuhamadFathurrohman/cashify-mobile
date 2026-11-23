import { apiClient } from "@/lib/api/client";
import type { DashboardResponse } from "@/types/api";
import { currentMonth } from "@/utils/jakartaDates";
import { useQuery } from "@tanstack/react-query";

// ─── Query keys ───────────────────────────────────────────────────────────────

// `all` dipakai untuk invalidasi setelah transaksi dibuat/diubah (Task 6)
export const dashboardKeys = {
    all: ["dashboard"] as const,
    month: (month: string) => ["dashboard", month] as const,
};

// ─── API Functions ────────────────────────────────────────────────────────────

async function getDashboardApi(month: string): Promise<DashboardResponse> {
    return apiClient.get<DashboardResponse>(`/dashboard?month=${month}`);
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

// `month` format "YYYY-MM", default bulan berjalan (zona Asia/Jakarta, sama dengan backend).
// Bulan selalu dikirim eksplisit agar pengelompokan arus kas tahu bulan yang dipakai.
// `balance` dan `recent_transactions` tidak bergantung pada `month`.
export function useDashboard(month: string = currentMonth()) {
    return useQuery<DashboardResponse, Error>({
        queryKey: dashboardKeys.month(month),
        queryFn: () => getDashboardApi(month),
        // Beranda adalah layar utama: satu percobaan ulang cukup agar ErrorState
        // tidak tertunda lama saat jaringan menggantung (timeout 15 dtk per percobaan).
        retry: 1,
    });
}
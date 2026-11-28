import { apiClient } from "@/lib/api/client";
import type { MonthlyReport } from "@/types/api";
import { monthsEndingAt } from "@/utils/monthOptions";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

// ─── Kunci query ─────────────────────────────────────────────────────────────

// `all` dipakai mutasi transaksi untuk menyegarkan Laporan setelah data berubah.
export const reportKeys = {
  all: ["reports"] as const,
  monthly: (month: string) => ["reports", "monthly", month] as const,
};

// ─── API ─────────────────────────────────────────────────────────────────────

// Respons sukses backend dikirim tanpa envelope.
async function fetchMonthlyReport(month: string): Promise<MonthlyReport> {
  return apiClient.get<MonthlyReport>(
    `/reports/monthly?month=${encodeURIComponent(month)}`,
  );
}

// ─── Hook baca ───────────────────────────────────────────────────────────────

export function useMonthlyReport(month: string, enabled = true) {
  return useQuery<MonthlyReport, Error>({
    queryKey: reportKeys.monthly(month),
    queryFn: () => fetchMonthlyReport(month),
    enabled,
    // Satu percobaan ulang cukup; timeout apiClient sudah 15 detik per percobaan.
    retry: 1,
  });
}

export interface ReportWindowQuery {
  /** Laporan bulanan yang berhasil dimuat, urut menaik. */
  reports: MonthlyReport[];
  isPending: boolean;
  /** Semua bulan gagal dan tidak ada data yang bisa ditampilkan. */
  isError: boolean;
  /** Sebagian bulan gagal, tetapi masih ada data lain yang bisa ditampilkan. */
  hasPartialError: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  /** Error pertama yang terjadi pada jendela, untuk pesan ErrorState. */
  error: Error | null;
  refetch: () => void;
}

// Jendela 6/12 bulan dibangun dari beberapa permintaan /reports/monthly paralel.
// Endpoint /reports/trend tidak dipakai karena selalu berakhir di bulan berjalan
// dan tidak bisa mengikuti MonthPicker pada header.
export function useReportWindow(endMonth: string, count: number): ReportWindowQuery {
  const months = useMemo(
    () => monthsEndingAt(endMonth, count),
    [count, endMonth],
  );

  const results = useQueries({
    queries: months.map((month) => ({
      queryKey: reportKeys.monthly(month),
      queryFn: () => fetchMonthlyReport(month),
      retry: 1,
    })),
  });

  const reports = useMemo(
    () => results.flatMap((result) => (result.data ? [result.data] : [])),
    [results],
  );
  const anyError = results.some((result) => result.isError);

  const refetch = useCallback(() => {
    void Promise.all(results.map((result) => result.refetch()));
  }, [results]);

  return {
    reports,
    isPending:
      results.length > 0 &&
      results.some((result) => result.isPending) &&
      reports.length === 0,
    isError: anyError && reports.length === 0,
    hasPartialError: anyError && reports.length > 0,
    isFetching: results.some((result) => result.isFetching),
    isRefetching: results.some((result) => result.isRefetching),
    error: results.find((result) => result.isError)?.error ?? null,
    refetch,
  };
}

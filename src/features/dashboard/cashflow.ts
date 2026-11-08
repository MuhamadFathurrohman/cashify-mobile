import type { DashboardCashflowPoint } from "@/types/api";
import { daysInMonth } from "./dashboardDates";

export interface CashflowBucket {
    label: string; // mis. "1–7"
    startDay: number;
    endDay: number;
    income: number;
    expense: number;
}

// Awal tiap rentang; rentang terakhir berakhir di hari terakhir bulan (28–31)
const RANGE_STARTS = [1, 8, 15, 22] as const;

// Mengelompokkan arus kas harian menjadi 4 rentang tanggal untuk grafik Beranda.
// Selalu mengembalikan 4 rentang (nol bila tidak ada transaksi) karena backend
// hanya mengirim hari yang punya transaksi.
export function groupCashflow(
    points: DashboardCashflowPoint[],
    month: string,
): CashflowBucket[] {
    const lastDay = daysInMonth(month) || 31;
    const buckets: CashflowBucket[] = RANGE_STARTS.map((start, i) => {
        const end = i === RANGE_STARTS.length - 1 ? lastDay : RANGE_STARTS[i + 1] - 1;
        return { label: `${start}–${end}`, startDay: start, endDay: end, income: 0, expense: 0 };
    });

    for (const point of points) {
        if (!point.date.startsWith(month)) continue; // abaikan data di luar bulan
        const day = Number(point.date.slice(8, 10));
        const bucket = buckets.find((b) => day >= b.startDay && day <= b.endDay);
        if (!bucket) continue;
        bucket.income += point.income;
        bucket.expense += point.expense;
    }
    return buckets;
}
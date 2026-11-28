import type { ReportDaily } from "@/types/api";
import { currentDay, currentMonth, daysInMonth } from "@/utils/jakartaDates";

// Ukuran area grafik dipakai bersama oleh Svg dan lapisan sentuh. Jarak kiri
// menyediakan ruang untuk label nominal ringkas (mis. "Rp 2,5 jt").
export const REPORT_CHART = {
  height: 188,
  top: 14,
  bottom: 28,
  left: 52,
  right: 10,
} as const;

export type ReportChartField = "income" | "expense";

export interface ReportChartPoint {
  date: string;
  day: number;
  income: number;
  expense: number;
}

// Backend mengirim seluruh tanggal bulan itu, termasuk hari yang belum terjadi
// pada bulan berjalan. Grafik berhenti di hari ini agar tidak menggambar nol
// untuk tanggal masa depan.
export function toDailyChart(
  month: string,
  daily: ReportDaily[],
  now: Date = new Date(),
): ReportChartPoint[] {
  const isCurrentMonth = month === currentMonth(now);
  const lastDay = isCurrentMonth
    ? currentDay(now)
    : daysInMonth(month) || 31;

  return daily
    .filter((point) => point.date.startsWith(month))
    .map((point) => {
      const day = Number(point.date.slice(8, 10));
      return { ...point, day };
    })
    .filter(
      (point) =>
        Number.isFinite(point.day) && point.day >= 1 && point.day <= lastDay,
    )
    .sort((a, b) => a.day - b.day);
}

// Batas atas "bulat" supaya label sumbu tidak berakhir di angka acak.
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * 10 ** exponent;
}

// Indeks label tanggal yang ditampilkan; selalu menyertakan titik pertama dan
// terakhir tanpa membuat label saling menumpuk.
export function tickIndexes(count: number, maxTicks = 6): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const total = Math.min(maxTicks, count);
  const indexes = new Set<number>();
  for (let i = 0; i < total; i += 1) {
    indexes.add(Math.round((i * (count - 1)) / (total - 1)));
  }
  return [...indexes].sort((a, b) => a - b);
}

export function xForIndex(
  index: number,
  count: number,
  plotWidth: number,
): number {
  if (count <= 1) return plotWidth / 2;
  return (index / (count - 1)) * plotWidth;
}

// Jarak dari atas area plot (0 = nilai maksimum, plotHeight = nol).
export function yForValue(
  value: number,
  max: number,
  plotHeight: number,
): number {
  if (max <= 0) return plotHeight;
  return plotHeight - (value / max) * plotHeight;
}

export function linePath(
  points: ReportChartPoint[],
  field: ReportChartField,
  max: number,
  chartWidth: number,
): string {
  if (points.length === 0) return "";
  const plotWidth = Math.max(1, chartWidth - REPORT_CHART.left - REPORT_CHART.right);
  const plotHeight = REPORT_CHART.height - REPORT_CHART.top - REPORT_CHART.bottom;

  return points
    .map((point, index) => {
      const x = REPORT_CHART.left + xForIndex(index, points.length, plotWidth);
      const y =
        REPORT_CHART.top + yForValue(point[field], max, plotHeight);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// Dipakai lapisan sentuh yang hanya menutupi area plot.
export function nearestPointIndex(
  locationX: number,
  plotWidth: number,
  count: number,
): number {
  if (count <= 1) return 0;
  const ratio = Math.min(1, Math.max(0, locationX / plotWidth));
  return Math.round(ratio * (count - 1));
}

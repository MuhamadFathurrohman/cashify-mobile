import type { ReportCategory } from "@/types/api";

export type ReportHealthKey = "empty" | "deficit" | "fair" | "healthy";

export interface ReportTotals {
  income_total: number;
  expense_total: number;
  net: number;
}

export interface ReportHealth {
  key: ReportHealthKey;
  label: string;
}

export type InsightTone = "positive" | "warning" | "neutral";

export interface ReportInsight {
  tone: InsightTone;
  text: string;
}

export function formatReportPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

// Rasio tabungan hanya bermakna saat ada pemasukan. Nilai bisa negatif ketika
// pengeluaran melebihi pemasukan.
export function savingsRatio(report: ReportTotals): number | null {
  if (report.income_total <= 0) return null;
  return (report.net / report.income_total) * 100;
}

export function reportHealth(report: ReportTotals): ReportHealth {
  if (report.income_total === 0 && report.expense_total === 0) {
    return { key: "empty", label: "Belum ada data" };
  }
  if (report.net < 0) {
    return { key: "deficit", label: "Defisit" };
  }

  const ratio = savingsRatio(report);
  if (ratio !== null && ratio >= 20) {
    return { key: "healthy", label: "Sehat" };
  }
  return { key: "fair", label: "Cukup" };
}

// Badge hero menyertakan rasio tabungan supaya label "Sehat"/"Cukup" tidak
// berdiri sendiri. Persen ditampilkan hanya ketika ada pemasukan.
export function reportHealthLabel(report: ReportTotals): string {
  const health = reportHealth(report);
  const ratio = savingsRatio(report);
  if (ratio === null) return health.label;
  return `${health.label} · ${formatReportPercent(ratio)}`;
}

export function topExpenseCategory(report: {
  by_category: ReportCategory[];
}): ReportCategory | null {
  return report.by_category.find((category) => category.type === "expense") ?? null;
}

interface ReportInsightSource extends ReportTotals {
  by_category: ReportCategory[];
}

export interface InsightOptions {
  // "bulan ini", "Oktober 2024", atau "6 bulan terakhir".
  periodLabel: string;
  // Perbandingan bulan sebelumnya hanya dipakai tab 1 Bulan.
  previous?: {
    report: ReportTotals | null;
    pending?: boolean;
    unavailable?: boolean;
  };
}

export function buildReportInsights(
  report: ReportInsightSource,
  { periodLabel, previous }: InsightOptions,
): ReportInsight[] {
  const insights: ReportInsight[] = [];

  const top = topExpenseCategory(report);
  if (top) {
    insights.push({
      tone: "neutral",
      text: `Pengeluaran terbesar ada di ${top.name}, ${formatReportPercent(top.percent)} dari total pengeluaran ${periodLabel}.`,
    });
  }

  if (report.expense_total <= 0) {
    insights.push({
      tone: "neutral",
      text: `Belum ada pengeluaran ${periodLabel}.`,
    });
  } else if (previous) {
    if (previous.pending) {
      insights.push({
        tone: "neutral",
        text: "Membandingkan pengeluaran dengan bulan sebelumnya…",
      });
    } else if (previous.unavailable) {
      insights.push({
        tone: "neutral",
        text: "Perbandingan dengan bulan sebelumnya tidak tersedia saat ini.",
      });
    } else if (!previous.report || previous.report.expense_total <= 0) {
      insights.push({
        tone: "neutral",
        text: "Belum ada data pengeluaran bulan sebelumnya untuk dibandingkan.",
      });
    } else {
      const change =
        ((report.expense_total - previous.report.expense_total) /
          previous.report.expense_total) *
        100;
      const amount = formatReportPercent(Math.abs(change));

      if (Math.abs(change) < 0.05) {
        insights.push({
          tone: "neutral",
          text: `Pengeluaran ${periodLabel} sama dengan bulan sebelumnya.`,
        });
      } else if (change > 0) {
        insights.push({
          tone: "warning",
          text: `Pengeluaran ${periodLabel} naik ${amount} dibanding bulan sebelumnya.`,
        });
      } else {
        insights.push({
          tone: "positive",
          text: `Pengeluaran ${periodLabel} turun ${amount} dibanding bulan sebelumnya.`,
        });
      }
    }
  }

  const ratio = savingsRatio(report);
  if (report.income_total <= 0) {
    insights.push({
      tone: "neutral",
      text: `Belum ada pemasukan ${periodLabel}.`,
    });
  } else if (report.net < 0) {
    insights.push({
      tone: "warning",
      text: `Pengeluaran melebihi pemasukan ${periodLabel}.`,
    });
  } else if (ratio !== null && ratio >= 20) {
    insights.push({
      tone: "positive",
      text: `Kamu menyisihkan ${formatReportPercent(ratio)} dari pemasukan ${periodLabel}.`,
    });
  } else if (ratio !== null) {
    insights.push({
      tone: "neutral",
      text: `Sisa uang ${periodLabel} setara ${formatReportPercent(ratio)} dari pemasukan.`,
    });
  }

  return insights;
}

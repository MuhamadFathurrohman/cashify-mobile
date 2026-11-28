import type { MonthlyReport, ReportCategory } from "@/types/api";

// Agregasi beberapa laporan bulanan menjadi satu ringkasan jendela (6/12 bulan).
// Semua angka diambil dari GET /reports/monthly yang sudah ada; tidak ada
// endpoint trend yang dipakai karena tren tidak menerima bulan anchor dari header.
export function aggregateMonthlyReports(reports: MonthlyReport[]): MonthlyReport {
  let income = 0;
  let expense = 0;
  const categories = new Map<string, ReportCategory>();

  for (const report of reports) {
    income += report.income_total;
    expense += report.expense_total;

    for (const category of report.by_category) {
      const existing = categories.get(category.category_id);
      if (existing) {
        existing.total += category.total;
      } else {
        categories.set(category.category_id, { ...category });
      }
    }
  }

  const typeTotals = { income, expense };
  const byCategory = [...categories.values()]
    .map((category) => ({
      ...category,
      // Persen bulanan tidak bisa dirata-rata: hitung ulang dari total jendela.
      percent:
        typeTotals[category.type] > 0
          ? Math.round((category.total / typeTotals[category.type]) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "id"));

  const daily = reports
    .flatMap((report) => report.daily)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    month: reports[reports.length - 1]?.month ?? "",
    income_total: income,
    expense_total: expense,
    net: income - expense,
    by_category: byCategory,
    daily,
  };
}

import { useMemo, useState } from "react";
import { pickDefaultMonth, toMonthOptions } from "./budgetPeriods";
import { useBudgets } from "./budgetQueries";

// State pemilih bulan untuk segmen Anggaran. Dipegang di level tab karena tombol
// bulan dirender pada header, sedangkan daftar dan detail dipakai BudgetSection.
export function useBudgetMonthSelection() {
  const budgets = useBudgets();
  const months = useMemo(
    () => toMonthOptions(budgets.data ?? []),
    [budgets.data],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pilihan bisa menunjuk anggaran yang sudah hilang (mis. dihapus di perangkat
  // lain); dalam kasus itu kembali ke bulan aktif atau periode terbaru.
  const resolvedId = useMemo(() => {
    if (selectedId && months.some((month) => month.id === selectedId)) {
      return selectedId;
    }
    return pickDefaultMonth(months);
  }, [months, selectedId]);

  const selected = months.find((month) => month.id === resolvedId) ?? null;

  return { budgets, months, selected, resolvedId, selectMonth: setSelectedId };
}

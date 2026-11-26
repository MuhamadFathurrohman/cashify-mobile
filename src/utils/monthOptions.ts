import {
  currentMonth,
  daysInMonth,
  formatMonthLabel,
} from "./jakartaDates";

// Satu pilihan bulan pada pemilih bulan (dipakai segmen Anggaran dan Laporan).
export interface MonthOption {
  id: string;
  monthLabel: string;
  rangeLabel: string;
  isActive: boolean;
}

// Geser "YYYY-MM" sebanyak `offset` bulan (negatif = mundur).
function shiftMonth(month: string, offset: number): string {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, value - 1 + offset, 1));
  const shiftedMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${shiftedMonth}`;
}

// Backend laporan menerima bulan apa pun dan tidak menyediakan daftar bulan,
// jadi pilihan dibuat di klien. Batas 12 bulan mengikuti GET /reports/trend.
export function toRecentMonthOptions(
  count = 12,
  now: Date = new Date(),
): MonthOption[] {
  const thisMonth = currentMonth(now);

  return Array.from({ length: count }, (_, index) => {
    const id = shiftMonth(thisMonth, -index);
    const label = formatMonthLabel(id);

    return {
      id,
      monthLabel: label,
      rangeLabel: `1 – ${daysInMonth(id)} ${label}`,
      isActive: index === 0,
    };
  });
}

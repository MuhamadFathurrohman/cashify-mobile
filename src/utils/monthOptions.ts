import {
  currentMonth,
  daysInMonth,
  formatMonthLabel,
  formatMonthShort,
  formatMonthShortWithYear,
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

// Bulan sebelum "YYYY-MM"; dipakai Laporan untuk membandingkan pengeluaran.
export function previousMonth(month: string): string {
  return shiftMonth(month, -1);
}

// Deretan `count` bulan yang berakhir di `endMonth`, urut menaik.
// Dipakai tab 6/12 Bulan: header bulan menjadi titik akhir jendela laporan.
export function monthsEndingAt(endMonth: string, count: number): string[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) =>
    shiftMonth(endMonth, -(count - 1 - index)),
  );
}

// Label rentang untuk MonthPicker pada tab Laporan. Tahun hanya ditulis sekali
// bila tahun awal dan akhir sama: "Mei-Nov 2026", bukan "Mei 2026-Nov 2026".
export function monthRangeLabel(endMonth: string, count: number): string {
  const months = monthsEndingAt(endMonth, count);
  if (months.length === 0) return formatMonthLabel(endMonth);

  const start = months[0];
  const sameYear = start.slice(0, 4) === endMonth.slice(0, 4);
  return sameYear
    ? `${formatMonthShort(start)}-${formatMonthShort(endMonth)} ${endMonth.slice(0, 4)}`
    : `${formatMonthShortWithYear(start)}-${formatMonthShortWithYear(endMonth)}`;
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

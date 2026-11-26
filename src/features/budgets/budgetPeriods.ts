import type { Budget } from "@/types/api";
import {
  currentDay,
  currentMonth,
  formatDateShort,
  formatMonthLabel,
  parseDate,
} from "@/utils/jakartaDates";

// ─── Tipe ────────────────────────────────────────────────────────────────────

// Satu baris pada pemilih bulan. Dihitung dari Budget[] (bukan dari /current)
// supaya daftar bulan dan detail terpilih memakai sumber data yang sama.
export interface BudgetMonthOption {
  id: string;
  monthLabel: string;
  rangeLabel: string;
  isActive: boolean;
}

// ─── Tanggal (selalu Asia/Jakarta, mengikuti perhitungan backend) ────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function isoToday(now: Date = new Date()): string {
  return `${currentMonth(now)}-${String(currentDay(now)).padStart(2, "0")}`;
}

// YYYY-MM-DD -> milidetik UTC; null bila format tidak valid
function toUtcMs(value: string): number | null {
  const parts = parseDate(value.slice(0, 10));
  if (!parts) return null;
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

// "1 – 31 Oktober 2026" untuk periode satu bulan, atau rentang bertanggal penuh
// bila periode melintasi bulan (mis. anggaran mingguan).
export function formatPeriodRange(start: string, end: string): string {
  const from = parseDate(start.slice(0, 10));
  const to = parseDate(end.slice(0, 10));
  if (!from || !to) return `${start} – ${end}`;

  if (from.year === to.year && from.month === to.month) {
    return `${from.day} – ${to.day} ${formatMonthLabel(start.slice(0, 7))}`;
  }
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

// Sisa hari sampai period_end (0 = hari terakhir, negatif = periode sudah lewat).
export function daysLeft(periodEnd: string, now: Date = new Date()): number {
  const end = toUtcMs(periodEnd);
  const today = toUtcMs(isoToday(now));
  if (end === null || today === null) return 0;
  return Math.round((end - today) / DAY_MS);
}

export function isActivePeriod(
  periodStart: string,
  periodEnd: string,
  now: Date = new Date()
): boolean {
  const start = toUtcMs(periodStart);
  const end = toUtcMs(periodEnd);
  const today = toUtcMs(isoToday(now));
  if (start === null || end === null || today === null) return false;
  return today >= start && today <= end;
}

// period_start yang akan dipakai POST /budgets: server menormalkannya ke tanggal 1.
export function currentPeriodStart(now: Date = new Date()): string {
  return `${currentMonth(now)}-01`;
}

// ─── Turunan dari daftar anggaran ────────────────────────────────────────────

export function toMonthOptions(budgets: Budget[]): BudgetMonthOption[] {
  return [...budgets]
    .sort((a, b) => b.period_start.localeCompare(a.period_start))
    .map((budget) => ({
      id: budget.id,
      monthLabel:
        budget.period_type === "monthly"
          ? formatMonthLabel(budget.period_start.slice(0, 7))
          : formatDateShort(budget.period_start),
      rangeLabel: formatPeriodRange(budget.period_start, budget.period_end),
      isActive: isActivePeriod(budget.period_start, budget.period_end),
    }));
}

// Bulan berjalan bila ada; kalau tidak, periode terbaru yang tercatat.
export function pickDefaultMonth(
  options: BudgetMonthOption[]
): string | null {
  return options.find((option) => option.isActive)?.id ?? options[0]?.id ?? null;
}

// Angka persen mengikuti locale Indonesia: 88,3% (backend mengirim satu desimal).
// Nilai yang tidak valid (cache tidak lengkap) ditampilkan 0 agar layar tidak jatuh.
export function formatPercent(percent: number): string {
  if (!Number.isFinite(percent)) return "0";
  return percent.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

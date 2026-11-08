// Backend menghitung bulan dan "hari ini" dengan zona Asia/Jakarta (UTC+7, tanpa DST).
// Digeser manual lalu dibaca dengan getUTC*: tidak bergantung zona waktu perangkat
// maupun dukungan Intl di Hermes.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
] as const;
const MONTHS_LONG = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

function toJakarta(now: Date): Date {
    return new Date(now.getTime() + JAKARTA_OFFSET_MS);
}

// Bulan berjalan format "YYYY-MM" (sama dengan parameter `month` di GET /dashboard)
export function currentMonth(now: Date = new Date()): string {
    const j = toJakarta(now);
    const month = String(j.getUTCMonth() + 1).padStart(2, "0");
    return `${j.getUTCFullYear()}-${month}`;
}

// Tanggal hari ini (1–31) menurut Jakarta
export function currentDay(now: Date = new Date()): number {
    return toJakarta(now).getUTCDate();
}

// "2026-11" -> "November 2026"; format tidak valid dikembalikan apa adanya
export function formatMonthLabel(month: string): string {
    const [year, m] = month.split("-").map(Number);
    if (!year || !m || m < 1 || m > 12) return month;
    return `${MONTHS_LONG[m - 1]} ${year}`;
}

// Jumlah hari pada bulan "YYYY-MM"; NaN bila format tidak valid
export function daysInMonth(month: string): number {
    const [year, m] = month.split("-").map(Number);
    return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

// "Hari ini", "Kemarin", atau "26 Okt" (+ tahun bila bukan tahun ini).
// Backend hanya memberi tanggal tanpa jam, jadi tidak ada keterangan waktu.
export function formatRelativeDate(date: string, now: Date = new Date()): string {
    const [year, month, day] = date.slice(0, 10).split("-").map(Number);
    if (!year || !month || !day || month > 12) return date;

    const j = toJakarta(now);
    const todayMs = Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate());
    const diffDays = Math.round((todayMs - Date.UTC(year, month - 1, day)) / DAY_MS);

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    const base = `${day} ${MONTHS_SHORT[month - 1]}`;
    return year === j.getUTCFullYear() ? base : `${base} ${year}`;
}
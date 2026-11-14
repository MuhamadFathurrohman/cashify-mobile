import {
    currentDay,
    currentMonth,
    formatMonthLabel,
} from "@/features/dashboard/dashboardDates";
import type { CreateTransactionRequest, TransactionType } from "@/types/api";
import { parseRawAmount } from "@/utils/currency";

// Batas dari OpenAPI backend (📄 belum diuji dengan permintaan nyata ❓)
export const MAX_AMOUNT = 1_000_000_000;
export const MAX_DESCRIPTION_LENGTH = 255;

// `formatted` = isi kolom nominal berformat id-ID ("25.000"), bukan angka mentah
export function validateAmount(formatted: string): string | null {
    if (!formatted.trim()) return "Masukkan nominal";
    const amount = parseRawAmount(formatted);
    if (amount <= 0) return "Nominal harus lebih dari 0";
    if (amount > MAX_AMOUNT) return "Nominal maksimal Rp 1.000.000.000";
    return null;
}

// ── Tanggal ─────────────────────────────────────────────────────────────
// Semua tanggal berupa string "YYYY-MM-DD" (kalender, tanpa jam dan tanpa zona).
// "Hari ini" mengikuti Jakarta lewat dashboardDates, bukan zona perangkat.
// ❓ Zona yang dipakai backend untuk aturan "tidak boleh di masa depan" belum
// terdokumentasi; bila ternyata UTC, tanggal hari ini WIB sebelum pukul 07.00 bisa ditolak.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface DateParts {
    year: number;
    month: number;
    day: number;
}

function pad(value: number, length = 2): string {
    return String(value).padStart(length, "0");
}

function parseDate(value: string): DateParts | null {
    const match = DATE_PATTERN.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    // Tolak tanggal yang tidak ada di kalender (mis. 2026-02-30)
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (
        probe.getUTCFullYear() !== year ||
        probe.getUTCMonth() !== month - 1 ||
        probe.getUTCDate() !== day
    ) {
        return null;
    }
    return { year, month, day };
}

// Hari ini menurut Jakarta, format "YYYY-MM-DD"
export function todayDate(now: Date = new Date()): string {
    return `${currentMonth(now)}-${pad(currentDay(now))}`;
}

// Batas paling lama: tanggal yang sama setahun lalu (kalender).
// 29 Februari bergeser ke 1 Maret tahun sebelumnya, sisi yang lebih ketat,
// sehingga klien tidak pernah mengirim tanggal di luar batas "1 tahun" backend.
export function earliestAllowedDate(now: Date = new Date()): string {
    const today = todayDate(now);
    const parts = parseDate(today);
    if (!parts) return today;
    const back = new Date(Date.UTC(parts.year - 1, parts.month - 1, parts.day));
    return `${pad(back.getUTCFullYear(), 4)}-${pad(back.getUTCMonth() + 1)}-${pad(back.getUTCDate())}`;
}

export function validateTransactionDate(
    value: string,
    now: Date = new Date()
): string | null {
    if (!parseDate(value)) return "Pilih tanggal yang valid";
    // Format ISO yang seragam membuat perbandingan string setara perbandingan tanggal
    if (value > todayDate(now)) return "Tanggal tidak boleh di masa depan";
    if (value < earliestAllowedDate(now)) {
        return "Tanggal paling lama satu tahun ke belakang";
    }
    return null;
}

// Nilai `date` dari date picker (Date, string ISO, angka, atau objek Dayjs) -> "YYYY-MM-DD".
// Dibaca dengan komponen tanggal LOKAL perangkat karena kalender menampilkan hari lokal;
// itu yang dipilih pengguna, apa pun zona waktu perangkat. String "YYYY-MM-DD" dikembalikan
// apa adanya agar tidak bergeser sehari (string tanggal saja dibaca sebagai UTC oleh Date).
export function pickerValueToDateString(value: unknown): string | null {
    let date: Date | null = null;
    if (typeof value === "string" && DATE_PATTERN.test(value)) {
        return parseDate(value) ? value : null;
    }
    if (value instanceof Date) {
        date = value;
    } else if (typeof value === "string" || typeof value === "number") {
        date = new Date(value);
    } else if (
        typeof value === "object" &&
        value !== null &&
        typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
        date = (value as { toDate: () => Date }).toDate();
    }
    if (!date || Number.isNaN(date.getTime())) return null;
    return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "2026-10-26" -> "26 Oktober 2026"; format tidak valid dikembalikan apa adanya
export function formatDateLong(value: string): string {
    const parts = parseDate(value);
    if (!parts) return value;
    return `${parts.day} ${formatMonthLabel(value.slice(0, 7))}`;
}

// ── Permintaan ──────────────────────────────────────────────────────────

export interface TransactionFormInput {
    type: TransactionType;
    amount: string; // berformat id-ID
    categoryId: string;
    accountId: string;
    date: string;
    description: string;
}

// Catatan kosong tidak dikirim (backend menerima null atau tidak ada)
export function buildCreateRequest(
    input: TransactionFormInput
): CreateTransactionRequest {
    const description = input.description.trim();
    return {
        type: input.type,
        amount: parseRawAmount(input.amount),
        category_id: input.categoryId,
        account_id: input.accountId,
        date: input.date,
        ...(description ? { description } : {}),
    };
}
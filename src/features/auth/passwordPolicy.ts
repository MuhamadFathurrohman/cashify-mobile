import { z } from "zod";

// Batas mengikuti backend: minimal 8 karakter, maksimal 72 BYTE (batas bcrypt).
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;
// Hanya aturan UX di klien (tingkat "Kuat"), tidak dicek backend.
export const PASSWORD_STRONG_LENGTH = 12;

export type PasswordStrength = "none" | "weak" | "medium" | "strong";

export interface PasswordRequirement {
    id: "length" | "case" | "number" | "symbol";
    label: string;
    met: boolean;
}

// Backend menghitung karakter, bcrypt memakai byte; huruf non-Latin dan emoji lebih dari 1 byte.
export function utf8ByteLength(value: string): number {
    return new TextEncoder().encode(value).length;
}

export function getPasswordRequirements(value: string): PasswordRequirement[] {
    return [
        {
            id: "length",
            label: `Minimal ${PASSWORD_MIN_LENGTH} karakter`,
            met: value.length >= PASSWORD_MIN_LENGTH,
        },
        {
            id: "case",
            label: "Huruf besar & kecil",
            met: /[A-Z]/.test(value) && /[a-z]/.test(value),
        },
        { id: "number", label: "Angka", met: /\d/.test(value) },
        // Simbol = karakter selain A-Z, angka, dan spasi
        {
            id: "symbol",
            label: "Simbol (#, $, @)",
            met: /[^A-Za-z0-9\s]/.test(value),
        },
    ];
}

// Semua syarat wajib, jadi tingkat dibedakan oleh panjang. Password di atas batas byte dianggap lemah.
export function getPasswordStrength(value: string): PasswordStrength {
    if (value.length === 0) return "none";
    if (utf8ByteLength(value) > PASSWORD_MAX_BYTES) return "weak";
    if (!getPasswordRequirements(value).every((r) => r.met)) return "weak";
    return value.length >= PASSWORD_STRONG_LENGTH ? "strong" : "medium";
}

// Dipakai bersama register dan reset-password. Bukan untuk login (backend tidak membatasi login).
export const passwordSchema = z
    .string()
    .min(1, "Kata sandi wajib diisi")
    .min(PASSWORD_MIN_LENGTH, `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter`)
    .superRefine((value, ctx) => {
        if (utf8ByteLength(value) > PASSWORD_MAX_BYTES) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Kata sandi maksimal ${PASSWORD_MAX_BYTES} byte. Huruf non-Latin dan emoji dihitung lebih dari 1.`,
            });
        }
        if (
            value.length >= PASSWORD_MIN_LENGTH &&
            !getPasswordRequirements(value).every((r) => r.met)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Kata sandi belum memenuhi semua syarat",
            });
        }
    });
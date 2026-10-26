import { z } from "zod";

import { passwordSchema } from "./passwordPolicy";

// Langkah 1. .trim() mengikuti backend (nama di-trim server); zodResolver meneruskan nilai hasil trim.
export const registerAccountSchema = z.object({
    full_name: z
        .string()
        .trim()
        .min(1, "Nama lengkap wajib diisi")
        .min(2, "Nama minimal 2 karakter")
        .max(100, "Nama maksimal 100 karakter"),
    email: z
        .string()
        .trim()
        .min(1, "Email wajib diisi")
        .email("Format email tidak valid"),
});

// Langkah 2. Konfirmasi hanya ada di klien dan tidak dikirim ke backend.
export const registerPasswordSchema = z
    .object({
        password: passwordSchema,
        confirm_password: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
    })
    .refine((data) => data.password === data.confirm_password, {
        path: ["confirm_password"],
        message: "Kata sandi tidak cocok",
    });

export type RegisterAccountForm = z.infer<typeof registerAccountSchema>;
export type RegisterPasswordForm = z.infer<typeof registerPasswordSchema>;
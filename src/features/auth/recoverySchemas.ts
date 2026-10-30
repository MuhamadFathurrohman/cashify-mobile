import { z } from "zod";

import { registerAccountSchema, registerPasswordSchema } from "./registerSchemas";

// Email dijadikan huruf kecil agar kunci cooldown dan permintaan ke server konsisten
export const forgotPasswordSchema = z.object({
    email: registerAccountSchema.shape.email.toLowerCase(),
});

// Reset-password memakai aturan yang sama dengan langkah kata sandi pada register
export const resetPasswordSchema = registerPasswordSchema;

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
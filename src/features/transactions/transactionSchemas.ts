import { z } from "zod";
import {
    MAX_DESCRIPTION_LENGTH,
    todayDate,
    validateAmount,
    validateTransactionDate,
} from "./transactionRules";

// Jenis transaksi (pengeluaran/pemasukan) tidak masuk skema: ia berasal dari toggle
// dan dikirim terpisah lewat buildCreateRequest. Semua nilai berupa string agar tipe
// input dan output skema sama (tanpa transform) di react-hook-form.
export const transactionFormSchema = z.object({
    amount: z.string().superRefine((value, ctx) => {
        const message = validateAmount(value);
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }),
    categoryId: z.string().min(1, "Pilih kategori"),
    accountId: z.string().min(1, "Pilih dompet"),
    date: z.string().superRefine((value, ctx) => {
        const message = validateTransactionDate(value);
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }),
    description: z
        .string()
        .trim()
        .max(MAX_DESCRIPTION_LENGTH, `Catatan maksimal ${MAX_DESCRIPTION_LENGTH} karakter`),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

// accountId diisi setelah GET /accounts selesai (dompet default); kategori dikosongkan
// dan harus dipilih pengguna.
export function defaultTransactionValues(accountId = ""): TransactionFormValues {
    return {
        amount: "",
        categoryId: "",
        accountId,
        date: todayDate(),
        description: "",
    };
}
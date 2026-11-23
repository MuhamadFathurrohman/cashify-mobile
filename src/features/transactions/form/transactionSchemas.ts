import { z } from "zod";
import type { Transaction } from "@/types/api";
import { formatInputAmount } from "@/utils/currency";
import {
    MAX_DESCRIPTION_LENGTH,
    todayDate,
    validateAmount,
    validateTransactionDate,
} from "../transactionRules";

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

// Nilai awal mode ubah: kategori/dompet/tanggal dari transaksi, nominal diformat
// seperti isi kolom (mis. 25000 -> "25.000"), catatan null menjadi string kosong.
export function transactionValuesFromTransaction(
    item: Transaction
): TransactionFormValues {
    return {
        amount: formatInputAmount(String(item.amount)),
        categoryId: item.category.id,
        accountId: item.account.id,
        date: item.date.slice(0, 10),
        description: item.description ?? "",
    };
}
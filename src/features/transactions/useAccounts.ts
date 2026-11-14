import { apiClient } from "@/lib/api/client";
import type { Account, AccountListResponse } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { accountKeys } from "./transactionKeys";

// Dompet tambahan belum bisa dibuat (Phase 2); sekarang hanya "Tunai"
const ACCOUNTS_STALE_MS = 30 * 60 * 1000;

async function fetchAccounts(): Promise<Account[]> {
    const response = await apiClient.get<AccountListResponse>("/accounts");
    return response.data;
}

export function useAccounts() {
    return useQuery({
        queryKey: accountKeys.all,
        queryFn: fetchAccounts,
        staleTime: ACCOUNTS_STALE_MS,
    });
}

// Dompet bawaan form: yang is_default, lalu dompet pertama bila tidak ada yang bertanda
export function pickDefaultAccount(accounts: Account[]): Account | undefined {
    return accounts.find((account) => account.is_default) ?? accounts[0];
}
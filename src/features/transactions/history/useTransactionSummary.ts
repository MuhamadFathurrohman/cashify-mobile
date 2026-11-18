import { apiClient } from "@/lib/api/client";
import type { TransactionListParams, TransactionListResponse, TransactionType } from "@/types/api";
import { useCallback, useEffect, useRef, useState } from "react";

// Limit besar untuk meminimalkan jumlah request saat menelusuri semua halaman
const SUMMARY_LIMIT = 100;

export interface TransactionSummary {
    income: number;
    expense: number;
}

// Params ringkasan tidak menyertakan `type`: ringkasan selalu menghitung
// kedua jenis transaksi terlepas dari tab yang sedang aktif di daftar.
export type SummaryParams = Omit<TransactionListParams, "type">;

async function fetchPage(
    params: SummaryParams,
    cursor: string | undefined,
): Promise<TransactionListResponse> {
    const query = new URLSearchParams();

    if (params.from)        query.set("from", params.from);
    if (params.to)          query.set("to", params.to);
    if (params.category_id) query.set("category_id", params.category_id);
    if (params.account_id)  query.set("account_id", params.account_id);
    if (params.source)      query.set("source", params.source);
    if (params.q?.trim())   query.set("q", params.q.trim());
    if (cursor)             query.set("cursor", cursor);

    query.set("limit", String(SUMMARY_LIMIT));
    return apiClient.get<TransactionListResponse>(`/transactions?${query.toString()}`);
}

function sumPages(pages: TransactionListResponse[]): TransactionSummary {
    let income = 0;
    let expense = 0;
    for (const page of pages) {
        for (const tx of page.data) {
            if ((tx.type as TransactionType) === "income") {
                income += tx.amount;
            } else {
                expense += tx.amount;
            }
        }
    }
    return { income, expense };
}

// Hook ringkasan transaksi — menghitung Total Masuk dan Total Keluar dengan
// menelusuri seluruh halaman GET /transactions menggunakan limit=100.
//
// Status loading dan error independen dari useTransactions: kegagalan ringkasan
// tidak memengaruhi daftar, begitu pula sebaliknya.
//
// Stale request protection: setiap kali params berubah, requestIdRef di-increment.
// Loop yang sedang berjalan membandingkan ID-nya dengan ref sebelum melanjutkan;
// jika berbeda, loop berhenti dan hasilnya dibuang.
export function useTransactionSummary(params: SummaryParams) {
    const [summary, setSummary] = useState<TransactionSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    // Stale request guard: di-increment setiap kali params berubah
    const requestIdRef = useRef(0);

    // Params diubah ke string agar bisa jadi dependency useEffect dengan aman
    const paramsKey = JSON.stringify(params);

    const run = useCallback(async (currentParams: SummaryParams, myId: number) => {
        setIsLoading(true);
        setIsError(false);
        setSummary(null);

        const pages: TransactionListResponse[] = [];
        let cursor: string | undefined = undefined;

        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                // Berhenti jika filter sudah berubah sebelum loop selesai
                if (requestIdRef.current !== myId) return;

                const page = await fetchPage(currentParams, cursor);

                // Periksa lagi setelah await — filter bisa berubah saat request berjalan
                if (requestIdRef.current !== myId) return;

                pages.push(page);

                if (!page.has_more || page.next_cursor == null) break;
                cursor = page.next_cursor;
            }

            setSummary(sumPages(pages));
        } catch {
            if (requestIdRef.current !== myId) return;
            setIsError(true);
        } finally {
            if (requestIdRef.current === myId) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        requestIdRef.current += 1;
        const myId = requestIdRef.current;

        void run(params, myId);
        // paramsKey dipakai sebagai proxy params agar effect re-run saat params berubah
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey, run]);

    const retry = useCallback(() => {
        requestIdRef.current += 1;
        const myId = requestIdRef.current;
        void run(params, myId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey, run]);

    return { summary, isLoading, isError, retry };
}
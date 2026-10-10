import { create } from "zustand";

interface UIStore {
    isBalanceHidden: boolean;
    toggleBalanceVisibility: () => void;

    transactionsFilter: "all" | "income" | "expense";
    setTransactionFilter: (filter: "all" | "income" | "expense") => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isBalanceHidden: false,
    toggleBalanceVisibility: () =>
        set((state) => ({ isBalanceHidden: !state.isBalanceHidden })),

    transactionsFilter: "all",
    setTransactionFilter: (filter) => set({ transactionsFilter: filter }),
}))
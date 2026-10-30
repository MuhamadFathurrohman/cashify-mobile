import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { create } from "zustand";

export const RESEND_COOLDOWN_SECONDS = 60;

interface CooldownState {
    // email (huruf kecil) → tenggat dalam epoch ms; hanya di memori, hilang saat app ditutup
    deadlines: Record<string, number>;
    start: (email: string, seconds?: number) => void;
}

export const useForgotPasswordCooldown = create<CooldownState>((set) => ({
    deadlines: {},
    start: (email, seconds = RESEND_COOLDOWN_SECONDS) =>
        set((state) => ({
            deadlines: {
                ...state.deadlines,
                [email]: Date.now() + seconds * 1000,
            },
        })),
}));

export function isInCooldown(email: string): boolean {
    return (
        (useForgotPasswordCooldown.getState().deadlines[email] ?? 0) > Date.now()
    );
}

// Snapshot berubah sekali per detik; saat app kembali aktif, baca ulang segera
// karena timer JS tertahan saat di latar belakang
function subscribeToSeconds(onTick: () => void) {
    const id = setInterval(onTick, 1000);
    const appState = AppState.addEventListener("change", (state) => {
        if (state === "active") onTick();
    });
    return () => {
        clearInterval(id);
        appState.remove();
    };
}

const getNowSeconds = () => Math.floor(Date.now() / 1000);

export function useCooldownRemaining(email: string): number {
    const deadline = useForgotPasswordCooldown((s) => s.deadlines[email]);
    const nowSeconds = useSyncExternalStore(subscribeToSeconds, getNowSeconds);
    return deadline
        ? Math.max(0, Math.floor(deadline / 1000) - nowSeconds)
        : 0;
}

export function formatCountdown(totalSeconds: number): string {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}
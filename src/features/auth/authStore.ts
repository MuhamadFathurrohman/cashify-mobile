import { setSessionExpiredHandler } from "@/lib/api/client";
import type { UserProfile } from "@/types/api";
import { create } from "zustand";

// loading      : cek sesi awal (atau retry setelah unavailable)
// signedOut    : belum login
// needsOnboarding : login, onboarding belum selesai
// ready        : siap dipakai
// unavailable  : ada token tapi jaringan/server tidak terjangkau saat bootstrap
export type AuthStatus =
    | "loading"
    | "signedOut"
    | "needsOnboarding"
    | "ready"
    | "unavailable";

interface AuthState {
    status: AuthStatus;
    user: UserProfile | null;
    // Dipanggil setelah login, register, GET /me, atau PATCH /me berhasil
    setUser: (user: UserProfile) => void;
    setSignedOut: () => void;
    // Dipanggil saat bootstrap gagal karena jaringan/5xx (token tetap ada)
    setUnavailable: () => void;
    // Dipanggil dari tombol "Coba Lagi" untuk memicu ulang bootstrap
    setLoading: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    status: "loading",
    user: null,
    setUser: (user) =>
        set({
            user,
            status: user.onboarding_completed_at ? "ready" : "needsOnboarding",
        }),
    setSignedOut: () => set({ user: null, status: "signedOut" }),
    setUnavailable: () => set({ status: "unavailable" }),
    setLoading: () => set({ status: "loading" }),
}));

// apiClient tidak mengimpor store (hindari impor melingkar); store mendaftarkan diri di sini
setSessionExpiredHandler(() => useAuthStore.getState().setSignedOut());
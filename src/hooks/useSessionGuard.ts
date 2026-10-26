import { useAuthStore, type AuthStatus } from "@/features/auth/authStore";
import { apiClient } from "@/lib/api/client";
import { getTokens } from "@/lib/storage/keychain";
import type { UserProfile } from "@/types/api";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

type ResolvedStatus = Exclude<AuthStatus, "loading">;

// Grup rute yang boleh diakses per status. "transaction" berada di luar grup
// tapi hanya untuk pengguna yang sudah siap
const ALLOWED_GROUPS: Record<ResolvedStatus, string[]> = {
    signedOut: ["(auth)"],
    needsOnboarding: ["(onboarding)"],
    ready: ["(tabs)", "transaction"],
    unavailable: ["(auth)"],
};

const DEFAULT_ROUTE = {
    signedOut: "/(auth)/login",
    needsOnboarding: "/(onboarding)/welcome",
    ready: "/(tabs)",
    unavailable: "/(auth)/unavailable",
} as const;

export function useSessionGuard() {
    const router = useRouter();
    const segments = useSegments();
    const status = useAuthStore((s) => s.status);

    // Jalankan bootstrap setiap kali status berubah ke "loading".
    // Ini mencakup dua kasus:
    //   1. Pertama kali app dibuka (status awal = "loading")
    //   2. Pengguna menekan "Coba Lagi" di layar unavailable (setLoading → "loading")
    useEffect(() => {
        if (status !== "loading") return;

        let cancelled = false;

        async function bootstrap() {
            const { setUser, setSignedOut, setUnavailable } =
                useAuthStore.getState();
            try {
                const tokens = await getTokens();
                if (!tokens) {
                    if (!cancelled) setSignedOut();
                    return;
                }
                // apiClient menangani refresh token saat 401
                const user = await apiClient.get<UserProfile>("/me");
                if (!cancelled) setUser(user);
            } catch {
                if (cancelled) return;
                // Bila sesi berakhir (refresh token ditolak), apiClient sudah
                // memanggil setSignedOut via sessionExpiredHandler sebelum melempar
                // error. Cek status aktual store untuk menghindari menimpa "signedOut"
                // dengan "unavailable".
                if (useAuthStore.getState().status === "signedOut") return;
                // Jaringan tidak terjangkau atau server error (5xx):
                // token dipertahankan, arahkan ke layar unavailable
                setUnavailable();
            }
        }

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, [status]);

    // Arahkan ke grup yang sesuai setiap status atau rute berubah
    // (login, logout, sesi habis, onboarding selesai, unavailable)
    useEffect(() => {
        if (status === "loading") return;

        const group = segments[0] as string | undefined;
        if (!group || !ALLOWED_GROUPS[status].includes(group)) {
            router.replace(DEFAULT_ROUTE[status]);
        }
    }, [status, segments, router]);

    return { isReady: status !== "loading" };
}
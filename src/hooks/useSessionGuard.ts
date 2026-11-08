import { useAuthStore, type AuthStatus } from "@/features/auth/authStore";
import {
    resolveOnboardingStep,
    useOnboardingStore,
} from "@/features/onboarding/onboardingStore";
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

const ONBOARDING_ROUTE = {
    welcome: "/(onboarding)/welcome",
    "initial-balance": "/(onboarding)/initial-balance",
    whatsapp: "/(onboarding)/whatsapp",
} as const;

const DEFAULT_ROUTE = {
    signedOut: "/(auth)/login",
    ready: "/(tabs)",
    unavailable: "/(auth)/unavailable",
} as const;

// needsOnboarding memakai progres lokal agar app dibuka kembali di langkah terakhir
function getDefaultRoute(status: ResolvedStatus) {
    if (status === "needsOnboarding") {
        const userId = useAuthStore.getState().user?.id;
        const { progress } = useOnboardingStore.getState();
        return ONBOARDING_ROUTE[resolveOnboardingStep(progress, userId)];
    }
    return DEFAULT_ROUTE[status];
}

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

            // Progres onboarding dimuat sebelum status ditentukan, apa pun hasil
            // cek token, supaya rute resume sudah siap saat guard mengarahkan
            await useOnboardingStore.getState().ensureLoaded();
            if (cancelled) return;

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

        const parts: readonly string[] = segments;
        const group = parts[0];
        // Tautan reset bisa dibuka pada status apa pun, termasuk saat sudah login
        if (group === "(auth)" && parts[1] === "reset-password") return;

        if (!group || !ALLOWED_GROUPS[status].includes(group)) {
            router.replace(getDefaultRoute(status));
        }
    }, [status, segments, router]);

    return { isReady: status !== "loading" };
}
import { useAuthStore } from "@/features/auth/authStore";
import {
    resolveOnboardingStep,
    useOnboardingStore,
} from "@/features/onboarding/onboardingStore";
import { apiClient } from "@/lib/api/client";
import { getTokens } from "@/lib/storage/keychain";
import type { UserProfile } from "@/types/api";
import { useRouter, useSegments, type Href } from "expo-router";
import { useEffect } from "react";

const ONBOARDING_ROUTE = {
    welcome: "/(onboarding)/welcome",
    "initial-balance": "/(onboarding)/initial-balance",
    whatsapp: "/(onboarding)/whatsapp",
} as const;

// Layar onboarding yang bukan langkah resume: jangan dialihkan oleh guard.
// whatsapp-verify adalah lanjutan di dalam alur WhatsApp.
const NON_RESUME_ONBOARDING_SCREEN = "whatsapp-verify";

// Guard sesi bertugas menyelesaikan status auth dan memilih langkah onboarding.
// Pembatasan akses rute kini dilakukan deklaratif lewat Stack.Protected di
// src/app/_layout.tsx, bukan lewat router.replace berbasis effect.
export function useSessionGuard() {
    const router = useRouter();
    const segments = useSegments();
    const status = useAuthStore((s) => s.status);
    const userId = useAuthStore((s) => s.user?.id);
    const progress = useOnboardingStore((s) => s.progress);

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
                // token dipertahankan, status unavailable menampilkan layar khusus
                setUnavailable();
            }
        }

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, [status]);

    // Stack.Protected hanya memilih grup rute, bukan langkah di dalam grup.
    // Karena itu langkah onboarding tetap dipilih di sini dari progres lokal.
    useEffect(() => {
        if (status !== "needsOnboarding") return;
        if (segments[0] !== "(onboarding)") return;

        const currentScreen = segments[1];
        if (currentScreen === NON_RESUME_ONBOARDING_SCREEN) return;

        const userId = useAuthStore.getState().user?.id;
        const { progress } = useOnboardingStore.getState();
        const step = resolveOnboardingStep(progress, userId);

        if (currentScreen !== step) {
            router.replace(ONBOARDING_ROUTE[step]);
        }
    }, [status, segments, router]);

    // Target redirect ketika sebuah guard gagal. Harus berupa rute konkret:
    // grup (auth) dan (onboarding) tidak punya index sendiri, sehingga fallback
    // bawaan navigator berupa path grup ("/(auth)") tidak cocok dengan rute mana
    // pun dan berakhir di layar "Unmatched Route".
    const redirectTo: Href =
        status === "signedOut"
            ? "/login"
            : status === "needsOnboarding"
              ? ONBOARDING_ROUTE[resolveOnboardingStep(progress, userId)]
              : status === "unavailable"
                ? "/unavailable"
                : "/";

    return { isReady: status !== "loading", redirectTo };
}

import { useAuthStore } from "@/features/auth/authStore";
import {
    clearOnboardingProgress,
    getOnboardingProgress,
    saveOnboardingProgress,
    type OnboardingProgress,
} from "@/lib/storage/onboardingProgress";
import { create } from "zustand";

export type OnboardingStep = "welcome" | "initial-balance" | "whatsapp";

interface OnboardingState {
    progress: OnboardingProgress | null;
    // Baca progres dari penyimpanan sekali; aman dipanggil berulang
    ensureLoaded: () => Promise<void>;
    // Dipanggil "Mulai Sekarang" di welcome
    markWelcomeDone: () => Promise<void>;
    // Dipanggil "Lanjutkan" atau "Lewati" di initial-balance
    markBalanceDone: () => Promise<void>;
    // Dipanggil setelah onboarding ditandai selesai di server
    clear: () => Promise<void>;
}

// Satu pembacaan dipakai semua pemanggil, supaya tulis tidak tertimpa hasil baca
let loading: Promise<void> | null = null;

export const useOnboardingStore = create<OnboardingState>((set, get) => {
    async function mark(
        patch: Partial<Pick<OnboardingProgress, "welcomeDone" | "balanceDone">>
    ) {
        await get().ensureLoaded();
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;

        // Progres milik pengguna lain di perangkat ini tidak dipakai ulang
        const current = get().progress;
        const base: OnboardingProgress =
            current?.userId === userId
                ? current
                : { userId, welcomeDone: false, balanceDone: false };

        const next = { ...base, ...patch };
        set({ progress: next });
        await saveOnboardingProgress(next);
    }

    return {
        progress: null,
        ensureLoaded: () => {
            loading ??= getOnboardingProgress().then((progress) => {
                set({ progress });
            });
            return loading;
        },
        markWelcomeDone: () => mark({ welcomeDone: true }),
        markBalanceDone: () => mark({ welcomeDone: true, balanceDone: true }),
        clear: async () => {
            await get().ensureLoaded();
            set({ progress: null });
            await clearOnboardingProgress();
        },
    };
});

// Layar onboarding yang dituju untuk pengguna aktif. WhatsApp tidak disimpan lokal:
// layarnya sendiri memeriksa GET /whatsapp/status.
export function resolveOnboardingStep(
    progress: OnboardingProgress | null,
    userId: string | undefined
): OnboardingStep {
    if (!progress || !userId || progress.userId !== userId) return "welcome";
    if (!progress.welcomeDone) return "welcome";
    if (!progress.balanceDone) return "initial-balance";
    return "whatsapp";
}
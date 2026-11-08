import * as SecureStore from "expo-secure-store";

const PROGRESS_KEY = "cashify_onboarding_progress";

// Posisi langkah onboarding di perangkat ini. Hanya penanda layar, bukan data:
// nilai saldo dan status WhatsApp tetap bersumber dari server.
export interface OnboardingProgress {
    userId: string;
    welcomeDone: boolean;
    balanceDone: boolean;
}

function isProgress(value: unknown): value is OnboardingProgress {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.userId === "string" &&
        typeof v.welcomeDone === "boolean" &&
        typeof v.balanceDone === "boolean"
    );
}

export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
    try {
        const raw = await SecureStore.getItemAsync(PROGRESS_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isProgress(parsed) ? parsed : null;
    } catch {
        // Data rusak atau SecureStore gagal: anggap belum ada progres
        return null;
    }
}

export async function saveOnboardingProgress(
    progress: OnboardingProgress
): Promise<void> {
    try {
        await SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
        // Gagal menyimpan hanya berarti resume mulai dari welcome; jangan blokir alur
    }
}

export async function clearOnboardingProgress(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(PROGRESS_KEY);
    } catch {
        // Sisa progres tidak berbahaya: onboarding selesai di server selalu menang
    }
}
import { useAuthStore } from "@/features/auth/authStore";
import { useOnboardingStore } from "@/features/onboarding/onboardingStore";
import { apiClient } from "@/lib/api/client";
import type {
    UpdateProfileRequest,
    UpdateProfileResponse,
} from "@/types/api";
import { useMutation } from "@tanstack/react-query";

// ─── API Functions ────────────────────────────────────────────────────────────

async function completeOnboardingApi(): Promise<UpdateProfileResponse> {
    return apiClient.post<UpdateProfileResponse>("/me/onboarding/complete", undefined);
}

async function updateProfileApi(payload: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return apiClient.patch<UpdateProfileResponse>("/me", payload);
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

// Dipanggil di akhir onboarding: "Lewati" atau selesai verifikasi di langkah WhatsApp.
// Idempoten: updateMany WHERE onboarding_completed_at IS NULL — aman dipanggil berulang.
// setUser mengubah status ke "ready", lalu guard memindahkan ke tabs.
// retry 0: pengguna menunggu hasilnya, jadi gagal langsung tampil dan bisa diulang manual.
export function useCompleteOnboarding() {
    return useMutation<UpdateProfileResponse, Error, undefined>({
        mutationFn: completeOnboardingApi,
        onSuccess: (data) => {
            useAuthStore.getState().setUser(data);
            // Progres lokal tidak diperlukan lagi; gagal menghapus tidak mengganggu alur
            void useOnboardingStore.getState().clear();
        },
        retry: 0,
    });
}

// Dipanggil tombol "Lanjutkan" di initial-balance.tsx.
export function useUpdateProfile() {
    return useMutation<UpdateProfileResponse, Error, UpdateProfileRequest>({
        mutationFn: updateProfileApi,
        onSuccess: (data) => {
            useAuthStore.getState().setUser(data);
        },
        retry: 0,
    });
}
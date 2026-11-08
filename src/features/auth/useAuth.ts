import { useAuthStore } from "@/features/auth/authStore";
import { apiClient } from "@/lib/api/client";
import { clearTokens, saveTokens } from "@/lib/storage/keychain";
import type {
    ForgotPasswordRequest,
    GoogleAuthRequest,
    GoogleAuthResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
} from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ─── API Functions ────────────────────────────────────────────────────────────

async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        payload,
        false
    );
    await saveTokens({
        accessToken: response.session.access_token,
        refreshToken: response.session.refresh_token,
    });
    return response;
}

async function registerApi(payload: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>(
        "/auth/register",
        payload,
        false
    );
}

async function forgotPasswordApi(payload: ForgotPasswordRequest): Promise<void> {
    await apiClient.post<void>("/auth/forgot-password", payload, false);
}

async function resetPasswordApi(payload: ResetPasswordRequest): Promise<void> {
    await apiClient.post<void>("/auth/reset-password", payload, false);
}

// ⚠️ DEV BUILD REQUIRED: useGoogleAuth membutuhkan development build.
// GoogleSignin.signIn() hanya bisa dipanggil setelah:
// 1. webClientId dari tim backend diisi di app.json
// 2. npx expo run:android dijalankan
// 3. Keputusan Expo Go vs development build dikonfirmasi
// Pola alur: GoogleSignin.signIn() → dapat id_token → POST /auth/google → simpan token → setUser
async function googleAuthApi(payload: GoogleAuthRequest): Promise<GoogleAuthResponse> {
    const response = await apiClient.post<GoogleAuthResponse>(
        "/auth/google",
        payload,
        false
    );
    await saveTokens({
        accessToken: response.session.access_token,
        refreshToken: response.session.refresh_token,
    });
    return response;
}

// Fire-and-forget: sesi lokal tetap dihapus meski request gagal.
// Endpoint logout tanpa body (JWT saja)
async function logoutApi(): Promise<void> {
    await apiClient.post<void>("/auth/logout", undefined).catch(() => { });
    await clearTokens();
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useLogin() {
    const queryClient = useQueryClient();
    return useMutation<LoginResponse, Error, LoginRequest>({
        mutationFn: loginApi,
        onSuccess: (data) => {
            queryClient.clear();
            useAuthStore.getState().setUser(data.user);
        },
        retry: 0,
    });
}

// Hanya memanggil API; sesi ditahan di RegisterContext sampai layar sukses ditutup
export function useRegister() {
    return useMutation<RegisterResponse, Error, RegisterRequest>({
        mutationFn: registerApi,
        retry: 0,
    });
}

// Dipanggil tombol "Lanjutkan" di layar sukses: simpan token, lalu setUser memicu redirect guard
export function useCompleteRegistration() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, RegisterResponse>({
        mutationFn: async ({ session }) => {
            await saveTokens({
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
            });
        },
        onSuccess: (_data, { user }) => {
            queryClient.clear();
            useAuthStore.getState().setUser(user);
        },
        retry: 0,
    });
}

export function useForgotPassword() {
    return useMutation<void, Error, ForgotPasswordRequest>({
        mutationFn: forgotPasswordApi,
        retry: 0,
    });
}

export function useResetPassword() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, ResetPasswordRequest>({
        mutationFn: resetPasswordApi,
        onSuccess: async () => {
            await clearTokens();
            queryClient.clear();
            useAuthStore.getState().setSignedOut();
        },
        retry: 0,
    });
}

export function useGoogleAuth() {
    const queryClient = useQueryClient();
    return useMutation<GoogleAuthResponse, Error, GoogleAuthRequest>({
        mutationFn: googleAuthApi,
        onSuccess: (data) => {
            queryClient.clear();
            useAuthStore.getState().setUser(data.user);
        },
        retry: 0,
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, void>({
        mutationFn: logoutApi,
        onSettled: () => {
            queryClient.clear();
            useAuthStore.getState().setSignedOut();
        },
        retry: 0,
    });
}
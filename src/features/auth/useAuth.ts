import { apiClient } from "@/lib/api/client";
import { clearTokens, getTokens, saveTokens } from "@/lib/storage/keychain";
import type {
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
} from "@/types/api";
import { useMutation } from "@tanstack/react-query";

// API Function

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
    const response = await apiClient.post<RegisterResponse>(
        "/auth/register",
        payload,
        false
    );
    await saveTokens({
        accessToken: response.session.access_token,
        refreshToken: response.session.refresh_token,
    });
    return response;
}

async function forgotPasswordApi(payload: ForgotPasswordRequest): Promise<void> {
    await apiClient.post<void>("/auth/forgot-password", payload, false);
}

async function resetPasswordApi(payload: ResetPasswordRequest): Promise<void> {
    await apiClient.post<void>("/auth/reset-password", payload, false);
}

async function logoutApi(): Promise<void> {
    const tokens = await getTokens();
    if (tokens) {
        const payload: LogoutRequest = { refresh_token: tokens.refreshToken};
        await apiClient.post<void>("/auth/logout", payload).catch(() => {});
    }
    await clearTokens();
}

// Hooks

export function useLogin() {
    return useMutation<LoginResponse, Error, LoginRequest>({
        mutationFn: loginApi,
        retry: 0,
    });
}

export function useRegister() {
    return useMutation<RegisterResponse, Error, RegisterRequest>({
        mutationFn: registerApi,
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
    return useMutation<void, Error, ResetPasswordRequest>({
        mutationFn: resetPasswordApi,
        retry: 0,
    });
}

export function useLogout() {
    return useMutation<void, Error, void>({
        mutationFn: logoutApi,
        retry: 0,
    });
}
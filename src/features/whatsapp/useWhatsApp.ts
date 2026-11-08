import { apiClient } from "@/lib/api/client";
import type {
    LinkWhatsAppRequest,
    LinkWhatsAppResponse,
    ResendWhatsAppOtpRequest,
    ResendWhatsAppOtpResponse,
    VerifyWhatsAppRequest,
    VerifyWhatsAppResponse,
    WhatsAppStatusResponse,
} from "@/types/api";
import { useMutation, useQuery } from "@tanstack/react-query";

// ─── API Functions ────────────────────────────────────────────────────────────

async function getWhatsAppStatusApi(): Promise<WhatsAppStatusResponse> {
    return apiClient.get<WhatsAppStatusResponse>("/whatsapp/status");
}

async function linkWhatsAppApi(
    payload: LinkWhatsAppRequest,
): Promise<LinkWhatsAppResponse> {
    return apiClient.post<LinkWhatsAppResponse>("/whatsapp/link/request", payload);
}

async function verifyWhatsAppApi(
    payload: VerifyWhatsAppRequest,
): Promise<VerifyWhatsAppResponse> {
    return apiClient.post<VerifyWhatsAppResponse>("/whatsapp/link/verify", payload);
}

async function resendWhatsAppOtpApi(
    _payload: ResendWhatsAppOtpRequest,
): Promise<ResendWhatsAppOtpResponse> {
    return apiClient.post<ResendWhatsAppOtpResponse>("/whatsapp/link/resend", undefined);
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

// Status tautan dari server; dipakai layar WhatsApp onboarding saat dibuka.
// Selalu diambil ulang dan tidak di-cache: status bisa berubah di luar app (OTP kedaluwarsa).
// retry 0 agar kegagalan jaringan tidak menahan layar; pemanggil jatuh ke form biasa.
export function useWhatsAppStatus() {
    return useQuery<WhatsAppStatusResponse, Error>({
        queryKey: ["whatsapp", "status"],
        queryFn: getWhatsAppStatusApi,
        staleTime: 0,
        gcTime: 0,
        retry: 0,
    });
}

// Dipanggil tombol "Hubungkan WhatsApp" di whatsapp.tsx.
// Mengirim OTP ke nomor WA; verifikasi OTP di whatsapp-verify.tsx.
export function useLinkWhatsApp() {
    return useMutation<LinkWhatsAppResponse, Error, LinkWhatsAppRequest>({
        mutationFn: linkWhatsAppApi,
        retry: 0,
    });
}

// Dipanggil tombol "Verifikasi" di whatsapp-verify.tsx.
export function useVerifyWhatsApp() {
    return useMutation<VerifyWhatsAppResponse, Error, VerifyWhatsAppRequest>({
        mutationFn: verifyWhatsAppApi,
        retry: 0,
    });
}

// Dipanggil tombol "Kirim ulang kode" di whatsapp-verify.tsx.
// Backend: jeda 60 detik per OTP, maks. 3 OTP/nomor dan 5 OTP/pengguna per hari.
export function useResendWhatsAppOtp() {
    return useMutation<ResendWhatsAppOtpResponse, Error, ResendWhatsAppOtpRequest>({
        mutationFn: resendWhatsAppOtpApi,
        retry: 0,
    });
}
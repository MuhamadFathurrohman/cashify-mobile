export type TransactionType = "income" | "expense";
export type TransactionSource = "manual" | "whatsapp" | "recurring" | "import";
export type AccountType = "cash" | "bank" | "ewallet";
export type WhatsappStatus = "unlinked" | "pending" | "verified";

export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: {
            field?: string;
            issue?: string;
            attempts_left?: number;
            retry_after_seconds?: number;
        }[];
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    next_cursor: string | null;
    has_more: boolean;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    initial_balance: number;
    currency: string;
    timezone: string;
    locale: string;
    onboarding_completed_at: string | null;
    created_at: string;
}

export interface Session {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
}

// Auth
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: UserProfile;
    session: Session;
}

export interface RefreshRequest {
    refresh_token: string;
}

export interface RefreshResponse {
    session: Session;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface RegisterResponse {
    user: UserProfile;
    session: Session;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
}

// ⚠️ DEV BUILD REQUIRED: Google Sign-In membutuhkan development build.
// Tipe ini sudah siap; implementasi native diaktifkan setelah:
// 1. webClientId dari tim backend diisi di app.json
// 2. npx expo run:android dijalankan
// 3. Keputusan Expo Go vs development build dikonfirmasi
export interface GoogleAuthRequest {
    id_token: string;
}

export interface GoogleAuthResponse {
    user: UserProfile;
    session: Session;
}

// Profile
export interface UpdateProfileRequest {
    full_name?: string;
    avatar_url?: string | null;
    initial_balance?: number;
}

// POST /me/onboarding/complete dan PATCH /me keduanya mengembalikan UserProfile
export type UpdateProfileResponse = UserProfile;

// WhatsApp (kontrak mengikuti SYSTEM_DOCUMENTATION backend, bagian 7.3 dan 8.7)
export interface WhatsAppPreferences {
    daily_summary_enabled: boolean;
    budget_alert_enabled: boolean;
}

// GET /whatsapp/status: sumber kebenaran status tautan, terpisah dari onboarding
export interface WhatsAppStatusResponse {
    status: WhatsappStatus;
    masked_phone: string | null; // mis. "+6281234xxxx9"
    expires_at: string | null; // hanya saat pending
    verified_at: string | null; // hanya saat verified
    last_message_at: string | null;
    preferences: WhatsAppPreferences;
}

export interface LinkWhatsAppRequest {
    // E.164 dengan "+", mis. "+628123456789"; backend tidak menormalisasi
    phone: string;
}

// Respons POST /whatsapp/link/request dan /whatsapp/link/resend
export interface LinkWhatsAppResponse {
    status: "pending";
    expires_at: string;
    masked_phone: string;
}

export interface VerifyWhatsAppRequest {
    code: string; // tepat 6 digit
}

// phone sudah disamarkan oleh backend
export interface VerifyWhatsAppResponse {
    status: "verified";
    phone: string;
    verified_at: string;
}

// POST /whatsapp/link/resend — tanpa body
export type ResendWhatsAppOtpRequest = undefined;
export type ResendWhatsAppOtpResponse = LinkWhatsAppResponse;


export interface Category {
    id: string;
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
    is_system: boolean;
}

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    is_default: boolean;
}

// Bentuk ringkas yang dipakai backend pada item transaksi (📄 SYSTEM_DOCUMENTATION, belum diuji ❓)
export type CategorySummary = Pick<Category, "id" | "name" | "icon" | "color">;
export type AccountSummary = Pick<Account, "id" | "name">;

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    category: CategorySummary;
    account: AccountSummary;
    date: string;
    description: string | null;
    source: TransactionSource;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface TransactionDetail extends Transaction {
    source_message: {
        body: string;
        received_at: string;
    } | null;
}

// Dashboard — GET /dashboard?month=YYYY-MM (📄 SYSTEM_DOCUMENTATION; belum diuji dengan respons nyata ❓)
// Item recent_transactions: maksimal 5, tidak terpengaruh `month`. Field yang diasumsikan ada
// (selain source, category, account yang tercatat di dokumen) perlu dicek dengan respons asli.
export type DashboardTransaction = Pick<
    Transaction,
    | "id"
    | "type"
    | "amount"
    | "date"
    | "description"
    | "source"
    | "category"
    | "account"
    | "created_at"
>;

export interface DashboardMonthSummary {
    income: number;
    expense: number;
    net: number;
}

// Hanya hari yang punya transaksi yang muncul di array; date berformat YYYY-MM-DD
export interface DashboardCashflowPoint {
    date: string;
    income: number;
    expense: number;
}

export interface DashboardResponse {
    // initial_balance + seluruh pemasukan - seluruh pengeluaran (seluruh waktu); bisa negatif
    balance: number;
    month: DashboardMonthSummary;
    cashflow: DashboardCashflowPoint[];
    recent_transactions: DashboardTransaction[];
}
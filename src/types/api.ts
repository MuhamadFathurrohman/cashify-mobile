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

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    category: Category;
    account: Account;
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
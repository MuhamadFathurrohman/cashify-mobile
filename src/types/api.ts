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


export interface Account {
    id: string;
    name: string;
    type: AccountType;
    is_default: boolean;
}


export interface AccountListResponse {
    data: Account[];
}

// Dashboard — GET /dashboard?month=YYYY-MM
// ✅ Bentuk item sudah dicocokkan dengan respons nyata (2026-11-10): id, type, amount, date,
// description, source ("whatsapp" muncul), category {id, name, icon, color}, account {id, name},
// created_at, updated_at; tanpa deleted_at. Item tidak terpengaruh `month` (item Oktober
// muncul saat bulan berjalan November).
// ❓ Jumlah maksimal item belum terbukti: respons nyata berisi 5 item, OpenAPI menyebut 10,
// SYSTEM_DOCUMENTATION menyebut 5. Respons itu tidak membedakan keduanya bila akun tersebut
// hanya punya 5 transaksi.
export type DashboardTransaction = Transaction;

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

export interface Category {
    id: string;
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
    is_system: boolean;
}

// Bentuk ringkas yang dipakai backend pada item transaksi
// (📄 OpenAPI backend, "API Response.md" 2026-11-10; belum diuji dengan respons nyata ❓)
export type CategorySummary = Pick<Category, "id" | "name" | "icon" | "color">;
export type AccountSummary = Pick<Account, "id" | "name">;

// Spec tidak memuat `deleted_at` pada Transaction (transaksi terhapus tidak ditampilkan),
// jadi field itu dihapus dari tipe ini. Bila tsc melaporkan pemakaian lama, hapus pemakaiannya.
export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    category: CategorySummary;
    account: AccountSummary;
    date: string;
    description: string | null;
    source: TransactionSource;
    created_at: string;
    // Ejaan persis dari backend (`occured_at`, commit 7d3ff29); opsional untuk
    // kompatibilitas dengan backend lama yang belum mengirim field ini.
    occured_at?: string;
    // Wajib dikirim kembali pada PATCH sebagai penjaga konflik (optimistic locking)
    updated_at: string;
}

export interface TransactionDetail extends Transaction {
    source_message: {
        body: string | null;
        received_at: string;
    } | null;
}

// POST /transactions (📄 OpenAPI). Respons 201 berisi Transaction.
// category_id harus bertipe sama dengan `type`; date YYYY-MM-DD, tidak boleh di masa depan
// dan paling jauh 1 tahun ke belakang; amount integer 1..1.000.000.000; description maks. 255.
export interface CreateTransactionRequest {
    type: TransactionType;
    amount: number;
    category_id: string;
    account_id: string;
    date: string;
    description?: string | null;
}

// PATCH /transactions/{id} (📄 OpenAPI + source cashify-be transactions.schema.ts).
// `updated_at` wajib (optimistic locking, dibandingkan sampai milidetik) dan minimal satu
// field lain harus dikirim. Field yang tidak dikirim tidak diubah server; `description: null`
// mengosongkan deskripsi. type dan category_id divalidasi berpasangan oleh backend.
export interface UpdateTransactionRequest {
    updated_at: string;
    type?: TransactionType;
    amount?: number;
    category_id?: string;
    account_id?: string;
    date?: string;
    description?: string | null;
}

// GET /categories?type= dan GET /accounts membungkus daftar dalam `data` (tanpa paginasi)
export interface CategoryListResponse {
    data: Category[];
}

// GET /transactions — parameter filter (cursor dan limit dikelola hook, bukan pemanggil)
export interface TransactionListParams {
    type?: TransactionType;
    from?: string;          // YYYY-MM-DD, inklusif
    to?: string;            // YYYY-MM-DD, inklusif
    category_id?: string;
    account_id?: string;
    source?: TransactionSource;
    q?: string;
}

// GET /transactions — menggunakan PaginatedResponse<Transaction> yang sudah ada
export type TransactionListResponse = PaginatedResponse<Transaction>;

// ─── Budgets (source: cashify-be, budgets.schema.ts) ─────────────────────────
// Periode dinormalkan server: monthly selalu tanggal 1, weekly selalu Senin.
export type BudgetPeriodType = "monthly" | "weekly";
// Ambang total selalu 80%: ok < ambang, warning ambang..100, over > 100.
export type BudgetStatus = "ok" | "warning" | "over";

export interface BudgetCategory {
    category_id: string;
    name: string;
    slug: string;
    amount: number;
    /** Persen 1–100; peringatan WhatsApp dikirim saat pemakaian melewati nilai ini. */
    alert_threshold: number;
}

// Hanya ada pada detail: daftar budget (GET /budgets) tidak memuat progres.
export interface BudgetCategoryProgress extends BudgetCategory {
    spent: number;
    /** amount - spent; bisa negatif saat anggaran terlampaui. */
    remaining: number;
    /** Satu desimal; bisa melewati 100. */
    percent: number;
    status: BudgetStatus;
}

export interface Budget {
    id: string;
    name: string | null;
    period_type: BudgetPeriodType;
    /** YYYY-MM-DD */
    period_start: string;
    /** YYYY-MM-DD, inklusif */
    period_end: string;
    total_amount: number;
    auto_renew: boolean;
    rollover_enabled: boolean;
    created_at: string;
    categories: BudgetCategory[];
}

export interface BudgetDetail
    extends Omit<Budget, "categories"> {
    categories: BudgetCategoryProgress[];
    /** Seluruh pengeluaran periode, termasuk kategori yang tidak dialokasikan. */
    spent_total: number;
    /** total_amount - spent_total; bisa negatif. */
    remaining_total: number;
    percent_total: number;
    status_total: BudgetStatus;
}

export interface BudgetListResponse {
    data: Budget[];
}

export interface BudgetCategoryInput {
    category_id: string;
    amount: number;
    alert_threshold: number;
}

// POST /budgets — `categories` minimal satu, tanpa duplikat, Σ amount ≤ total_amount.
// Periode yang beririsan dengan anggaran lain ditolak 409 { field: "period_start", issue: "overlap" }.
export interface CreateBudgetRequest {
    name?: string;
    period_type: BudgetPeriodType;
    period_start: string;
    total_amount: number;
    auto_renew: boolean;
    rollover_enabled: boolean;
    categories: BudgetCategoryInput[];
}

// PATCH /budgets/{id} — `categories` bersifat replace (bukan tambah sebagian).
export interface UpdateBudgetRequest {
    name?: string;
    total_amount?: number;
    auto_renew?: boolean;
    rollover_enabled?: boolean;
    categories?: BudgetCategoryInput[];
}
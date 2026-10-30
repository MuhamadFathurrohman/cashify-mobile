import {
    parseRecoveryUrl,
    type RecoveryLinkResult,
} from "@/features/auth/recoveryLink";
import * as Linking from "expo-linking";

// Hanya tautan pemulihan yang disimpan; URL lain diabaikan
export type RecoveryLink = Exclude<RecoveryLinkResult, { kind: "invalid" }>;

// Snapshot diganti (bukan dimutasi) agar aman untuk useSyncExternalStore
let latest: RecoveryLink | null = null;
const listeners = new Set<() => void>();
let started = false;

function notify() {
    listeners.forEach((listener) => listener());
}

function capture(url: string) {
    const result = parseRecoveryUrl(url);
    if (result.kind === "invalid") return;
    latest = result;
    notify();
}

// Dipanggil sekali di tingkat modul root layout: event deep link bisa tiba
// sebelum layar mana pun terpasang
export function startLinkCapture() {
    if (started) return;
    started = true;
    Promise.resolve(Linking.getLinkingURL()).then((url) => {
        if (url) capture(url);
    });
    Linking.addEventListener("url", ({ url }) => capture(url));
}

export function getRecoveryLink(): RecoveryLink | null {
    return latest;
}

export function subscribeRecoveryLink(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

// Token dibuang setelah dipakai atau saat pengguna meninggalkan alur reset
export function clearRecoveryLink() {
    if (!latest) return;
    latest = null;
    notify();
}
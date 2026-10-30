export type RecoveryLinkResult =
    | { kind: "token"; accessToken: string }
    | { kind: "error"; code: string }
    | { kind: "invalid" };

function decode(value: string): string {
    try {
        return decodeURIComponent(value.replace(/\+/g, " "));
    } catch {
        return value;
    }
}

// Token pemulihan Supabase ada di fragment (#...), bukan query; parsing manual
// karena URLSearchParams di React Native hanya implementasi parsial
export function parseRecoveryUrl(
    url: string | null | undefined,
): RecoveryLinkResult {
    const hashIndex = url ? url.indexOf("#") : -1;
    if (!url || hashIndex === -1) return { kind: "invalid" };

    const params = new Map<string, string>();
    for (const pair of url.slice(hashIndex + 1).split("&")) {
        const eq = pair.indexOf("=");
        if (eq === -1) continue;
        params.set(decode(pair.slice(0, eq)), decode(pair.slice(eq + 1)));
    }

    const errorCode = params.get("error_code") ?? params.get("error");
    if (errorCode) return { kind: "error", code: errorCode };

    const accessToken = params.get("access_token");
    if (params.get("type") === "recovery" && accessToken) {
        return { kind: "token", accessToken };
    }
    return { kind: "invalid" };
}
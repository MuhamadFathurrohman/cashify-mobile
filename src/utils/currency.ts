export function parseRawAmount(formatted: string): number {
    return parseInt(formatted.replace(/\./g, ""), 10) || 0;
}

export function formatInputAmount(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    return parseInt(digits, 10).toLocaleString("id-ID");
}
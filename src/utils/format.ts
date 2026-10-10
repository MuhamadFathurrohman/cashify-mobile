export function formatRupiah(amount: number): string {
    return `Rp${amount.toLocaleString("id-ID")}`;
}

export function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
    });
}
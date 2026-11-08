// Format nominal Beranda sesuai desain: "Rp 24.850.000", "+Rp 12.500.000", "-Rp 4.720.000".
// Berbeda dari formatRupiah (utils/format.ts) yang tanpa spasi dan tanpa tanda,
// sehingga formatRupiah tidak diubah.
function digits(amount: number): string {
    return Math.abs(Math.round(amount)).toLocaleString("id-ID");
}

// Saldo total; negatif tampil "-Rp 1.500.000"
export function formatBalance(amount: number): string {
    return `${amount < 0 ? "-" : ""}Rp ${digits(amount)}`;
}

// Nol tampil netral ("Rp 0") agar state kosong tidak terbaca "+Rp 0" atau "-Rp 0"
export function formatIncome(amount: number): string {
    return amount === 0 ? "Rp 0" : `+Rp ${digits(amount)}`;
}

export function formatExpense(amount: number): string {
    return amount === 0 ? "Rp 0" : `-Rp ${digits(amount)}`;
}

export const HIDDEN_AMOUNT = "Rp ••••••••";
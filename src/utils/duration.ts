// Durasi (bukan jam): 65 -> "01:05". Dipakai hitung mundur OTP dan resend email.
export function formatCountdown(totalSeconds: number): string {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

import type { TransactionType } from "@/types/api";
import type Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Ionicons>["name"];

// ❓ Backend mengirim nama ikon berupa teks. Terkonfirmasi: `utensils` dan `car` (dev summary,
// bagian 3) serta `wallet` dan `shopping-bag` (respons GET /dashboard 2026-11-10). Sisanya
// tebakan gaya Lucide/Feather dan harus dicocokkan dengan nama sebenarnya dari GET /categories.
const ICONS: Record<string, IconName> = {
    utensils: "restaurant-outline",
    car: "car-outline",
    "shopping-cart": "cart-outline",
    "shopping-bag": "bag-handle-outline",
    zap: "flash-outline",
    receipt: "receipt-outline",
    heart: "heart-outline",
    "heart-pulse": "medkit-outline",
    film: "film-outline",
    "gamepad-2": "game-controller-outline",
    banknote: "cash-outline",
    wallet: "wallet-outline",
    gift: "gift-outline",
    briefcase: "briefcase-outline",
    laptop: "laptop-outline",
    "trending-up": "trending-up-outline",
    "more-horizontal": "ellipsis-horizontal-circle-outline",
};

// Identitas visual jenis transaksi: warna teks/nominal, bubble ikon kategori, tint badge,
// dan ikon cadangan. Satu sumber agar Beranda, History, dan Detail tidak berbeda palet.
export const TYPE_THEME = {
    income: {
        text: "#006c50",
        bubble: "rgba(127,249,204,0.2)",
        badge: "rgba(0,108,80,0.1)",
        fallbackIcon: "arrow-down-circle-outline",
    },
    expense: {
        text: "#ed7658",
        bubble: "rgba(237,118,88,0.1)",
        badge: "rgba(237,118,88,0.1)",
        fallbackIcon: "arrow-up-circle-outline",
    },
} as const satisfies Record<TransactionType, unknown>;

// NativeWind hanya membaca kelas literal saat build, jadi kelas latar tab aktif
// tetap ditulis utuh di sini, bukan dirakit dari TYPE_THEME.
export const TYPE_ACTIVE_CLASS = {
    income: "bg-[#006c50]",
    expense: "bg-[#ed7658]",
} as const satisfies Record<TransactionType, string>;

// Nama tidak dikenal memakai ikon cadangan menurut jenis transaksi
export function categoryIconName(icon: string, type: TransactionType): IconName {
    return ICONS[icon] ?? TYPE_THEME[type].fallbackIcon;
}

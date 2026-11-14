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

// Nama tidak dikenal memakai ikon cadangan menurut jenis transaksi
export function categoryIconName(icon: string, type: TransactionType): IconName {
    return (
        ICONS[icon] ??
        (type === "income" ? "arrow-down-circle-outline" : "arrow-up-circle-outline")
    );
}
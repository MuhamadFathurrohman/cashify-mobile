import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryTilePlaceholders } from "./CategoryGrid";

// Salinan CARD dari TransactionForm agar cangkang kartu sama persis; ubah bersamaan
// bila desain kartu berubah.
const CARD =
  "rounded-3xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]";

// Kerangka form Tambah Transaksi selama dompet dimuat (menggantikan spinner).
// Tinggi tiap bagian dibuat sama dengan form asli supaya tidak melompat saat data tiba:
// toggle 50, kartu nominal 84 + padding, kategori 22 + 12 + 2 baris ubin, kartu tanggal
// dan dompet, kartu catatan, serta panel tombol simpan (tombol 52).
// Teks statis (label) sengaja tidak ditampilkan: kerangka hanya berisi balok.
export function TransactionFormSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 overflow-hidden bg-[#f8f9ff]">
      <SkeletonPulse fill accessibilityLabel="Memuat formulir transaksi">
        <View className="gap-4 px-5 pt-2">
          {/* Toggle Pengeluaran / Pemasukan */}
          <SkeletonBlock className="h-[50px] rounded-2xl" />

          {/* Nominal */}
          <View className={CARD}>
            <View className="items-center gap-1">
              <SkeletonBlock className="my-0.5 h-3 w-28 rounded-md" />
              <SkeletonBlock className="h-11 w-48 rounded-xl" />
              <SkeletonBlock className="my-0.5 h-3 w-56 rounded-md" />
            </View>
          </View>

          {/* Kategori */}
          <View>
            <View className="mb-3 flex-row items-center justify-between">
              <SkeletonBlock className="my-[3px] h-4 w-32 rounded-md" />
              <SkeletonBlock className="my-0.5 h-3 w-24 rounded-md" />
            </View>
            <View className="-mx-1 -my-1">
              <CategoryTilePlaceholders />
            </View>
          </View>

          {/* Tanggal dan dompet */}
          <View className={`${CARD} gap-3`}>
            <View className="flex-row items-center gap-3 border-b border-[rgba(196,198,206,0.2)] pb-[13px]">
              <SkeletonBlock className="h-10 w-10 rounded-2xl" />
              <View className="flex-1">
                <SkeletonBlock className="my-0.5 h-3 w-16 rounded-md" />
                <SkeletonBlock className="my-1 h-3 w-40 rounded-md" />
              </View>
              <SkeletonBlock className="h-5 w-5 rounded-md" />
            </View>
            <View className="flex-row items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-2xl" />
              <View className="flex-1">
                <SkeletonBlock className="my-0.5 h-3 w-32 rounded-md" />
                <SkeletonBlock className="my-1 h-3 w-20 rounded-md" />
              </View>
            </View>
          </View>

          {/* Catatan */}
          <View className={CARD}>
            <View className="mb-2 flex-row items-center gap-2">
              <SkeletonBlock className="h-[18px] w-[18px] rounded-md" />
              <SkeletonBlock className="my-0.5 h-3 w-16 rounded-md" />
            </View>
            <SkeletonBlock className="h-[68px] rounded-xl" />
          </View>
        </View>

        {/* Panel tombol simpan. paddingBottom mengikuti inset layar (nilai runtime),
            jadi lewat style, sama seperti di TransactionForm. */}
        <View
          className="absolute inset-x-0 bottom-0 border-t border-[rgba(196,198,206,0.3)] bg-[rgba(255,255,255,0.95)] px-5 pt-[21px]"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <SkeletonBlock className="h-[52px] rounded-2xl" />
        </View>
      </SkeletonPulse>
    </View>
  );
}

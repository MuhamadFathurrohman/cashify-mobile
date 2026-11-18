import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import { View } from "react-native";

// Satu grup tiruan: header tanggal + kartu berisi beberapa item
function SkeletonGroup({ itemCount }: { itemCount: number }) {
  return (
    <View className="gap-[10px]">
      {/* Header tanggal */}
      <View className="flex-row items-center justify-between px-1">
        <SkeletonBlock className="h-3 w-36 rounded-full" />
        <SkeletonBlock className="h-3 w-16 rounded-full" />
      </View>

      {/* Kartu grup */}
      <View className="rounded-3xl bg-white px-[13px]">
        {Array.from({ length: itemCount }).map((_, index) => (
          <View
            key={index}
            className={`flex-row items-center justify-between py-[10px] ${
              index > 0 ? "border-t border-[rgba(222,233,252,0.6)]" : ""
            }`}
          >
            {/* Bubble ikon */}
            <SkeletonBlock className="h-11 w-11 rounded-2xl" />

            {/* Teks tengah */}
            <View className="ml-3 flex-1 gap-[6px]">
              <SkeletonBlock className="h-[14px] w-3/4 rounded-full" />
              <SkeletonBlock className="h-3 w-1/2 rounded-full" />
            </View>

            {/* Nominal */}
            <SkeletonBlock className="ml-3 h-[14px] w-20 rounded-full" />
          </View>
        ))}
      </View>
    </View>
  );
}

// Skeleton untuk daftar transaksi saat initial load atau filter berubah.
// Menampilkan 3 grup dengan jumlah item bervariasi untuk kesan natural.
// Dibungkus satu SkeletonPulse di level paling atas — jangan nested.
export function TransactionListSkeleton() {
  return (
    <SkeletonPulse accessibilityLabel="Memuat daftar transaksi">
      <View className="gap-6">
        <SkeletonGroup itemCount={3} />
        <SkeletonGroup itemCount={2} />
        <SkeletonGroup itemCount={2} />
      </View>
    </SkeletonPulse>
  );
}

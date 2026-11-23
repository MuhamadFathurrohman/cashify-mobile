import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import { View } from "react-native";

// Salinan CARD dari TransactionDetailCard agar cangkang kartu sama persis; ubah
// bersamaan bila desain kartu detail berubah.
const CARD =
  "rounded-3xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]";

// Kerangka layar detail selama GET /transactions/{id} dimuat. Tinggi tiap blok
// mengikuti konten asli (nominal, 4 baris rincian, kartu catatan) supaya tidak melompat.
export function TransactionDetailSkeleton() {
  return (
    <SkeletonPulse accessibilityLabel="Memuat detail transaksi">
      <View className="gap-4 px-5 pt-2">
        {/* Nominal dan jenis */}
        <View className={`${CARD} items-center gap-1`}>
          <SkeletonBlock className="h-[18px] w-24 rounded-full" />
          <SkeletonBlock className="mt-1 h-9 w-44 rounded-xl" />
          <SkeletonBlock className="h-3 w-24 rounded-md" />
        </View>

        {/* Rincian */}
        <View className={`${CARD} gap-3`}>
          {[0, 1, 2, 3].map((row) => (
            <View
              key={row}
              className={`flex-row items-center gap-3 ${
                row === 3
                  ? ""
                  : "border-b border-[rgba(196,198,206,0.2)] pb-[13px]"
              }`}
            >
              <SkeletonBlock className="h-10 w-10 rounded-2xl" />
              <View className="flex-1">
                <SkeletonBlock className="my-0.5 h-3 w-20 rounded-md" />
                <SkeletonBlock className="my-1 h-3 w-32 rounded-md" />
              </View>
            </View>
          ))}
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
    </SkeletonPulse>
  );
}

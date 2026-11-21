import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import { View } from "react-native";

// Kerangka kartu meniru form "Hubungkan WhatsApp" (kasus unlinked, paling umum).
// Satu SkeletonPulse untuk seluruh kartu: jangan bertumpuk dengan pulse lain.
export function WhatsAppCardSkeleton() {
  return (
    <View className="w-full rounded-[24px] bg-white px-[25px] py-[22px] mt-1">
      <SkeletonPulse accessibilityLabel="Memeriksa status WhatsApp">
        <View className="gap-4">
          {/* Judul + deskripsi */}
          <View className="gap-[5px]">
            <View className="flex-row items-center gap-2">
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <SkeletonBlock className="h-[25px] w-[190px] rounded-lg" />
            </View>
            <SkeletonBlock className="h-[21px] w-full rounded-md" />
            <SkeletonBlock className="h-[21px] w-[80%] rounded-md" />
          </View>

          {/* Divider 1 */}
          <SkeletonBlock className="h-px w-full" />

          {/* Tiga baris fitur */}
          {[0, 1, 2].map((i) => (
            <View key={i} className="flex-row items-center gap-3 py-[9px]">
              <SkeletonBlock className="h-4 w-4 rounded-full" />
              <SkeletonBlock className="h-[18px] flex-1 rounded-md" />
            </View>
          ))}

          {/* Divider 2 */}
          <SkeletonBlock className="h-px w-full" />

          {/* Label + input nomor */}
          <View className="gap-2">
            <SkeletonBlock className="h-[18px] w-[120px] rounded-md" />
            <View className="flex-row items-center gap-[10px]">
              <SkeletonBlock className="h-[50px] w-[62px] rounded-[12px]" />
              <SkeletonBlock className="h-[50px] flex-1 rounded-[16px]" />
            </View>
            <SkeletonBlock className="h-[16px] w-[150px] rounded-md" />
          </View>
        </View>
      </SkeletonPulse>
    </View>
  );
}

// Placeholder tombol di footer. Saudara (bukan anak) dari pulse kartu,
// sehingga tidak terjadi perkalian opacity.
export function WhatsAppButtonSkeleton() {
  return (
    <SkeletonPulse accessibilityLabel="Menyiapkan tombol">
      <SkeletonBlock className="h-[54px] w-full rounded-[16px]" />
    </SkeletonPulse>
  );
}

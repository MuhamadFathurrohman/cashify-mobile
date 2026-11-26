import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";

interface BudgetEmptyStateProps {
  // Bulan berjalan, mis. "November 2026"
  monthLabel: string;
  onCreate: () => void;
}

// Keadaan "belum ada anggaran". Dirancang dari token proyek (hijau primary, latar
// #f8f9ff) karena kondisi ini belum punya desain Figma (keputusan C-1).
export function BudgetEmptyState({ monthLabel, onCreate }: BudgetEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-2 py-12">
      <View
        className="h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(0,108,80,0.1)" }}
      >
        <Ionicons name="pie-chart-outline" size={32} color="#006c50" />
      </View>

      <Text className="font-sans mt-5 text-base font-semibold leading-[22px] text-[#121c2a]">
        Belum ada anggaran bulan ini
      </Text>
      <Text className="font-sans mt-2 max-w-[280px] text-center text-xs leading-[18px] text-[#43474d]">
        {`Tentukan batas pengeluaran ${monthLabel} dan alokasikan ke kategori agar belanja lebih terkendali.`}
      </Text>

      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        accessibilityLabel="Buat anggaran"
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
        className="mt-6 w-full overflow-hidden rounded-2xl"
        style={{ backgroundColor: "#006c50" }}
      >
        <View className="h-[52px] flex-row items-center justify-center">
          <Text className="font-sans text-base font-semibold leading-[22px] text-white">
            Buat Anggaran
          </Text>
        </View>
      </Pressable>

      <Text className="font-sans mt-3 text-center text-[11px] leading-[17px] text-[#74777e]">
        Anggaran hanya berlaku untuk kategori pengeluaran.
      </Text>
    </View>
  );
}

// Kerangka satu denyut untuk seluruh segmen Anggaran. Cangkang dan tinggi tiap
// bagian mengikuti BudgetHeroCard dan BudgetCategoryCard agar tidak ada lompatan
// saat data asli muncul. Tombol tambah disembunyikan untuk periode lampau.
export function BudgetSkeleton({
  showAddButton = true,
}: {
  showAddButton?: boolean;
}) {
  return (
    <SkeletonPulse accessibilityLabel="Memuat anggaran">
      <View className="gap-4">
        {/* Hero: cangkang navy yang sama dengan BudgetHeroCard */}
        <View className="overflow-hidden rounded-3xl bg-[#19324d] p-5">
          <View className="flex-row items-center justify-between">
            <SkeletonBlock className="h-4 w-[132px] rounded-md" />
            <SkeletonBlock className="h-[22px] w-[84px] rounded-full" />
          </View>

          <View className="mt-2 flex-row items-center">
            <SkeletonBlock className="h-[30px] w-[28px] rounded-md" />
            <SkeletonBlock className="ml-[10px] h-[30px] w-[164px] rounded-md" />
            <SkeletonBlock className="ml-auto h-9 w-9 rounded-full" />
          </View>

          <View className="mt-4">
            <View className="h-[10px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.15)]">
              <SkeletonBlock className="h-full w-[64%] rounded-full" />
            </View>
            <View className="mt-[6px] flex-row items-center justify-between">
              <SkeletonBlock className="h-[14px] w-[110px] rounded-md" />
              <SkeletonBlock className="h-[14px] w-[86px] rounded-md" />
            </View>
          </View>

          <View className="mt-4 flex-row gap-[10px]">
            {[0, 1].map((tile) => (
              <View
                key={tile}
                className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.1)] p-[13px]"
              >
                <SkeletonBlock className="h-[14px] w-[54px] rounded-md" />
                <SkeletonBlock className="mt-[6px] h-[22px] w-[92px] rounded-md" />
                <SkeletonBlock className="mt-[2px] h-[14px] w-[66px] rounded-md" />
              </View>
            ))}
          </View>
        </View>

        {showAddButton ? (
          <View className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgba(0,108,80,0.35)] bg-[rgba(0,108,80,0.04)]">
            <SkeletonBlock className="h-[18px] w-[18px] rounded-full" />
            <SkeletonBlock className="h-4 w-[190px] rounded-md" />
          </View>
        ) : (
          <View className="h-4 items-center justify-center">
            <SkeletonBlock className="h-3 w-[70%] rounded-md" />
          </View>
        )}

        {/* Header bagian: judul di kiri, jumlah kategori di kanan */}
        <View className="flex-row items-center justify-between">
          <SkeletonBlock className="h-[25px] w-[180px] rounded-md" />
          <SkeletonBlock className="h-4 w-[110px] rounded-md" />
        </View>

        {/* Kartu kategori: cangkang dan isi mengikuti BudgetCategoryCard */}
        <View className="gap-3">
          {[0, 1, 2].map((card) => (
            <View
              key={card}
              className="rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                  <View className="ml-3 flex-1 gap-[6px]">
                    <SkeletonBlock className="h-4 w-[140px] rounded-md" />
                    <SkeletonBlock className="h-3 w-[100px] rounded-md" />
                  </View>
                </View>
                <SkeletonBlock className="h-[26px] w-[46px] rounded-full" />
              </View>

              <SkeletonBlock className="mt-3 h-2 w-full rounded-full" />

              <View className="mt-[10px] flex-row items-center justify-between">
                <SkeletonBlock className="h-3 w-[60px] rounded-md" />
                <SkeletonBlock className="h-[22px] w-[92px] rounded-md" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </SkeletonPulse>
  );
}

import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";

interface ReportEmptyStateProps {
  // "Oktober 2024", "6 bulan terakhir", atau "12 bulan terakhir".
  label: string;
}

export function ReportEmptyState({ label }: ReportEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-2 py-12">
      <View
        className="h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(0,108,80,0.1)" }}
      >
        <Ionicons name="bar-chart-outline" size={32} color="#006c50" />
      </View>

      <Text className="font-sans mt-5 text-base font-semibold leading-[22px] text-[#121c2a]">
        Belum ada transaksi pada bulan {label}
      </Text>
      <Text className="font-sans mt-2 max-w-[280px] text-center text-xs leading-[18px] text-[#43474d]">
        Pemasukan dan pengeluaran yang kamu catat akan muncul sebagai laporan di
        sini.
      </Text>
    </View>
  );
}

// Satu denyut untuk seluruh segmen Laporan. Tinggi tiap bagian mengikuti kartu
// aslinya agar tidak ada lompatan saat data muncul.
export function ReportSkeleton() {
  return (
    <SkeletonPulse accessibilityLabel="Memuat laporan keuangan">
      <View className="gap-4">
        <View className="rounded-3xl bg-[#19324d] p-5">
          <View className="flex-row items-start justify-between">
            <View className="gap-2">
              <SkeletonBlock className="h-3 w-[92px] rounded-md" />
              <SkeletonBlock className="h-4 w-[110px] rounded-md" />
            </View>
            <SkeletonBlock className="h-[22px] w-[72px] rounded-full" />
          </View>
          <SkeletonBlock className="mt-3 h-[34px] w-[190px] rounded-md" />
          <View className="mt-4 flex-row gap-[10px]">
            {[0, 1].map((tile) => (
              <View
                key={tile}
                className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] p-[13px]"
              >
                <SkeletonBlock className="h-3 w-[74px] rounded-md" />
                <SkeletonBlock className="mt-[7px] h-4 w-[100px] rounded-md" />
              </View>
            ))}
          </View>
        </View>

        <View className="rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-[21px]">
          <View className="flex-row items-start justify-between">
            <View className="gap-2">
              <SkeletonBlock className="h-4 w-[120px] rounded-md" />
              <SkeletonBlock className="h-3 w-[88px] rounded-md" />
            </View>
            <View className="flex-row gap-3">
              <SkeletonBlock className="h-3 w-[48px] rounded-md" />
              <SkeletonBlock className="h-3 w-[48px] rounded-md" />
            </View>
          </View>
          <SkeletonBlock className="mt-4 h-[188px] w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-[62px] w-full rounded-xl" />
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <SkeletonBlock className="h-[25px] w-[190px] rounded-md" />
            <SkeletonBlock className="h-4 w-[72px] rounded-md" />
          </View>
          <View className="gap-[14px] rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]">
            {[0, 1, 2].map((row) => (
              <View key={row} className="gap-2">
                <View className="flex-row items-center">
                  <SkeletonBlock className="h-10 w-10 rounded-2xl" />
                  <View className="ml-3 flex-1 gap-[6px]">
                    <SkeletonBlock className="h-4 w-[132px] rounded-md" />
                    <SkeletonBlock className="h-3 w-[96px] rounded-md" />
                  </View>
                  <SkeletonBlock className="h-4 w-[84px] rounded-md" />
                </View>
                <SkeletonBlock className="h-[6px] w-full rounded-full" />
              </View>
            ))}
          </View>
        </View>

        <View className="rounded-3xl bg-[#19324d] p-5">
          <View className="flex-row items-center gap-[10px]">
            <SkeletonBlock className="h-8 w-8 rounded-full" />
            <SkeletonBlock className="h-4 w-[130px] rounded-md" />
          </View>
          <View className="mt-4 gap-3">
            {[0, 1, 2].map((line) => (
              <View key={line} className="flex-row items-start gap-3">
                <SkeletonBlock className="mt-[5px] h-[6px] w-[6px] rounded-full" />
                <SkeletonBlock className="h-3 flex-1 rounded-md" />
              </View>
            ))}
          </View>
        </View>
      </View>
    </SkeletonPulse>
  );
}

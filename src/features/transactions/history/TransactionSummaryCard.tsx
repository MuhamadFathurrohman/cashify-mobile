import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import { TYPE_THEME } from "@/utils/categoryIconTheme";
import { formatExpense, formatIncome } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";
import type { TransactionSummary } from "./useTransactionSummary";

interface TransactionSummaryCardProps {
  summary: TransactionSummary | null;
  isLoading: boolean;
  isError: boolean;
}

// Total Masuk / Total Keluar untuk seluruh hasil filter (bukan hanya halaman yang dimuat).
// Kartu sengaja tidak punya tombol Coba Lagi: pemulihan ringkasan mengikuti
// satu aksi pemulihan layar (banner, pull-to-refresh, atau ErrorState daftar).
export function TransactionSummaryCard({
  summary,
  isLoading,
  isError,
}: TransactionSummaryCardProps) {
  let content;
  if (isError) {
    // Sengaja tidak menampilkan angka parsial atau nol
    content = (
      <View className="py-1">
        <Text className="font-sans text-xs leading-4 text-[#43474d]">
          Total Masuk dan Keluar belum bisa dihitung. Periksa koneksi, lalu
          tarik daftar ke bawah.
        </Text>
      </View>
    );
  } else if (isLoading || !summary) {
    content = (
      <SkeletonPulse accessibilityLabel="Memuat ringkasan">
        <View className="flex-row gap-4">
          <View className="flex-1 gap-2">
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-4 w-28 rounded-full" />
          </View>
          <View className="flex-1 gap-2">
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-4 w-28 rounded-full" />
          </View>
        </View>
      </SkeletonPulse>
    );
  } else {
    content = (
      <View className="flex-row">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Ionicons
              name="arrow-down"
              size={12}
              color={TYPE_THEME.income.text}
            />
            <Text className="font-sans ml-1 text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#43474d]">
              Total Masuk
            </Text>
          </View>
          <Text
            className="font-sans mt-1 text-base font-semibold leading-[22px] tracking-[-0.16px]"
            style={{ color: TYPE_THEME.income.text }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatIncome(summary.income)}
          </Text>
        </View>
        <View className="mx-4 w-px bg-[rgba(222,233,252,0.9)]" />
        <View className="flex-1">
          <View className="flex-row items-center">
            <Ionicons
              name="arrow-up"
              size={12}
              color={TYPE_THEME.expense.text}
            />
            <Text className="font-sans ml-1 text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#43474d]">
              Total Keluar
            </Text>
          </View>
          <Text
            className="font-sans mt-1 text-base font-semibold leading-[22px] tracking-[-0.16px]"
            style={{ color: TYPE_THEME.expense.text }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatExpense(summary.expense)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="rounded-3xl border border-[rgba(196,198,206,0.3)] bg-white p-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {content}
    </View>
  );
}

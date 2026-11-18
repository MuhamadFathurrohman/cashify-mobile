import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import { formatExpense, formatIncome } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import { EXPENSE_COLOR, INCOME_COLOR } from "./TransactionListItem";
import type { TransactionSummary } from "./useTransactionSummary";

interface TransactionSummaryCardProps {
  summary: TransactionSummary | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

// Total Masuk / Total Keluar untuk seluruh hasil filter (bukan hanya halaman yang dimuat).
export function TransactionSummaryCard({
  summary,
  isLoading,
  isError,
  onRetry,
}: TransactionSummaryCardProps) {
  let content;
  if (isError) {
    // Sengaja tidak menampilkan angka parsial atau nol
    content = (
      <View className="flex-row items-center justify-between py-1">
        <Text className="font-sans flex-1 text-xs leading-4 text-[#43474d]">
          Ringkasan belum bisa dihitung.
        </Text>
        <Pressable
          onPress={onRetry}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Coba hitung ulang ringkasan"
        >
          <Text className="font-sans text-xs font-semibold text-[#006c50]">
            Coba Lagi
          </Text>
        </Pressable>
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
            <Ionicons name="arrow-down" size={12} color={INCOME_COLOR} />
            <Text className="font-sans ml-1 text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#43474d]">
              Total Masuk
            </Text>
          </View>
          <Text
            className="font-sans mt-1 text-base font-semibold leading-[22px] tracking-[-0.16px]"
            style={{ color: INCOME_COLOR }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatIncome(summary.income)}
          </Text>
        </View>
        <View className="mx-4 w-px bg-[rgba(222,233,252,0.9)]" />
        <View className="flex-1">
          <View className="flex-row items-center">
            <Ionicons name="arrow-up" size={12} color={EXPENSE_COLOR} />
            <Text className="font-sans ml-1 text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#43474d]">
              Total Keluar
            </Text>
          </View>
          <Text
            className="font-sans mt-1 text-base font-semibold leading-[22px] tracking-[-0.16px]"
            style={{ color: EXPENSE_COLOR }}
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

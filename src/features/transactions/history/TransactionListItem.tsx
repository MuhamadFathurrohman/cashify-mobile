import type { Transaction } from "@/types/api";
import { categoryIconName } from "@/utils/categoryIcon";
import { formatJakartaTime } from "@/utils/jakartaDates";
import { formatExpense, formatIncome } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

export const INCOME_COLOR = "#27ae86";
export const EXPENSE_COLOR = "#f0785a";

const SOURCE_LABELS: Record<Transaction["source"], string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  recurring: "Recurring",
  import: "Import",
};

interface TransactionListItemProps {
  item: Transaction;
  // Opsional: dipersiapkan untuk navigasi detail di iterasi berikutnya.
  // Belum ada navigasi yang terhubung saat ini.
  onPress?: () => void;
}

export const TransactionListItem = memo(function TransactionListItem({
  item,
  onPress,
}: TransactionListItemProps) {
  const isIncome = item.type === "income";
  const color = isIncome ? INCOME_COLOR : EXPENSE_COLOR;
  const bubbleBg = isIncome ? "rgba(39,174,134,0.12)" : "rgba(240,120,90,0.12)";
  const description = item.description?.trim();
  const sourceLabel = SOURCE_LABELS[item.source];
  const time = item.occured_at ? formatJakartaTime(item.occured_at) : "";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${description || item.category.name}, ${isIncome ? "pemasukan" : "pengeluaran"} ${isIncome ? formatIncome(item.amount) : formatExpense(item.amount)}${time ? `, pukul ${time}` : ""}`}
      android_ripple={onPress ? { color: "rgba(0,0,0,0.04)" } : undefined}
      className="flex-row items-center justify-between px-1 py-[10px]"
    >
      {/* Kiri: bubble ikon + teks */}
      <View className="flex-1 flex-row items-center">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: bubbleBg }}
        >
          <Ionicons
            name={categoryIconName(item.category.icon, item.type)}
            size={20}
            color={color}
          />
        </View>
        <View className="ml-3 flex-1">
          <Text
            className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]"
            numberOfLines={1}
          >
            {description || item.category.name}
          </Text>
          <Text
            className="font-sans text-xs leading-4 text-[#43474d]"
            numberOfLines={1}
          >
            {`${item.category.name} • ${sourceLabel}${time ? ` • ${time}` : ""}`}
          </Text>
        </View>
      </View>

      {/* Kanan: nominal */}
      <View className="items-end pl-3">
        <Text
          className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px]"
          style={{ color }}
        >
          {isIncome ? formatIncome(item.amount) : formatExpense(item.amount)}
        </Text>
      </View>
    </Pressable>
  );
});

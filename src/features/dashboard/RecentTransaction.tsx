import type { DashboardTransaction } from "@/types/api";
import { categoryIconName, TYPE_THEME } from "@/utils/categoryIconTheme";
import {
  formatJakartaTime,
  formatRelativeDate,
} from "@/utils/jakartaDates";
import { formatExpense, formatIncome } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";

interface RecentTransactionsProps {
  items: DashboardTransaction[];
  onSeeAll: () => void;
  onAdd: () => void;
  onPressItem: (id: string) => void;
}

// 📄 Belum diuji dengan data nyata: bentuk item `recent_transactions` sudah memuat
// `occured_at` sejak commit backend 7d3ff29. Baris bisa diketuk untuk membuka detail.
function TransactionRow({
  item,
  onPress,
}: {
  item: DashboardTransaction;
  onPress: () => void;
}) {
  const isIncome = item.type === "income";
  const theme = TYPE_THEME[item.type];
  const description = item.description?.trim();
  const date = formatRelativeDate(item.date);
  const time = item.occured_at ? formatJakartaTime(item.occured_at) : "";
  const when = time ? `${date}, ${time}` : date;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${description || item.category.name}, ${isIncome ? "pemasukan" : "pengeluaran"} ${isIncome ? formatIncome(item.amount) : formatExpense(item.amount)}${time ? `, pukul ${time}` : ""}`}
      android_ripple={{ color: "rgba(0,0,0,0.04)", borderless: false }}
    >
      <View
        className="flex-row items-center justify-between rounded-xl border border-[rgba(196,198,206,0.3)] bg-white p-[15px]"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1,
        }}
      >
        <View className="flex-1 flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.bubble }}
          >
            <Ionicons
              name={categoryIconName(item.category.icon, item.type)}
              size={20}
              color={theme.text}
            />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="font-sans text-base font-semibold leading-5 tracking-[-0.16px] text-[#121c2a]"
              numberOfLines={1}
            >
              {description || item.category.name}
            </Text>
            <Text
              className="font-sans text-xs leading-4 text-[#74777e]"
              numberOfLines={1}
            >
              {description ? `${item.category.name} • ${when}` : when}
            </Text>
          </View>
        </View>
        <View className="items-end pl-3">
          <Text
            className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px]"
            style={{ color: theme.text }}
          >
            {isIncome ? formatIncome(item.amount) : formatExpense(item.amount)}
          </Text>
          <View
            className="mt-[3px] rounded-full px-2 py-[2px]"
            style={{ backgroundColor: theme.badge }}
          >
            <Text
              className="font-sans text-[10px] font-semibold leading-[14px] tracking-[0.4px]"
              style={{ color: theme.text }}
            >
              {isIncome ? "Masuk" : "Keluar"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// State kosong: akun baru atau belum ada transaksi
function EmptyTransactions({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-[rgba(196,198,206,0.8)] bg-white px-5 py-8">
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: TYPE_THEME.income.badge }}
      >
        <Ionicons
          name="receipt-outline"
          size={22}
          color={TYPE_THEME.income.text}
        />
      </View>
      <Text className="font-sans mt-3 text-base font-semibold text-[#121c2a]">
        Belum ada transaksi
      </Text>
      <Text className="font-sans mt-1 text-center text-xs leading-4 text-[#74777e]">
        Catat pemasukan atau pengeluaran pertamamu supaya ringkasan keuangan
        mulai terisi.
      </Text>
      {/* Warna latar lewat style: class warna pada Pressable tidak diterapkan di proyek ini */}
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Catat transaksi"
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
        className="mt-4 rounded-full px-5 py-[10px]"
        style={{ backgroundColor: TYPE_THEME.income.text }}
      >
        <Text className="font-sans text-sm font-semibold text-white">
          Catat Transaksi
        </Text>
      </Pressable>
    </View>
  );
}

export function RecentTransactions({
  items,
  onSeeAll,
  onAdd,
  onPressItem,
}: RecentTransactionsProps) {
  const isEmpty = items.length === 0;

  return (
    <View className="gap-3 pt-1">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]">
          Transaksi Terbaru
        </Text>
        {isEmpty ? null : (
          <Pressable
            onPress={onSeeAll}
            accessibilityRole="button"
            accessibilityLabel="Lihat semua transaksi"
            hitSlop={8}
            className="flex-row items-center gap-[2px]"
          >
            <Text className="font-sans text-xs font-semibold leading-4 tracking-[0.24px] text-[#001d37]">
              Lihat Semua
            </Text>
            <Ionicons name="chevron-forward" size={12} color="#001d37" />
          </Pressable>
        )}
      </View>

      {isEmpty ? (
        <EmptyTransactions onAdd={onAdd} />
      ) : (
        <View className="gap-[10px]">
          {items.map((item) => (
            <TransactionRow
              key={item.id}
              item={item}
              onPress={() => onPressItem(item.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

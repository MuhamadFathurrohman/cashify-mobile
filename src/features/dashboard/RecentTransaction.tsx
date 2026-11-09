import type { DashboardTransaction } from "@/types/api";
import { categoryIconName } from "@/utils/categoryIcon";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import { formatRelativeDate } from "./dashboardDates";
import { formatExpense, formatIncome } from "./money";

interface RecentTransactionsProps {
  items: DashboardTransaction[];
  onSeeAll: () => void;
  onAdd: () => void;
}

const INCOME_COLOR = "#006c50";
const EXPENSE_COLOR = "#ed7658";

// 📄 Belum diuji dengan data nyata: transaksi belum bisa dibuat dari app, dan bentuk
// item `recent_transactions` belum terverifikasi (lihat DashboardTransaction di api.ts).
// Baris belum bisa diketuk: layar detail belum didesain.
function TransactionRow({ item }: { item: DashboardTransaction }) {
  const isIncome = item.type === "income";
  const color = isIncome ? INCOME_COLOR : EXPENSE_COLOR;
  const description = item.description?.trim();
  const date = formatRelativeDate(item.date);

  return (
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
          style={{
            backgroundColor: isIncome
              ? "rgba(127,249,204,0.2)"
              : "rgba(237,118,88,0.1)",
          }}
        >
          <Ionicons
            name={categoryIconName(item.category.icon, item.type)}
            size={20}
            color={color}
          />
        </View>
        <View className="ml-3 flex-1">
          <Text
            className="font-sans text-base font-semibold leading-5 tracking-[-0.16px] text-[#121c2a]"
            numberOfLines={1}
          >
            {description || item.category.name}
          </Text>
          <Text className="font-sans text-xs leading-4 text-[#74777e]" numberOfLines={1}>
            {description ? `${item.category.name} • ${date}` : date}
          </Text>
        </View>
      </View>
      <View className="items-end pl-3">
        <Text
          className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px]"
          style={{ color }}
        >
          {isIncome ? formatIncome(item.amount) : formatExpense(item.amount)}
        </Text>
        <View
          className="mt-[3px] rounded-full px-2 py-[2px]"
          style={{
            backgroundColor: isIncome
              ? "rgba(0,108,80,0.1)"
              : "rgba(237,118,88,0.1)",
          }}
        >
          <Text
            className="font-sans text-[10px] font-semibold leading-[14px] tracking-[0.4px]"
            style={{ color }}
          >
            {isIncome ? "Masuk" : "Keluar"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// State kosong: akun baru atau belum ada transaksi
function EmptyTransactions({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-[rgba(196,198,206,0.8)] bg-white px-5 py-8">
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(0,108,80,0.1)" }}
      >
        <Ionicons name="receipt-outline" size={22} color={INCOME_COLOR} />
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
        style={{ backgroundColor: INCOME_COLOR }}
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
            <TransactionRow key={item.id} item={item} />
          ))}
        </View>
      )}
    </View>
  );
}

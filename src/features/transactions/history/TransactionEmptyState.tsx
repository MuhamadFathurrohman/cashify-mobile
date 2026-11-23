import { TYPE_THEME } from "@/utils/categoryIconTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";

interface TransactionEmptyStateProps {
  // true = ada pencarian/filter/tab aktif, jadi kosong BUKAN bukti akun tanpa transaksi
  filtered: boolean;
  canResetFilters: boolean;
  onResetFilters: () => void;
}

export function TransactionEmptyState({
  filtered,
  canResetFilters,
  onResetFilters,
}: TransactionEmptyStateProps) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-[rgba(196,198,206,0.8)] bg-white px-5 py-8">
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: TYPE_THEME.income.bubble }}
      >
        <Ionicons
          name={filtered ? "search-outline" : "receipt-outline"}
          size={22}
          color={TYPE_THEME.income.text}
        />
      </View>
      <Text className="font-sans mt-3 text-base font-semibold text-[#121c2a]">
        {filtered ? "Transaksi Tidak Ditemukan" : "Belum Ada Transaksi"}
      </Text>
      <Text className="font-sans mt-1 text-center text-xs leading-4 text-[#74777e]">
        {filtered
          ? "Coba ubah kata pencarian atau sesuaikan filter."
          : "Transaksi yang kamu tambahkan akan muncul di sini."}
      </Text>
      {filtered && canResetFilters ? (
        <Pressable
          onPress={onResetFilters}
          accessibilityRole="button"
          accessibilityLabel="Atur ulang filter"
          android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
          className="mt-4 rounded-full px-5 py-[10px]"
          style={{ backgroundColor: "#1a2b49" }}
        >
          <Text className="font-sans text-sm font-semibold text-white">
            Atur Ulang Filter
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

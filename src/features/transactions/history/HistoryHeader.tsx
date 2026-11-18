import {
    SegmentedControl,
    type SegmentOption,
} from "@/components/ui/SegmentedControl";
import type { TransactionType } from "@/types/api";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EXPENSE_COLOR } from "./TransactionListItem";

type TabValue = "all" | TransactionType;

// Kelas activeClassName statis per opsi (aturan SegmentedControl: jangan dirakit dinamis)
const TAB_OPTIONS: readonly SegmentOption<TabValue>[] = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Pengeluaran", activeClassName: "bg-[#f0785a]" },
  { value: "income", label: "Pemasukan", activeClassName: "bg-[#27ae86]" },
];

interface HistoryHeaderProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  onOpenFilter: () => void;
  // undefined = tab Semua
  type: TransactionType | undefined;
  onTypeChange: (type: TransactionType | undefined) => void;
}

// Header tetap di atas (tidak ikut scroll): judul, pencarian + tombol filter, tab tipe.
export function HistoryHeader({
  searchInput,
  onSearchChange,
  hasActiveFilters,
  onOpenFilter,
  type,
  onTypeChange,
}: HistoryHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white pb-3"
      style={{
        paddingTop: insets.top + 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Text className="font-sans px-5 text-xl font-semibold leading-7 tracking-[-0.5px] text-[#001d37]">
        Riwayat Transaksi
      </Text>

      <View className="mt-3 flex-row items-center gap-3 px-5">
        <View className="h-12 flex-1 flex-row items-center rounded-2xl border border-[rgba(196,198,206,0.5)] bg-white px-4">
          <Ionicons name="search-outline" size={18} color="#74777e" />
          <TextInput
            value={searchInput}
            onChangeText={onSearchChange}
            placeholder="Cari deskripsi transaksi..."
            placeholderTextColor="#74777e"
            className="font-sans ml-2 flex-1 text-sm text-[#121c2a]"
            returnKeyType="search"
            autoCorrect={false}
            maxLength={100}
          />
          {searchInput.length > 0 ? (
            <Pressable
              onPress={() => onSearchChange("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Hapus pencarian"
            >
              <Ionicons name="close-circle" size={18} color="#74777e" />
            </Pressable>
          ) : null}
        </View>

        {/* Warna latar lewat style: class warna pada Pressable tidak diterapkan di proyek ini */}
        <Pressable
          onPress={onOpenFilter}
          accessibilityRole="button"
          accessibilityLabel={hasActiveFilters ? "Filter (aktif)" : "Filter"}
          android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "#1a2b49" }}
        >
          <Ionicons name="options-outline" size={20} color="#ffffff" />
          {hasActiveFilters ? (
            <View
              className="absolute right-[10px] top-[10px] h-2 w-2 rounded-full"
              style={{ backgroundColor: EXPENSE_COLOR }}
            />
          ) : null}
        </Pressable>
      </View>

      <View className="mt-3 px-5">
        <SegmentedControl<TabValue>
          options={TAB_OPTIONS}
          value={type ?? "all"}
          onChange={(value) =>
            onTypeChange(value === "all" ? undefined : value)
          }
        />
      </View>
    </View>
  );
}

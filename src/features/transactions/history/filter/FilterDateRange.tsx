import { DatePickerModal } from "@/components/ui/DatePickerModal";
import { FilterSection } from "@/features/transactions/history/filter/FilterFields";
import { todayDate } from "@/features/transactions/transactionRules";
import { formatDateShort } from "@/utils/jakartaDates";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

// Warna sheet filter (sama dengan chip terpilih dan tombol Terapkan)
const ACCENT = "#1a2b49";

interface FilterDateRangeProps {
  // "YYYY-MM-DD" atau string kosong
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
}

function rangeLabel(start: string, end: string): string {
  if (!start && !end) return "Pilih rentang tanggal";
  // Sebelum tanggal akhir dipilih, tampilkan awal + elipsis
  const from = start ? formatDateShort(start) : "…";
  const to = end ? formatDateShort(end) : "…";
  return `${from} – ${to}`;
}

// Satu kolom rentang: mengetuknya membuka satu kalender, ketuk pertama = awal,
// ketuk kedua = akhir. Tidak ada batas bawah tanggal; batas atas hari ini.
export function FilterDateRange({
  start,
  end,
  onChange,
}: FilterDateRangeProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasRange = Boolean(start || end);

  return (
    <FilterSection label="Rentang Tanggal">
      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Pilih rentang tanggal"
        className="flex-row items-center rounded-2xl border px-4 py-3"
        // Warna lewat style: class warna pada Pressable tidak diterapkan (aturan proyek)
        style={{
          borderColor: "rgba(196,198,206,0.5)",
          backgroundColor: "#ffffff",
        }}
      >
        <Ionicons name="calendar-outline" size={18} color="#74777e" />
        <Text
          numberOfLines={1}
          className={
            hasRange
              ? "font-sans ml-2 flex-1 text-sm text-[#121c2a]"
              : "font-sans ml-2 flex-1 text-sm text-[#c4c6ce]"
          }
        >
          {rangeLabel(start, end)}
        </Text>
        {hasRange ? (
          <Pressable
            onPress={() => onChange({ start: "", end: "" })}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Hapus rentang tanggal"
          >
            <View className="pl-2">
              <Ionicons name="close-circle" size={18} color="#c4c6ce" />
            </View>
          </Pressable>
        ) : null}
      </Pressable>

      <DatePickerModal
        visible={pickerOpen}
        mode="range"
        startDate={start}
        endDate={end}
        maxDate={todayDate()}
        accentColor={ACCENT}
        onChangeRange={onChange}
        onClose={() => setPickerOpen(false)}
      />
    </FilterSection>
  );
}

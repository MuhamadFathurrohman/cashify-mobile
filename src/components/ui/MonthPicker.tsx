import type { MonthOption } from "@/utils/monthOptions";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { MonthPickerSheet } from "./MonthPickerSheet";

interface MonthPickerProps {
  months: MonthOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  // Segmen Anggaran tanpa data: label bulan berjalan tampil tanpa aksi supaya
  // posisi SegmentedControl di bawahnya tidak bergeser.
  disabled?: boolean;
  fallbackLabel?: string;
  // Dipakai Laporan saat tab 6/12 Bulan: "Mei-Nov 2026". Tanpa ini tombol
  // menampilkan nama bulan penuh seperti pada Anggaran.
  displayLabel?: string;
  // Penjelasan di dalam sheet bahwa bulan dipilih sebagai akhir periode.
  helperText?: string;
}

// Tombol bulan + tahun pada header tab Analisis. Tanggal lengkap hanya muncul
// di dalam sheet, bersama penanda periode aktif.
export function MonthPicker({
  months,
  selectedId,
  onSelect,
  disabled = false,
  fallbackLabel,
  displayLabel,
  helperText,
}: MonthPickerProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const selected = months.find((month) => month.id === selectedId) ?? null;
  const label = displayLabel ?? selected?.monthLabel ?? fallbackLabel ?? "Pilih bulan";
  const canOpen = !disabled && months.length > 0;

  return (
    <>
      <Pressable
        onPress={() => setSheetVisible(true)}
        disabled={!canOpen}
        accessibilityRole="button"
        accessibilityLabel={
          canOpen ? `Pilih bulan, sekarang ${label}` : `Periode ${label}`
        }
        accessibilityState={{ disabled: !canOpen }}
        className={`flex-row items-center gap-2 self-start ${
          canOpen ? "active:opacity-70" : "opacity-60"
        }`}
      >
        <Ionicons name="calendar-outline" size={16} color="#43474d" />
        <Text className="font-sans text-sm font-semibold leading-5 text-[#121c2a]">
          {label}
        </Text>
        {canOpen ? (
          <Ionicons name="chevron-down" size={14} color="#43474d" />
        ) : null}
      </Pressable>

      {canOpen ? (
        <MonthPickerSheet
          visible={sheetVisible}
          months={months}
          selectedId={selectedId}
          onSelect={onSelect}
          onClose={() => setSheetVisible(false)}
          helperText={helperText}
        />
      ) : null}
    </>
  );
}

import { formatPlainRupiah } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentRef, Ref } from "react";
import { Text, TextInput, View, type ViewInstance } from "react-native";
import { AmountInput, PresetChips } from "./BudgetFormFields";
import { BudgetStepIndicator } from "./BudgetFormSummary";
import { TOTAL_PRESETS } from "./budgetFormRules";

interface BudgetTotalPanelProps {
  // true = tampilan "Ubah Total Anggaran"; false = langkah total saat membuat.
  editing: boolean;
  totalText: string;
  error?: string;
  allocated: number;
  totalInputRef?: Ref<ComponentRef<typeof TextInput>>;
  totalCardRef?: Ref<ViewInstance>;
  onChangeText: (text: string) => void;
  onTotalFocus?: () => void;
  onTotalBlur?: () => void;
  onAddPreset: (amount: number) => void;
}

// Dua tampilan memakai field yang sama; hanya pengantar dan catatan bawah yang
// berbeda. State dan validasi tetap di BudgetForm.
export function BudgetTotalPanel({
  editing,
  totalText,
  error,
  allocated,
  totalInputRef,
  totalCardRef,
  onChangeText,
  onTotalFocus,
  onTotalBlur,
  onAddPreset,
}: BudgetTotalPanelProps) {
  return (
    <>
      {editing ? null : <BudgetStepIndicator step={1} />}

      {editing ? null : (
        <View className="flex-row items-start gap-3 rounded-2xl bg-[rgba(0,108,80,0.06)] p-4">
          <Ionicons name="bulb-outline" size={18} color="#006c50" />
          <Text className="font-sans flex-1 text-xs leading-[18px] text-[#43474d]">
            Rencanakan batas belanja agar pengeluaran tetap terkendali. Anggaran
            berlaku untuk satu bulan penuh.
          </Text>
        </View>
      )}

      <AmountInput
        label="Total Anggaran Bulanan"
        value={totalText}
        onChangeText={onChangeText}
        error={error}
        helper="Batas seluruh pengeluaran bulan ini."
        accessibilityLabel="Total anggaran bulanan"
        inputRef={totalInputRef}
        cardRef={totalCardRef}
        onFocus={onTotalFocus}
        onBlur={onTotalBlur}
      />
      <PresetChips presets={TOTAL_PRESETS} onAdd={onAddPreset} />

      <Text className="font-sans text-xs leading-[18px] text-[#43474d]">
        {editing
          ? `Alokasi tersimpan ${formatPlainRupiah(allocated)}. Total tidak boleh lebih kecil dari jumlah itu.`
          : "Belum ada alokasi. Seluruh total masih bisa dibagi ke kategori pada langkah berikutnya."}
      </Text>
    </>
  );
}

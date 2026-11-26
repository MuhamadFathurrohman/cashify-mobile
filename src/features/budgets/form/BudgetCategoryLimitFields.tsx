import type { ComponentRef, ReactNode, Ref } from "react";
import { TextInput, View, type ViewInstance } from "react-native";
import { AmountInput, PresetChips, ThresholdPicker } from "./BudgetFormFields";
import { CATEGORY_PRESETS } from "./budgetFormRules";

interface BudgetCategoryLimitFieldsProps {
  amountText: string;
  amountError?: string;
  amountHelper: string;
  amountInputRef?: Ref<ComponentRef<typeof TextInput>>;
  amountCardRef?: Ref<ViewInstance>;
  onAmountChange: (text: string) => void;
  onAmountFocus?: () => void;
  onAmountBlur?: () => void;
  onAddAmountPreset: (amount: number) => void;
  threshold: number;
  thresholdError?: string;
  thresholdRef?: Ref<ViewInstance>;
  onThresholdChange: (value: number) => void;
  // Peringatan khusus edit (mis. batas baru di bawah pengeluaran) tampil di
  // antara nominal dan batas peringatan.
  notice?: ReactNode;
}

// Nominal + preset + batas peringatan dipakai bersama oleh langkah tambah dan edit kategori.
export function BudgetCategoryLimitFields({
  amountText,
  amountError,
  amountHelper,
  amountInputRef,
  amountCardRef,
  onAmountChange,
  onAmountFocus,
  onAmountBlur,
  onAddAmountPreset,
  threshold,
  thresholdError,
  thresholdRef,
  onThresholdChange,
  notice,
}: BudgetCategoryLimitFieldsProps) {
  return (
    <>
      <View className="gap-2">
        <AmountInput
          label="Batas Pengeluaran Kategori"
          value={amountText}
          onChangeText={onAmountChange}
          error={amountError}
          helper={amountHelper}
          accessibilityLabel="Batas pengeluaran kategori"
          inputRef={amountInputRef}
          cardRef={amountCardRef}
          onFocus={onAmountFocus}
          onBlur={onAmountBlur}
        />
        <PresetChips presets={CATEGORY_PRESETS} onAdd={onAddAmountPreset} />
      </View>

      {notice}

      <ThresholdPicker
        value={threshold}
        onChange={onThresholdChange}
        error={thresholdError}
        cardRef={thresholdRef}
      />
    </>
  );
}

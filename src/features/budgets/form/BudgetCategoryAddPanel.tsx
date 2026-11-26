import type { BudgetDetail } from "@/types/api";
import type { ComponentRef, Ref } from "react";
import { Text, TextInput, View, type ViewInstance } from "react-native";
import { BudgetCategoryCard } from "../BudgetCategoryCard";
import { BudgetCategoryPicker } from "./BudgetCategoryPicker";
import { BudgetCategoryLimitFields } from "./BudgetCategoryLimitFields";
import {
  BudgetStepIndicator,
  TotalSummaryCard,
  type SummaryRow,
} from "./BudgetFormSummary";

export interface CategoryPreview {
  name: string;
  icon: string | null;
  color: string | null;
}

interface BudgetCategoryAddPanelProps {
  mode: "create" | "add";
  budget: BudgetDetail | null;
  categoryId: string | null;
  selectedCategory: CategoryPreview | null;
  amount: number;
  amountText: string;
  amountError?: string;
  threshold: number;
  thresholdError?: string;
  categoryError?: string;
  total: number;
  summaryRows: SummaryRow[];
  amountInputRef?: Ref<ComponentRef<typeof TextInput>>;
  amountCardRef?: Ref<ViewInstance>;
  categoryRef?: Ref<ViewInstance>;
  thresholdRef?: Ref<ViewInstance>;
  onSelectCategory: (id: string) => void;
  onAmountChange: (text: string) => void;
  onAmountFocus?: () => void;
  onAmountBlur?: () => void;
  onAddAmountPreset: (amount: number) => void;
  onThresholdChange: (value: number) => void;
  // create: kembali ke langkah total; add: buka tampilan ubah total.
  onEditTotal: () => void;
}

// Langkah kategori untuk pembuatan anggaran baru maupun penambahan kategori
// pada anggaran yang sudah ada. Nominal lama tidak ditampilkan di sini.
export function BudgetCategoryAddPanel({
  mode,
  budget,
  categoryId,
  selectedCategory,
  amount,
  amountText,
  amountError,
  threshold,
  thresholdError,
  categoryError,
  total,
  summaryRows,
  amountInputRef,
  amountCardRef,
  categoryRef,
  thresholdRef,
  onSelectCategory,
  onAmountChange,
  onAmountFocus,
  onAmountBlur,
  onAddAmountPreset,
  onThresholdChange,
  onEditTotal,
}: BudgetCategoryAddPanelProps) {
  return (
    <>
      {mode === "create" ? <BudgetStepIndicator step={2} /> : null}

      <TotalSummaryCard
        total={total}
        rows={summaryRows}
        editLabel={mode === "create" ? "Ubah" : "Ubah total"}
        onEdit={onEditTotal}
      />

      <BudgetCategoryPicker
        excludedIds={
          budget?.categories.map((category) => category.category_id) ?? []
        }
        selectedId={categoryId}
        onSelect={onSelectCategory}
        error={categoryError}
        containerRef={categoryRef}
      />

      <BudgetCategoryLimitFields
        amountText={amountText}
        amountError={amountError}
        amountHelper="Nominal yang disisihkan untuk kategori ini."
        amountInputRef={amountInputRef}
        amountCardRef={amountCardRef}
        onAmountChange={onAmountChange}
        onAmountFocus={onAmountFocus}
        onAmountBlur={onAmountBlur}
        onAddAmountPreset={onAddAmountPreset}
        threshold={threshold}
        thresholdError={thresholdError}
        thresholdRef={thresholdRef}
        onThresholdChange={onThresholdChange}
      />

      {selectedCategory && amount > 0 ? (
        <View className="gap-2">
          <Text className="font-sans text-xs font-semibold leading-4 tracking-[0.24px] text-[#43474d]">
            Pratinjau
          </Text>
          <BudgetCategoryCard
            variant="preview"
            name={selectedCategory.name}
            icon={selectedCategory.icon}
            color={selectedCategory.color}
            amount={amount}
          />
        </View>
      ) : null}
    </>
  );
}

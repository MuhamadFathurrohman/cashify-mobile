import type { BudgetDetail } from "@/types/api";
import { formatPlainRupiah } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentRef, Ref } from "react";
import { Pressable, Text, TextInput, View, type ViewInstance } from "react-native";
import { BudgetCategoryCard } from "../BudgetCategoryCard";
import type { CategoryPreview } from "./BudgetCategoryAddPanel";
import { BudgetCategoryLimitFields } from "./BudgetCategoryLimitFields";
import { TotalSummaryCard, type SummaryRow } from "./BudgetFormSummary";

interface BudgetEditCategoryPanelProps {
  budget: BudgetDetail;
  editCategory: BudgetDetail["categories"][number];
  selectedCategory: CategoryPreview | null;
  total: number;
  summaryRows: SummaryRow[];
  amount: number;
  amountText: string;
  amountError?: string;
  amountHelper: string;
  amountInputRef?: Ref<ComponentRef<typeof TextInput>>;
  amountCardRef?: Ref<ViewInstance>;
  onAmountFocus?: () => void;
  onAmountBlur?: () => void;
  threshold: number;
  thresholdError?: string;
  thresholdRef?: Ref<ViewInstance>;
  // Disabled saat ada proses lain atau tinggal satu kategori.
  deleteDisabled: boolean;
  onEditTotal: () => void;
  onAmountChange: (text: string) => void;
  onAddAmountPreset: (amount: number) => void;
  onThresholdChange: (value: number) => void;
  onRequestDelete: () => void;
}

// Tampilan edit satu alokasi: kategori dikunci, nominal dan batas peringatan dapat diubah,
// dan penghapusan rincian berada di halaman ini agar tidak tercampur di ringkasan.
export function BudgetEditCategoryPanel({
  budget,
  editCategory,
  selectedCategory,
  total,
  summaryRows,
  amount,
  amountText,
  amountError,
  amountHelper,
  amountInputRef,
  amountCardRef,
  onAmountFocus,
  onAmountBlur,
  threshold,
  thresholdError,
  thresholdRef,
  deleteDisabled,
  onEditTotal,
  onAmountChange,
  onAddAmountPreset,
  onThresholdChange,
  onRequestDelete,
}: BudgetEditCategoryPanelProps) {
  return (
    <>
      <TotalSummaryCard
        total={total}
        rows={summaryRows}
        editLabel="Ubah total"
        onEdit={onEditTotal}
      />

      <BudgetCategoryCard
        variant="preview"
        name={editCategory.name}
        icon={selectedCategory?.icon ?? null}
        color={selectedCategory?.color ?? null}
        amount={editCategory.amount}
        caption="Alokasi saat ini"
      />

      <BudgetCategoryLimitFields
        amountText={amountText}
        amountError={amountError}
        amountHelper={amountHelper}
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
        notice={
          amount > 0 && amount < editCategory.spent ? (
            <View className="flex-row items-start gap-2 rounded-2xl bg-[rgba(237,118,88,0.08)] p-3">
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color="#ed7658"
              />
              <Text className="font-sans flex-1 text-xs leading-[18px] text-[#43474d]">
                {`Pengeluaran kategori ini sudah ${formatPlainRupiah(editCategory.spent)}. Batas baru akan langsung terlampaui.`}
              </Text>
            </View>
          ) : null
        }
      />

      <Pressable
        onPress={onRequestDelete}
        disabled={deleteDisabled}
        accessibilityRole="button"
        accessibilityLabel="Hapus rincian kategori"
        accessibilityState={{ disabled: deleteDisabled }}
        className={deleteDisabled ? "opacity-50" : "active:opacity-80"}
      >
        <View className="h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-[#ba1a1a] bg-white">
          <Ionicons name="trash-outline" size={16} color="#ba1a1a" />
          <Text className="font-sans text-sm font-semibold leading-5 text-[#ba1a1a]">
            Hapus rincian kategori
          </Text>
        </View>
      </Pressable>

      {budget.categories.length <= 1 ? (
        <Text className="font-sans -mt-2 text-center text-xs leading-4 text-[#74777e]">
          Minimal satu kategori harus tetap ada.
        </Text>
      ) : null}
    </>
  );
}

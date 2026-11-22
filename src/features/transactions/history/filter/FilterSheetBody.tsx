import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type {
  Account,
  Category,
  TransactionSource,
  TransactionType,
} from "@/types/api";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ActiveFilters } from "../TransactionFilterSheet";
import { FilterDateRange } from "./FilterDateRange";
import {
  FilterAccountGroup,
  FilterCategoryGroup,
  FilterSection,
  FilterSourceGroup,
} from "./FilterFields";

export const TYPE_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
] as const;

export type TypeOption = "all" | TransactionType;

export interface FilterSheetBodyProps {
  activeFilters: ActiveFilters;
  activeType: TransactionType | undefined;
  expenseCategories: Category[];
  incomeCategories: Category[];
  accounts: Account[];
  categoriesLoading: boolean;
  accountsLoading: boolean;
  onApply: (filters: ActiveFilters, type: TransactionType | undefined) => void;
  // Menghapus filter yang sedang berlaku. Dipakai tombol Reset di sheet dan
  // tombol reset di keadaan kosong layar History — satu implementasi, satu arti.
  onReset: () => void;
  onRequestClose: () => void;
}

// Isi sheet: draft filter, seksi-seksi, dan tombol aksi.
// State draft diinisialisasi dari props saat komponen dipasang (sheet dibuka),
// jadi tidak perlu effect untuk menyinkronkan ulang.
export function FilterSheetBody({
  activeFilters,
  activeType,
  expenseCategories,
  incomeCategories,
  accounts,
  categoriesLoading,
  accountsLoading,
  onApply,
  onReset,
  onRequestClose,
}: FilterSheetBodyProps) {
  const insets = useSafeAreaInsets();
  // Draft state — perubahan di sini belum diterapkan sampai Apply ditekan
  const [draftFrom, setDraftFrom] = useState<string>(activeFilters.from ?? "");
  const [draftTo, setDraftTo] = useState<string>(activeFilters.to ?? "");
  const [draftType, setDraftType] = useState<TypeOption>(activeType ?? "all");
  const [draftCategoryId, setDraftCategoryId] = useState<string | undefined>(
    activeFilters.category_id,
  );
  const [draftAccountId, setDraftAccountId] = useState<string | undefined>(
    activeFilters.account_id,
  );
  const [draftSource, setDraftSource] = useState<TransactionSource | "all">(
    activeFilters.source ?? "all",
  );

  // Chip kategori mengikuti tipe: kategori pemasukan tidak ditawarkan saat tipe
  // pengeluaran dipilih (dan sebaliknya). Tipe "all" menampilkan keduanya.
  const categories =
    draftType === "expense"
      ? expenseCategories
      : draftType === "income"
        ? incomeCategories
        : [...expenseCategories, ...incomeCategories];

  // Ganti tipe bisa membuat kategori terpilih tidak lagi ditawarkan; buang agar
  // tidak mengirim kombinasi tipe + kategori yang bertentangan ke API
  function handleTypeChange(next: TypeOption) {
    setDraftType(next);
    if (!draftCategoryId || next === "all") return;

    const offered = next === "expense" ? expenseCategories : incomeCategories;
    // Daftar belum dimuat (kosong): perlakukan sebagai tidak cocok (lebih aman dibuang)
    const stillOffered = offered.some(
      (category) => category.id === draftCategoryId,
    );
    if (!stillOffered) setDraftCategoryId(undefined);
  }

  // Reset hanya aktif kalau ada filter yang benar-benar berlaku. Perubahan draft
  // tidak menghidupkannya: draft dibuang lewat Tutup/backdrop/swipe, bukan Reset,
  // supaya tombol ini tidak pernah tertekan tanpa sengaja.
  const hasAppliedFilters =
    activeType !== undefined ||
    Object.values(activeFilters).some((value) => Boolean(value));
  const resetDisabled = !hasAppliedFilters;

  // Reset berarti menghapus filter SEKARANG juga (bukan sekadar draft), sama
  // seperti tombol reset di keadaan kosong, lalu sheet ditutup seperti Apply.
  function handleReset() {
    setDraftFrom("");
    setDraftTo("");
    setDraftType("all");
    setDraftCategoryId(undefined);
    setDraftAccountId(undefined);
    setDraftSource("all");
    onReset();
    onRequestClose();
  }

  function handleApply() {
    const filters: ActiveFilters = {};
    if (draftFrom.trim()) filters.from = draftFrom.trim();
    if (draftTo.trim()) filters.to = draftTo.trim();
    if (draftCategoryId) filters.category_id = draftCategoryId;
    if (draftAccountId) filters.account_id = draftAccountId;
    if (draftSource !== "all") filters.source = draftSource;

    const type: TransactionType | undefined =
      draftType === "all" ? undefined : draftType;

    onApply(filters, type);
    onRequestClose();
  }

  return (
    <>
      {/* Judul */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Text className="font-sans text-base font-semibold leading-[22px] text-[#001d37]">
          Filter Transaksi
        </Text>
        <Pressable
          onPress={onRequestClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Tutup filter"
        >
          <Text className="font-sans text-sm text-[#43474d]">Tutup</Text>
        </Pressable>
      </View>

      {/* Konten filter — scrollable */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tipe transaksi */}
        <FilterSection label="Tipe Transaksi">
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={draftType}
            onChange={handleTypeChange}
            size="md"
          />
        </FilterSection>

        {/* Rentang tanggal */}
        <FilterDateRange
          start={draftFrom}
          end={draftTo}
          onChange={(range) => {
            setDraftFrom(range.start);
            setDraftTo(range.end);
          }}
        />

        {/* Sumber transaksi */}
        <FilterSourceGroup value={draftSource} onChange={setDraftSource} />

        {/* Kategori */}
        <FilterCategoryGroup
          categories={categories}
          value={draftCategoryId}
          onChange={setDraftCategoryId}
          showTypeLabels={draftType === "all"}
          loading={categoriesLoading}
        />

        {/* Akun */}
        <FilterAccountGroup
          accounts={accounts}
          value={draftAccountId}
          onChange={setDraftAccountId}
          loading={accountsLoading}
        />

        {/* Spacer bawah agar konten tidak tertutup tombol */}
        <View className="h-4" />
      </ScrollView>

      {/* Tombol Reset dan Apply */}
      <View
        className="flex-row gap-3 px-5 pt-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: "rgba(196,198,206,0.3)",
          // Sheet dempet ke bawah layar; jaga tombol agar tidak masuk ke area sistem
          paddingBottom: Math.max(insets.bottom, 20) + 15,
        }}
      >
        <Pressable
          onPress={handleReset}
          disabled={resetDisabled}
          accessibilityRole="button"
          accessibilityLabel="Reset filter"
          accessibilityState={{ disabled: resetDisabled }}
          className="flex-1 items-center rounded-full border py-[11px]"
          // Warna lewat style: class warna pada Pressable tidak diterapkan
          style={{
            borderColor: resetDisabled
              ? "rgba(196,198,206,0.35)"
              : "rgba(196,198,206,0.6)",
          }}
        >
          <Text
            className={
              resetDisabled
                ? "font-sans text-sm font-semibold text-[#c4c6ce]"
                : "font-sans text-sm font-semibold text-[#43474d]"
            }
          >
            Reset
          </Text>
        </Pressable>
        <Pressable
          onPress={handleApply}
          accessibilityRole="button"
          accessibilityLabel="Terapkan filter"
          className="flex-[2] items-center rounded-full py-[11px]"
          style={{ backgroundColor: "#1a2b49" }}
        >
          <Text className="font-sans text-sm font-semibold text-white">
            Terapkan Filter
          </Text>
        </Pressable>
      </View>
    </>
  );
}

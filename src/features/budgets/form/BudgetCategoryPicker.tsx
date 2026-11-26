import { SkeletonPulse } from "@/components/ui/Skeleton";
import { CategoryTilePlaceholders } from "@/features/transactions/form/CategoryGrid";
import { useCategories } from "@/features/transactions/useCategories";
import type { Category } from "@/types/api";
import { categoryIconName } from "@/utils/categoryIconTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import type { Ref } from "react";
import { Pressable, Text, View, type ViewInstance } from "react-native";
import { BudgetFieldError } from "./BudgetFormFields";

interface BudgetCategoryPickerProps {
  // Kategori yang sudah dialokasikan pada anggaran ini (mode tambah kategori).
  excludedIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  error?: string;
  containerRef?: Ref<ViewInstance>;
}

// Bubble memakai warna kategori dari backend (alpha 15%); nilai tak dikenal
// memakai biru netral proyek.
function bubbleStyle(category: Category) {
  return /^#[0-9a-f]{6}$/i.test(category.color)
    ? { backgroundColor: `${category.color}26` }
    : { backgroundColor: "#dee9fc" };
}

// Grid 4 kolom: backend hanya menerima kategori pengeluaran untuk anggaran,
// jadi tipe dikunci "expense" dan tidak ada pemilih pemasukan/pengeluaran.
export function BudgetCategoryPicker({
  excludedIds,
  selectedId,
  onSelect,
  error,
  containerRef,
}: BudgetCategoryPickerProps) {
  const categories = useCategories("expense");
  const excluded = new Set(excludedIds);
  const available = (categories.data ?? []).filter(
    (category) => !excluded.has(category.id),
  );

  return (
    <View ref={containerRef} className="relative">
      {error ? (
        <View
          pointerEvents="none"
          className="absolute -inset-2 rounded-2xl border border-[#ba1a1a]"
        />
      ) : null}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-sans text-base font-semibold leading-[22px] text-[#121c2a]">
          Pilih Kategori Pengeluaran
        </Text>
        {categories.data ? (
          <Text className="font-sans text-xs font-semibold leading-4 text-[#43474d]">
            {`${available.length} tersedia`}
          </Text>
        ) : null}
      </View>

      {categories.isError ? (
        <View className="items-center gap-2 py-6">
          <Text className="font-sans text-sm text-[#43474d]">
            Kategori gagal dimuat.
          </Text>
          <Pressable
            onPress={() => void categories.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Muat ulang kategori"
            className="px-4 py-2"
          >
            <Text className="font-sans text-sm font-semibold text-[#006c50]">
              Coba lagi
            </Text>
          </Pressable>
        </View>
      ) : categories.isPending ? (
        <View className="-mx-1 -my-1">
          <SkeletonPulse accessibilityLabel="Memuat kategori">
            <CategoryTilePlaceholders />
          </SkeletonPulse>
        </View>
      ) : available.length === 0 ? (
        <Text className="py-6 text-center font-sans text-sm leading-5 text-[#43474d]">
          Semua kategori pengeluaran sudah dialokasikan pada anggaran ini.
        </Text>
      ) : (
        <View className="-mx-1 -my-1 flex-row flex-wrap">
          {available.map((category) => {
            const selected = category.id === selectedId;
            return (
              <View key={category.id} className="w-1/4 p-1">
                <Pressable
                  onPress={() => onSelect(category.id)}
                  accessibilityRole="button"
                  accessibilityLabel={category.name}
                  accessibilityState={{ selected }}
                  className="active:opacity-80"
                >
                  {/* Penampung bersudut statis; lapisan frame diberi key agar radius
                      tidak hilang ketika kelas berubah (lihat SegmentedControl). */}
                  <View className="h-[82px] overflow-hidden rounded-2xl">
                    <View
                      key={selected ? "on" : "off"}
                      className={`absolute inset-0 rounded-2xl ${
                        selected
                          ? "border-2 border-[#006c50] bg-[#e6f3ee]"
                          : "border border-[rgba(196,198,206,0.3)] bg-white"
                      }`}
                    />
                    <View className="items-center p-3">
                      <View
                        className="h-10 w-10 items-center justify-center rounded-xl"
                        style={bubbleStyle(category)}
                      >
                        <Ionicons
                          name={categoryIconName(category.icon, "expense")}
                          size={20}
                          color={category.color}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`mt-1 font-sans text-[10px] font-semibold leading-[14px] tracking-[0.4px] ${
                          selected ? "text-[#006c50]" : "text-[#43474d]"
                        }`}
                      >
                        {category.name}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <BudgetFieldError message={error} />
      <Text className="font-sans mt-2 text-xs leading-4 text-[#74777e]">
        Anggaran hanya berlaku untuk kategori pengeluaran.
      </Text>
    </View>
  );
}

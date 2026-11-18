import type { Account, Category, TransactionSource } from "@/types/api";
import {
  SkeletonBlock,
  SkeletonPulse,
} from "@/components/ui/Skeleton";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

// Warna chip sengaja berupa nilai (bukan kelas) mengikuti konvensi proyek:
// class warna pada Pressable tidak diterapkan, jadi warna terpilih lewat style.
const SELECTED_COLOR = "#1a2b49";
const UNSELECTED_BORDER = "rgba(196,198,206,0.6)";

interface FilterSectionProps {
  label: string;
  children: ReactNode;
  // Jarak antar-seksi berbeda untuk seksi terakhir (akun) yang lebih renggang
  className?: string;
}

// Label + jarak seksi filter. Dipakai oleh seksi tipe, rentang tanggal, dan grup chip
// agar gaya judul tidak ditulis ulang di setiap seksi.
export function FilterSection({
  label,
  children,
  className = "mb-4",
}: FilterSectionProps) {
  return (
    <View className={className}>
      <Text className="font-sans mb-2 text-xs font-semibold leading-4 tracking-[0.3px] text-[#43474d]">
        {label}
      </Text>
      {children}
    </View>
  );
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

// Satu chip kapsul untuk pilihan tunggal.
export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className="rounded-full border px-4 py-2"
      style={{
        borderColor: selected ? SELECTED_COLOR : UNSELECTED_BORDER,
        backgroundColor: selected ? SELECTED_COLOR : "#ffffff",
      }}
    >
      <Text
        className="font-sans text-xs font-semibold leading-4"
        style={{ color: selected ? "#ffffff" : "#43474d" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const SOURCE_OPTIONS: {
  value: TransactionSource | "all";
  label: string;
}[] = [
  { value: "all", label: "Semua" },
  { value: "manual", label: "Manual" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "recurring", label: "Recurring" },
  { value: "import", label: "Import" },
];

interface FilterSourceGroupProps {
  value: TransactionSource | "all";
  onChange: (value: TransactionSource | "all") => void;
}

export function FilterSourceGroup({
  value,
  onChange,
}: FilterSourceGroupProps) {
  return (
    <FilterSection label="Sumber">
      <View className="flex-row flex-wrap gap-2">
        {SOURCE_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </FilterSection>
  );
}

interface FilterCategoryGroupProps {
  categories: Category[];
  // undefined = tanpa filter kategori (chip "Semua")
  value: string | undefined;
  onChange: (categoryId: string | undefined) => void;
  // Saat tipe = Semua, kategori kedua jenis ditampilkan. Nama kategori bisa sama
  // antar jenis (mis. "Lainnya"), jadi diberi sub-judul per jenis.
  showTypeLabels?: boolean;
  loading?: boolean;
}

const CATEGORY_TYPE_LABELS = [
  { type: "expense", label: "Pengeluaran" },
  { type: "income", label: "Pemasukan" },
] as const;

// Kelas ditulis utuh agar terbaca Tailwind (kelas dinamis tidak diproses)
const SKELETON_PILL = "h-8 w-20 rounded-full";
const CATEGORY_SKELETON_COUNT = 6;
const ACCOUNT_SKELETON_COUNT = 3;

function ChipSkeletons({ count }: { count: number }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonBlock key={index} className={SKELETON_PILL} />
      ))}
    </View>
  );
}

export function FilterCategoryGroup({
  categories,
  value,
  onChange,
  showTypeLabels = false,
  loading = false,
}: FilterCategoryGroupProps) {
  if (loading) {
    return (
      <FilterSection label="Kategori">
        <SkeletonPulse accessibilityLabel="Memuat kategori">
          <ChipSkeletons count={CATEGORY_SKELETON_COUNT} />
        </SkeletonPulse>
      </FilterSection>
    );
  }

  if (categories.length === 0) return null;

  const allChip = (
    <FilterChip
      label="Semua"
      selected={!value}
      onPress={() => onChange(undefined)}
    />
  );

  const renderChip = (category: Category) => {
    const selected = value === category.id;
    return (
      <FilterChip
        key={category.id}
        label={category.name}
        selected={selected}
        onPress={() => onChange(selected ? undefined : category.id)}
      />
    );
  };

  const hasBothTypes =
    categories.some((category) => category.type === "expense") &&
    categories.some((category) => category.type === "income");

  if (showTypeLabels && hasBothTypes) {
    return (
      <FilterSection label="Kategori">
        <View className="mb-2 flex-row">{allChip}</View>
        {CATEGORY_TYPE_LABELS.map(({ type, label }) => {
          const items = categories.filter((c) => c.type === type);
          if (items.length === 0) return null;
          return (
            <View key={type} className="mb-2">
              <Text className="font-sans mb-1 text-[11px] leading-4 text-[#74777e]">
                {label}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {items.map(renderChip)}
              </View>
            </View>
          );
        })}
      </FilterSection>
    );
  }

  return (
    <FilterSection label="Kategori">
      <View className="flex-row flex-wrap gap-2">
        {allChip}
        {categories.map(renderChip)}
      </View>
    </FilterSection>
  );
}

interface FilterAccountGroupProps {
  accounts: Account[];
  value: string | undefined;
  onChange: (accountId: string | undefined) => void;
  loading?: boolean;
}

export function FilterAccountGroup({
  accounts,
  value,
  onChange,
  loading = false,
}: FilterAccountGroupProps) {
  if (loading) {
    return (
      <FilterSection label="Akun" className="mb-6">
        <SkeletonPulse accessibilityLabel="Memuat akun">
          <ChipSkeletons count={ACCOUNT_SKELETON_COUNT} />
        </SkeletonPulse>
      </FilterSection>
    );
  }

  if (accounts.length === 0) return null;

  return (
    <FilterSection label="Akun" className="mb-6">
      <View className="flex-row flex-wrap gap-2">
        <FilterChip
          label="Semua"
          selected={!value}
          onPress={() => onChange(undefined)}
        />
        {accounts.map((account) => {
          const selected = value === account.id;
          return (
            <FilterChip
              key={account.id}
              label={account.name}
              selected={selected}
              onPress={() => onChange(selected ? undefined : account.id)}
            />
          );
        })}
      </View>
    </FilterSection>
  );
}

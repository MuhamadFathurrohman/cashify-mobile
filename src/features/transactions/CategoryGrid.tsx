import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import type { Category, TransactionType } from "@/types/api";
import { categoryIconName } from "@/utils/categoryIcon";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";

interface CategoryGridProps {
  type: TransactionType;
  categories: Category[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
  error?: string;
}

const SKELETON_COUNT = 8;

// Nilai dari Figma 69:2506 (pengeluaran) dan 76:3773 (pemasukan). Kelas harus utuh di
// sumber agar terbaca Tailwind, jadi dipetakan per jenis dan bukan dirakit dari warna.
// `frame` = latar + border ubin, digambar sebagai lapisan sendiri (lihat catatan di bawah).
const TILE = {
  expense: {
    frame: "border-2 border-[#ed7658] bg-[#eff4ff]",
    bubble: "bg-[rgba(237,118,88,0.15)]",
    label: "text-[#121c2a]",
    icon: "#ed7658",
  },
  income: {
    frame: "border-2 border-[#006c50] bg-[rgba(127,249,204,0.4)]",
    bubble: "bg-[#006c50]",
    label: "text-[#006c50]",
    icon: "#ffffff",
  },
} as const;

const TILE_IDLE = {
  frame: "border border-[rgba(196,198,206,0.3)] bg-white",
  bubble: "bg-[#dee9fc]",
  label: "text-[#43474d]",
  icon: "#121c2a",
} as const;

// Kerangka ubin kategori (statis, tanpa animasi sendiri). Pemanggil membungkusnya dengan
// SkeletonPulse dan memberi margin negatif "-mx-1 -my-1" agar gutter 8 sejajar dengan
// grid asli. Dipakai juga oleh TransactionFormSkeleton.
export function CategoryTilePlaceholders() {
  return (
    <View className="flex-row flex-wrap">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <View key={index} className="w-1/4 p-1">
          <SkeletonBlock className="h-[82px] rounded-2xl" />
        </View>
      ))}
    </View>
  );
}

// Grid 4 kolom. Gutter 8 dibuat dari padding 4 per sel dan margin negatif pada kontainer,
// karena lebar persen tidak bisa dikurangi gap. Ubin "+ Tambah" disembunyikan
// (kategori kustom: Phase 2).
export function CategoryGrid({
  type,
  categories,
  isPending,
  isError,
  onRetry,
  selectedId,
  onSelect,
  error,
}: CategoryGridProps) {
  const active = TILE[type];

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-sans text-base font-semibold leading-[22px] text-[#121c2a]">
          Pilih Kategori
        </Text>
        {categories ? (
          <Text className="font-sans text-xs font-semibold leading-4 text-[#43474d]">
            {categories.length} kategori tersedia
          </Text>
        ) : null}
      </View>

      {isError ? (
        <View className="items-center gap-2 py-6">
          <Text className="font-sans text-sm text-[#43474d]">
            Kategori gagal dimuat.
          </Text>
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Muat ulang kategori"
            className="px-4 py-2"
          >
            <Text className="font-sans text-sm font-semibold text-[#006c50]">
              Coba lagi
            </Text>
          </Pressable>
        </View>
      ) : isPending ? (
        <View className="-mx-1 -my-1">
          <SkeletonPulse accessibilityLabel="Memuat kategori">
            <CategoryTilePlaceholders />
          </SkeletonPulse>
        </View>
      ) : (
        <View className="-mx-1 -my-1 flex-row flex-wrap">
          {(categories ?? []).map((category) => {
            const selected = category.id === selectedId;
            const look = selected ? active : TILE_IDLE;
            const state = selected ? "on" : "off";
            return (
              <View key={category.id} className="w-1/4 p-1">
                <Pressable
                  onPress={() => onSelect(category.id)}
                  accessibilityRole="button"
                  accessibilityLabel={category.name}
                  accessibilityState={{ selected }}
                  className="active:opacity-80"
                >
                  {/*
                                        ⚠️ Penampung bersudut ini statis. Elemen bersudut yang kelasnya
                                        berubah setelah tampil kehilangan radius (teramati pada
                                        SegmentedControl dengan NativeWind). Latar + border ubin dan
                                        latar bubble ikon karena itu diberi `key` berdasarkan status
                                        terpilih, sehingga dipasang ulang (seperti render pertama)
                                        alih-alih diubah kelasnya.
                                      */}
                  <View className="h-[82px] overflow-hidden rounded-2xl">
                    <View
                      key={`frame-${state}`}
                      className={`absolute inset-0 rounded-2xl ${look.frame}`}
                    />
                    <View className="items-center p-3">
                      <View
                        key={`bubble-${state}`}
                        className={`h-10 w-10 items-center justify-center rounded-xl ${look.bubble}`}
                      >
                        <Ionicons
                          name={categoryIconName(category.icon, category.type)}
                          size={20}
                          color={look.icon}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`mt-1 font-sans text-[10px] font-semibold leading-[14px] tracking-[0.4px] ${look.label}`}
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

      {!isPending && !isError && categories?.length === 0 ? (
        <Text className="py-6 text-center font-sans text-sm text-[#43474d]">
          Belum ada kategori.
        </Text>
      ) : null}

      {error ? (
        <Text className="mt-2 font-sans text-xs leading-4 text-[#ba1a1a]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

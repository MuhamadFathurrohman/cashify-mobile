import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useAccounts } from "@/features/transactions/useAccounts";
import { useCategories } from "@/features/transactions/useCategories";
import type {
  TransactionListParams,
  TransactionSource,
  TransactionType,
} from "@/types/api";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Filter aktif yang dikontrol layar History — tanpa type karena itu dikelola tab
export type ActiveFilters = Omit<TransactionListParams, "type" | "q">;

interface TransactionFilterSheetProps {
  visible: boolean;
  // Filter yang sedang aktif saat sheet dibuka — dipakai untuk mengisi draft awal
  activeFilters: ActiveFilters;
  // Tipe aktif dari tab — ditampilkan dan bisa diubah dari dalam sheet
  activeType: TransactionType | undefined;
  onApply: (filters: ActiveFilters, type: TransactionType | undefined) => void;
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
] as const;

type TypeOption = "all" | TransactionType;

const SOURCE_OPTIONS: { value: TransactionSource | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "manual", label: "Manual" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "recurring", label: "Recurring" },
  { value: "import", label: "Import" },
];

const SHEET_HEIGHT = 520;
const ANIMATION_DURATION = 280;

// Label placeholder untuk date input sederhana
const DATE_PLACEHOLDER = "YYYY-MM-DD";

export function TransactionFilterSheet({
  visible,
  activeFilters,
  activeType,
  onApply,
  onClose,
}: TransactionFilterSheetProps) {
  const { data: incomeCategories } = useCategories("income");
  const { data: expenseCategories } = useCategories("expense");
  const { data: accountsData } = useAccounts();

  // Draft state — perubahan di sini belum diterapkan sampai Apply ditekan
  const [draftFrom, setDraftFrom] = useState<string>("");
  const [draftTo, setDraftTo] = useState<string>("");
  const [draftType, setDraftType] = useState<TypeOption>("all");
  const [draftCategoryId, setDraftCategoryId] = useState<string | undefined>(
    undefined,
  );
  const [draftAccountId, setDraftAccountId] = useState<string | undefined>(
    undefined,
  );
  const [draftSource, setDraftSource] = useState<TransactionSource | "all">(
    "all",
  );

  // Animasi slide up
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Isi draft dari filter aktif setiap kali sheet dibuka
  useEffect(() => {
    if (visible) {
      setDraftFrom(activeFilters.from ?? "");
      setDraftTo(activeFilters.to ?? "");
      setDraftType(activeType ?? "all");
      setDraftCategoryId(activeFilters.category_id);
      setDraftAccountId(activeFilters.account_id);
      setDraftSource(activeFilters.source ?? "all");

      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, activeFilters, activeType, translateY]);

  function handleReset() {
    setDraftFrom("");
    setDraftTo("");
    setDraftType("all");
    setDraftCategoryId(undefined);
    setDraftAccountId(undefined);
    setDraftSource("all");
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
    onClose();
  }

  const categories = [
    ...(expenseCategories ?? []),
    ...(incomeCategories ?? []),
  ];
  const accounts = accountsData ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay — menutup sheet saat ditekan */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          className="flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={{
          transform: [{ translateY }],
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: SHEET_HEIGHT,
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        {/* Handle bar */}
        <View className="items-center pt-3 pb-1">
          <View className="h-1 w-10 rounded-full bg-[rgba(196,198,206,0.8)]" />
        </View>

        {/* Judul */}
        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <Text className="font-sans text-base font-semibold leading-[22px] text-[#001d37]">
            Filter Transaksi
          </Text>
          <Pressable
            onPress={onClose}
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
          <View className="mb-4">
            <Text className="font-sans mb-2 text-xs font-semibold leading-4 tracking-[0.3px] text-[#43474d]">
              Tipe Transaksi
            </Text>
            <SegmentedControl
              options={TYPE_OPTIONS}
              value={draftType}
              onChange={setDraftType}
              size="md"
            />
          </View>

          {/* Rentang tanggal */}
          <View className="mb-4">
            <Text className="font-sans mb-2 text-xs font-semibold leading-4 tracking-[0.3px] text-[#43474d]">
              Rentang Tanggal
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-sans mb-1 text-[11px] leading-4 text-[#74777e]">
                  Dari
                </Text>
                <TextInput
                  value={draftFrom}
                  onChangeText={setDraftFrom}
                  placeholder={DATE_PLACEHOLDER}
                  placeholderTextColor="#c4c6ce"
                  className="font-sans rounded-2xl border border-[rgba(196,198,206,0.5)] bg-white px-4 py-3 text-sm text-[#121c2a]"
                  autoCorrect={false}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <View className="flex-1">
                <Text className="font-sans mb-1 text-[11px] leading-4 text-[#74777e]">
                  Sampai
                </Text>
                <TextInput
                  value={draftTo}
                  onChangeText={setDraftTo}
                  placeholder={DATE_PLACEHOLDER}
                  placeholderTextColor="#c4c6ce"
                  className="font-sans rounded-2xl border border-[rgba(196,198,206,0.5)] bg-white px-4 py-3 text-sm text-[#121c2a]"
                  autoCorrect={false}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {/* Sumber transaksi */}
          <View className="mb-4">
            <Text className="font-sans mb-2 text-xs font-semibold leading-4 tracking-[0.3px] text-[#43474d]">
              Sumber
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SOURCE_OPTIONS.map((opt) => {
                const selected = draftSource === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setDraftSource(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    className="rounded-full border px-4 py-2"
                    style={{
                      borderColor: selected
                        ? "#1a2b49"
                        : "rgba(196,198,206,0.6)",
                      backgroundColor: selected ? "#1a2b49" : "#ffffff",
                    }}
                  >
                    <Text
                      className="font-sans text-xs font-semibold leading-4"
                      style={{
                        color: selected ? "#ffffff" : "#43474d",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Kategori */}
          {categories.length > 0 && (
            <View className="mb-4">
              <Text className="font-sans mb-2 text-xs font-semibold leading-4 tracking-[0.3px] text-[#43474d]">
                Kategori
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setDraftCategoryId(undefined)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !draftCategoryId }}
                  className="rounded-full border px-4 py-2"
                  style={{
                    borderColor: !draftCategoryId
                      ? "#1a2b49"
                      : "rgba(196,198,206,0.6)",
                    backgroundColor: !draftCategoryId ? "#1a2b49" : "#ffffff",
                  }}
                >
                  <Text
                    className="font-sans text-xs font-semibold leading-4"
                    style={{
                      color: !draftCategoryId ? "#ffffff" : "#43474d",
                    }}
                  >
                    Semua
                  </Text>
                </Pressable>
                {categories.map((cat) => {
                  const selected = draftCategoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() =>
                        setDraftCategoryId(selected ? undefined : cat.id)
                      }
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      className="rounded-full border px-4 py-2"
                      style={{
                        borderColor: selected
                          ? "#1a2b49"
                          : "rgba(196,198,206,0.6)",
                        backgroundColor: selected ? "#1a2b49" : "#ffffff",
                      }}
                    >
                      <Text
                        className="font-sans text-xs font-semibold leading-4"
                        style={{
                          color: selected ? "#ffffff" : "#43474d",
                        }}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Akun */}
          {accounts.length > 0 && (
            <View className="mb-6">
              <Text className="font-sans mb-2 text-xs font-semibold leading-4 tracking-[0.3px] text-[#43474d]">
                Akun
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setDraftAccountId(undefined)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !draftAccountId }}
                  className="rounded-full border px-4 py-2"
                  style={{
                    borderColor: !draftAccountId
                      ? "#1a2b49"
                      : "rgba(196,198,206,0.6)",
                    backgroundColor: !draftAccountId ? "#1a2b49" : "#ffffff",
                  }}
                >
                  <Text
                    className="font-sans text-xs font-semibold leading-4"
                    style={{
                      color: !draftAccountId ? "#ffffff" : "#43474d",
                    }}
                  >
                    Semua
                  </Text>
                </Pressable>
                {accounts.map((acc) => {
                  const selected = draftAccountId === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() =>
                        setDraftAccountId(selected ? undefined : acc.id)
                      }
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      className="rounded-full border px-4 py-2"
                      style={{
                        borderColor: selected
                          ? "#1a2b49"
                          : "rgba(196,198,206,0.6)",
                        backgroundColor: selected ? "#1a2b49" : "#ffffff",
                      }}
                    >
                      <Text
                        className="font-sans text-xs font-semibold leading-4"
                        style={{
                          color: selected ? "#ffffff" : "#43474d",
                        }}
                      >
                        {acc.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Spacer bawah agar konten tidak tertutup tombol */}
          <View className="h-4" />
        </ScrollView>

        {/* Tombol Reset dan Apply */}
        <View
          className="flex-row gap-3 px-5 pb-8 pt-3"
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(196,198,206,0.3)",
          }}
        >
          <Pressable
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reset filter"
            className="flex-1 items-center rounded-full border border-[rgba(196,198,206,0.6)] py-[11px]"
          >
            <Text className="font-sans text-sm font-semibold text-[#43474d]">
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
      </Animated.View>
    </Modal>
  );
}

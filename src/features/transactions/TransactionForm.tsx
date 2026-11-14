import {
  SegmentedControl,
  type SegmentOption,
} from "@/components/ui/SegmentedControl";
import type { Account, TransactionType } from "@/types/api";
import { formatInputAmount } from "@/utils/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { CategoryGrid } from "./CategoryGrid";
import { DatePickerModal } from "./DatePickerModal";
import { resolveTransactionError } from "./transactionErrors";
import {
  buildCreateRequest,
  formatDateLong,
  MAX_DESCRIPTION_LENGTH,
  todayDate,
} from "./transactionRules";
import {
  defaultTransactionValues,
  transactionFormSchema,
  type TransactionFormValues,
} from "./transactionSchemas";
import { useCategories } from "./useCategories";
import { useCreateTransaction } from "./useCreateTransaction";

interface TransactionFormProps {
  // Dompet bawaan. Pemilihan dompet belum ada di UI (hanya "Tunai"; dompet tambahan: Phase 2).
  account: Account;
  onDone: () => void;
}

// Nilai dari Figma 69:2506 (pengeluaran) dan 76:3773 (pemasukan). Kelas ditulis utuh per
// jenis agar terbaca Tailwind (kelas tidak boleh dirakit dari variabel warna).
const TYPE_UI: Record<
  TransactionType,
  {
    accentColor: string;
    rpClassName: string;
    amountHint: string;
    notePlaceholder: string;
    saveLabel: string;
    successMessage: string;
  }
> = {
  expense: {
    accentColor: "#ed7658",
    rpClassName: "text-[#ed7658]",
    amountHint: "Masukkan nominal transaksi dengan jelas",
    notePlaceholder: "Contoh: Makan siang bersama tim di Senopati",
    saveLabel: "Simpan Pengeluaran",
    successMessage: "Pengeluaran tersimpan",
  },
  income: {
    accentColor: "#006c50",
    rpClassName: "text-[#006c50]",
    amountHint: "Masukkan nominal pemasukan dengan jelas",
    notePlaceholder: "Contoh: Gaji bulanan, bonus, atau pemasukan lainnya",
    saveLabel: "Simpan Pemasukan",
    successMessage: "Pemasukan tersimpan",
  },
};

// Panah lurus diputar 45° menjadi diagonal seperti di Figma (↗ keluar, ↙ masuk)
const TYPE_OPTIONS: readonly SegmentOption<TransactionType>[] = [
  {
    value: "expense",
    label: "Pengeluaran",
    icon: "arrow-up",
    iconClassName: "rotate-45",
    activeClassName: "bg-[#ed7658]",
  },
  {
    value: "income",
    label: "Pemasukan",
    icon: "arrow-down",
    iconClassName: "rotate-45",
    activeClassName: "bg-[#006c50]",
  },
];

const CARD =
  "rounded-3xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]";
const LABEL =
  "font-sans text-xs font-semibold leading-4 tracking-[0.24px] text-[#43474d]";
const VALUE = "font-sans text-sm font-semibold leading-5 text-[#121c2a]";
const BUBBLE = "h-10 w-10 items-center justify-center rounded-2xl";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text className="mt-1 font-sans text-xs leading-4 text-[#ba1a1a]">
      {message}
    </Text>
  );
}

function dateLabel(value: string): string {
  const long = formatDateLong(value);
  return value === todayDate() ? `Hari ini, ${long}` : long;
}

export function TransactionForm({ account, onDone }: TransactionFormProps) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>("expense");
  const [pickerOpen, setPickerOpen] = useState(false);
  // POST /transactions tidak idempoten: cegah ketukan ganda sebelum render ulang
  const submittingRef = useRef(false);

  const ui = TYPE_UI[type];
  const categories = useCategories(type);
  const createTransaction = useCreateTransaction();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: defaultTransactionValues(account.id),
  });

  // Kategori jenis lama tidak valid untuk jenis baru (backend menolak dengan 400)
  const handleTypeChange = (next: TransactionType) => {
    if (next === type) return;
    setType(next);
    setValue("categoryId", "");
    clearErrors("categoryId");
  };

  const onValid = async (values: TransactionFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await createTransaction.mutateAsync(
        buildCreateRequest({ type, ...values }),
      );
    } catch (error) {
      submittingRef.current = false;
      const info = resolveTransactionError(error);
      // Dompet tidak punya kolom di UI, jadi galatnya ditampilkan sebagai toast
      if (info.field && info.field !== "accountId") {
        setError(info.field, { type: "server", message: info.message });
      } else {
        toast.error(info.message);
      }
      return;
    }
    toast.success(ui.successMessage);
    onDone();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#f8f9ff]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 px-5 pb-[140px] pt-2"
      >
        <SegmentedControl
          size="lg"
          options={TYPE_OPTIONS}
          value={type}
          onChange={handleTypeChange}
          trackClassName="bg-[#dee9fc]"
          inactiveTextClassName="text-[#43474d]"
          inactiveIconColor="#43474d"
        />

        {/* Nominal */}
        <View className={CARD}>
          <Text className={`text-center ${LABEL}`}>Nominal Transaksi</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mt-1 flex-row items-center justify-center">
                <Text
                  className={`mr-1 font-sans text-xl font-bold leading-7 ${ui.rpClassName}`}
                >
                  Rp
                </Text>
                <TextInput
                  // Angka panjang mengecil agar tidak terpotong
                  className={`h-11 max-w-[224px] flex-1 p-0 text-center font-sans font-bold text-[#121c2a] ${
                    value.length > 11 ? "text-[26px]" : "text-[32px]"
                  }`}
                  value={value}
                  onChangeText={(text) => onChange(formatInputAmount(text))}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#c4c6ce"
                  // "1.000.000.000" = 13 karakter (batas backend)
                  maxLength={13}
                  accessibilityLabel="Nominal transaksi"
                />
              </View>
            )}
          />
          {errors.amount?.message ? (
            <Text className="mt-1 text-center font-sans text-xs leading-4 text-[#ba1a1a]">
              {errors.amount.message}
            </Text>
          ) : (
            <Text className="mt-1 text-center font-sans text-xs leading-4 text-[#43474d]">
              {ui.amountHint}
            </Text>
          )}
        </View>

        {/* Kategori */}
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { value, onChange } }) => (
            <CategoryGrid
              type={type}
              categories={categories.data}
              isPending={categories.isPending}
              isError={categories.isError}
              onRetry={() => void categories.refetch()}
              selectedId={value}
              onSelect={onChange}
              error={errors.categoryId?.message}
            />
          )}
        />

        {/* Tanggal dan dompet */}
        <View className={`${CARD} gap-3`}>
          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <View>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Ubah tanggal transaksi"
                  className="active:opacity-80"
                >
                  <View className="flex-row items-center gap-3 border-b border-[rgba(196,198,206,0.2)] pb-[13px]">
                    <View className={`${BUBBLE} bg-[#dee9fc]`}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#121c2a"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={LABEL}>Tanggal</Text>
                      <Text className={VALUE}>{dateLabel(value)}</Text>
                    </View>
                    <Ionicons name="create-outline" size={20} color="#43474d" />
                  </View>
                </Pressable>
                <FieldError message={errors.date?.message} />
                <DatePickerModal
                  visible={pickerOpen}
                  value={value}
                  accentColor={ui.accentColor}
                  onSelect={(date) => {
                    onChange(date);
                    setPickerOpen(false);
                  }}
                  onClose={() => setPickerOpen(false)}
                />
              </View>
            )}
          />

          {/* Saldo dompet dihilangkan: GET /accounts tidak mengembalikan saldo.
                        Chevron juga tidak ada: dompet belum bisa diganti. */}
          <View className="flex-row items-center gap-3">
            <View className={`${BUBBLE} bg-[rgba(127,249,204,0.4)]`}>
              <Ionicons name="wallet-outline" size={20} color="#006c50" />
            </View>
            <View className="flex-1">
              <Text className={LABEL}>Dompet / Sumber Dana</Text>
              <Text className={VALUE}>{account.name}</Text>
            </View>
          </View>
        </View>

        {/* Catatan */}
        <View className={CARD}>
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="reorder-three-outline" size={18} color="#43474d" />
            <Text className={LABEL}>Catatan</Text>
          </View>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="rounded-xl border border-[rgba(196,198,206,0.3)] bg-[#f8f9ff] p-[13px]">
                <TextInput
                  className="min-h-10 p-0 font-sans text-sm leading-5 text-[#121c2a]"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder={ui.notePlaceholder}
                  placeholderTextColor="#74777e"
                  textAlignVertical="top"
                  accessibilityLabel="Catatan transaksi"
                />
              </View>
            )}
          />
          <FieldError message={errors.description?.message} />
        </View>
      </ScrollView>

      {/* Panel tombol simpan. Latar putih 95% polos (tanpa blur).
                paddingBottom mengikuti inset layar (nilai runtime), jadi lewat style. */}
      <View
        className="absolute inset-x-0 bottom-0 border-t border-[rgba(196,198,206,0.3)] bg-[rgba(255,255,255,0.95)] px-5 pt-[21px]"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        {/* Pressable hanya penangkap sentuhan; warna ada di View di dalamnya */}
        <Pressable
          onPress={() => handleSubmit(onValid)()}
          disabled={createTransaction.isPending}
          accessibilityRole="button"
          accessibilityLabel={ui.saveLabel}
          accessibilityState={{ disabled: createTransaction.isPending }}
          // Opacity ada di Pressable (tanpa radius). View bersudut di dalamnya
          // dibiarkan statis: kelasnya tidak boleh berubah (lihat SegmentedControl).
          className={
            createTransaction.isPending ? "opacity-80" : "active:opacity-90"
          }
        >
          <View className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-[#006c50] shadow-lg shadow-[#006c50]/20">
            {createTransaction.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#ffffff" />
            )}
            <Text className="font-sans text-base font-semibold leading-[22px] text-white">
              {ui.saveLabel}
            </Text>
          </View>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

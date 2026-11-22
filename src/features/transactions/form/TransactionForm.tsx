import { DatePickerModal } from "@/components/ui/DatePickerModal";
import { KeyboardScreen } from "@/components/ui/KeyboardScreen";
import {
  SegmentedControl,
  type SegmentOption,
} from "@/components/ui/SegmentedControl";
import { useKeyboardAwareScreen } from "@/hooks/useKeyboardAwareScreen";
import type { Account, TransactionType } from "@/types/api";
import { formatInputAmount } from "@/utils/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type ViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import {
  buildCreateRequest,
  earliestAllowedDate,
  formatDateLong,
  MAX_DESCRIPTION_LENGTH,
  todayDate,
} from "../transactionRules";
import { useCategories } from "../useCategories";
import { CategoryGrid } from "./CategoryGrid";
import { resolveTransactionError } from "./transactionErrors";
import {
  FieldError,
  ValidationSummary,
  firstErrorName,
  hasFieldError,
} from "./TransactionFormErrors";
import {
  defaultTransactionValues,
  transactionFormSchema,
  type TransactionFormValues,
} from "./transactionSchemas";
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

const CARD = "rounded-3xl border bg-white p-[17px]";
const BORDER_NORMAL = "border-[rgba(196,198,206,0.3)]";
const BORDER_ERROR = "border-[#ba1a1a]";
const LABEL =
  "font-sans text-xs font-semibold leading-4 tracking-[0.24px] text-[#43474d]";
const VALUE = "font-sans text-sm font-semibold leading-5 text-[#121c2a]";
const BUBBLE = "h-10 w-10 items-center justify-center rounded-2xl";

function dateLabel(value: string): string {
  const long = formatDateLong(value);
  return value === todayDate() ? `Hari ini, ${long}` : long;
}

export function TransactionForm({ account, onDone }: TransactionFormProps) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>("expense");
  const [pickerOpen, setPickerOpen] = useState(false);
  // Banner ringkasan hanya muncul setelah pengguna mencoba menyimpan
  const [submitAttempted, setSubmitAttempted] = useState(false);
  // POST /transactions tidak idempoten: cegah ketukan ganda sebelum render ulang
  const submittingRef = useRef(false);
  // Ref kartu non-input supaya banner bisa menggulir ke kolom yang error
  const categoryCardRef = useRef<ViewInstance>(null);
  const dateCardRef = useRef<ViewInstance>(null);
  // Status keyboard dipakai footer untuk mengatur jarak tombol; scrollRef tetap
  // dipakai handler "gulir ke Catatan" seperti sebelumnya.
  const { scrollRef, keyboardVisible } = useKeyboardAwareScreen();
  // Ref (bukan state): hanya dibaca di handler layout, tidak memengaruhi render
  const noteFocusedRef = useRef(false);

  const ui = TYPE_UI[type];
  const categories = useCategories(type);
  const createTransaction = useCreateTransaction();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    clearErrors,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: defaultTransactionValues(account.id),
  });

  // Fokus ke input teks atau gulir ke kartu non-input yang pertama kali error
  const focusOrScrollToError = useCallback(() => {
    const name = firstErrorName(errors);
    if (!name) return;
    if (name === "amount" || name === "description") {
      setFocus(name);
      return;
    }
    const target =
      name === "categoryId" ? categoryCardRef.current : dateCardRef.current;
    target?.measure((_x, y) => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
    });
  }, [errors, setFocus, scrollRef]);

  const handleInvalid = useCallback(() => {
    setSubmitAttempted(true);
    // Beri waktu render ulang sebelum mengukur/fokus
    setTimeout(focusOrScrollToError, 50);
  }, [focusOrScrollToError]);

  // Kategori jenis lama tidak valid untuk jenis baru (backend menolak dengan 400)
  const handleTypeChange = (next: TransactionType) => {
    if (next === type) return;
    setType(next);
    setValue("categoryId", "");
    clearErrors("categoryId");
  };

  // Catatan adalah kartu terakhir, jadi gulir ke dasar menampilkannya di atas panel Simpan.
  // Dipanggil saat fokus, saat area gulir menyusut (keyboard muncul), dan saat isi
  // bertambah (multiline), karena fokus saja terjadi sebelum keyboard memadatkan layout.
  const scrollNoteIntoView = () => {
    if (noteFocusedRef.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
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
    setSubmitAttempted(false);
    toast.success(ui.successMessage);
    onDone();
  };

  return (
    <KeyboardScreen
      scrollRef={scrollRef}
      className="bg-[#f8f9ff]"
      // Footer kini bagian layout (bukan absolute), jadi tidak perlu ruang cadangan 140px
      contentContainerClassName="gap-4 px-5 pb-6 pt-2"
      onLayout={scrollNoteIntoView}
      onContentSizeChange={scrollNoteIntoView}
      footer={
        // Panel tombol simpan. Latar putih 95% polos (tanpa blur).
        // paddingBottom mengikuti inset layar (nilai runtime), jadi lewat style.
        <View
          className="border-t border-[rgba(196,198,206,0.3)] bg-[rgba(255,255,255,0.95)] px-5 pt-[21px]"
          style={{
            paddingBottom: keyboardVisible
              ? 12
              : Math.max(insets.bottom, 24) + 8,
          }}
        >
          {submitAttempted ? (
            <ValidationSummary errors={errors} onPress={focusOrScrollToError} />
          ) : null}
          {/* Pressable hanya penangkap sentuhan; warna ada di View di dalamnya */}
          <Pressable
            onPress={() => handleSubmit(onValid, handleInvalid)()}
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
            <View className="h-[54px] flex-row items-center justify-center rounded-2xl bg-[#006c50] shadow-lg shadow-[#006c50]/20">
              {createTransaction.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-sans text-base font-semibold leading-[22px] text-white">
                  {ui.saveLabel}
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      }
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
      <View
        className={`${CARD} ${
          hasFieldError(errors, "amount") ? BORDER_ERROR : BORDER_NORMAL
        }`}
      >
        <Text className={`text-center ${LABEL}`}>Nominal Transaksi</Text>
        <Controller
          control={control}
          name="amount"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View className="relative mt-4 h-11 w-full items-center justify-center">
              <Text
                className={`absolute left-3 font-sans text-3xl font-bold ${ui.rpClassName}`}
              >
                Rp
              </Text>
              <TextInput
                ref={ref}
                // Angka panjang mengecil agar tidak terpotong
                className={`h-11 w-full p-0 text-center font-sans font-bold text-[#121c2a] ${
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
                aria-invalid={hasFieldError(errors, "amount")}
              />
            </View>
          )}
        />
        {errors.amount?.message ? (
          <FieldError
            className="mt-2 justify-center"
            message={errors.amount.message}
          />
        ) : (
          <Text className="mt-2 text-center font-sans text-xs leading-4 text-[#43474d]">
            {ui.amountHint}
          </Text>
        )}
      </View>

      {/* Kategori */}
      <View ref={categoryCardRef}>
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
      </View>

      {/* Tanggal dan dompet */}
      <View
        ref={dateCardRef}
        className={`${CARD} gap-3 ${
          hasFieldError(errors, "date") ? BORDER_ERROR : BORDER_NORMAL
        }`}
      >
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
              <FieldError
                message={errors.date?.message}
                className="mt-0"
              />
              <DatePickerModal
                visible={pickerOpen}
                value={value}
                minDate={earliestAllowedDate()}
                maxDate={todayDate()}
                accentColor={ui.accentColor}
                onSelect={onChange}
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
      <View
        className={`${CARD} ${
          hasFieldError(errors, "description") ? BORDER_ERROR : BORDER_NORMAL
        }`}
      >
        <View className="mb-2 flex-row items-center gap-2">
          <Ionicons name="reorder-three-outline" size={18} color="#43474d" />
          <Text className={LABEL}>Catatan</Text>
        </View>
        <Controller
          control={control}
          name="description"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View className="rounded-xl border border-[rgba(196,198,206,0.3)] bg-[#f8f9ff] p-[13px]">
              <TextInput
                ref={ref}
                className="min-h-10 p-0 font-sans text-sm leading-5 text-[#121c2a]"
                value={value}
                onChangeText={onChange}
                onFocus={() => {
                  noteFocusedRef.current = true;
                  scrollNoteIntoView();
                }}
                onBlur={() => {
                  noteFocusedRef.current = false;
                  onBlur();
                }}
                multiline
                maxLength={MAX_DESCRIPTION_LENGTH}
                placeholder={ui.notePlaceholder}
                placeholderTextColor="#74777e"
                textAlignVertical="top"
                accessibilityLabel="Catatan transaksi"
                aria-invalid={hasFieldError(errors, "description")}
              />
            </View>
          )}
        />
        <FieldError message={errors.description?.message} />
      </View>
    </KeyboardScreen>
  );
}

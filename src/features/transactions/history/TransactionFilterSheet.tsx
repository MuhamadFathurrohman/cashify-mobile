import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FilterDateRange } from "@/features/transactions/history/filter/FilterDateRange";
import {
  FilterAccountGroup,
  FilterCategoryGroup,
  FilterSection,
  FilterSourceGroup,
} from "@/features/transactions/history/filter/FilterFields";
import { useAccounts } from "@/features/transactions/useAccounts";
import { useCategories } from "@/features/transactions/useCategories";
import type {
  Account,
  Category,
  TransactionListParams,
  TransactionSource,
  TransactionType,
} from "@/types/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  // Menghapus filter yang berlaku saat ini (dipakai tombol Reset di sheet)
  onReset: () => void;
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
] as const;

type TypeOption = "all" | TransactionType;

// Porsi maksimum tinggi layar yang dipakai sheet; sisanya tetap terlihat di atas
const SHEET_MAX_RATIO = 0.72;
const OPEN_DURATION = 280;
const CLOSE_DURATION = 220;
// Ambang tutup saat handle digeser: 25% tinggi sheet atau lemparan cepat
const CLOSE_THRESHOLD = 0.25;
const CLOSE_VELOCITY = 0.5;

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

// 1 = sheet di luar layar (tertutup), 0 = sheet penuh terbuka.
// Satu nilai menggerakkan slide sheet sekaligus memudarkan backdrop agar
// keduanya selalu bergerak bersamaan.
//
// Sheet sengaja BUKAN Modal: overlay-nya hidup di dalam layar History, yang
// areanya berhenti tepat di atas BottomTabBar. Akibatnya tab bar tetap terlihat
// dan tetap bisa ditekan saat sheet terbuka.
export function TransactionFilterSheet({
  visible,
  activeFilters,
  activeType,
  onApply,
  onReset,
  onClose,
}: TransactionFilterSheetProps) {
  const [progress] = useState(() => new Animated.Value(1));
  // Tinggi area layar yang benar-benar tersedia (di atas tab bar), diukur lewat
  // onLayout supaya tidak perlu menebak tinggi tab bar. onLayout hanya terpicu
  // saat layar ini dipasang/berubah ukuran, jauh sebelum sheet bisa dibuka.
  const [availableHeight, setAvailableHeight] = useState(0);
  const sheetHeight = Math.round(availableHeight * SHEET_MAX_RATIO);

  // Kategori dan akun diambil sejak layar ini dipasang, bukan saat sheet dibuka,
  // supaya chip sudah siap ketika pengguna menekan tombol filter. Cache react-query
  // (stale 30 menit) membuat pembukaan berikutnya tidak memicu permintaan baru.
  const { data: incomeCategories, isPending: incomePending } =
    useCategories("income");
  const { data: expenseCategories, isPending: expensePending } =
    useCategories("expense");
  const { data: accountsData, isPending: accountsPending } = useAccounts();

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sheetHeight],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  // Animasi masuk. Animasi keluar dijalankan oleh requestClose, bukan di sini,
  // supaya sheet tetap terpasang selama bergerak turun.
  useEffect(() => {
    if (!visible) return;

    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: OPEN_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  const requestClose = useCallback(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: CLOSE_DURATION,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClose());
  }, [progress, onClose]);

  // Tombol back Android menutup sheet, bukan meninggalkan layar
  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        requestClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [visible, requestClose]);

  const snapBack = useCallback(() => {
    Animated.spring(progress, {
      toValue: 0,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  // Geser handle ke bawah untuk menutup. Nilai `progress` dipakai langsung
  // sebagai posisi sheet, jadi backdrop ikut memudar selama jari bergerak.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Hanya ambil alih gestur vertikal ke bawah; gestur lain dibiarkan
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) => {
          progress.setValue(clampProgress(gesture.dy / (sheetHeight || 1)));
        },
        onPanResponderRelease: (_event, gesture) => {
          const dragged = gesture.dy / (sheetHeight || 1);
          if (dragged > CLOSE_THRESHOLD || gesture.vy > CLOSE_VELOCITY) {
            requestClose();
          } else {
            snapBack();
          }
        },
        // Gestur direbut sistem (misal notifikasi) — kembalikan ke posisi terbuka
        onPanResponderTerminate: snapBack,
      }),
    [progress, requestClose, snapBack, sheetHeight],
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
      // Saat tertutup, overlay tidak boleh menghalangi sentuhan ke daftar
      pointerEvents={visible ? "box-none" : "none"}
      onLayout={(event) =>
        setAvailableHeight(event.nativeEvent.layout.height)
      }
    >
      {visible ? (
        <>
          {/* Backdrop — menutup sheet saat ditekan, ikut memudar */}
          <Pressable onPress={requestClose} style={StyleSheet.absoluteFill}>
            <Animated.View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.4)",
                opacity: backdropOpacity,
              }}
            />
          </Pressable>

          {/* Sheet */}
          <Animated.View
            style={{
              transform: [{ translateY }],
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: sheetHeight,
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
            }}
          >
            {/* Handle bar — area geser untuk menutup sheet (tutup juga lewat
                tombol, backdrop, dan tombol back Android) */}
            <View
              {...panResponder.panHandlers}
              className="items-center justify-center"
              style={{ height: 32 }}
            >
              <View className="h-1 w-10 rounded-full bg-[rgba(196,198,206,0.8)]" />
            </View>

            {/* Body hanya terpasang selama sheet terbuka, sehingga draft selalu
                diisi ulang dari filter aktif saat dibuka tanpa effect sinkronisasi */}
            <FilterSheetBody
              activeFilters={activeFilters}
              activeType={activeType}
              expenseCategories={expenseCategories ?? []}
              incomeCategories={incomeCategories ?? []}
              accounts={accountsData ?? []}
              categoriesLoading={incomePending || expensePending}
              accountsLoading={accountsPending}
              onApply={onApply}
              onReset={onReset}
              onRequestClose={requestClose}
            />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

interface FilterSheetBodyProps {
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
function FilterSheetBody({
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
  // Draft state — perubahan di sini belum diterapkan sampai Apply ditekan
  const [draftFrom, setDraftFrom] = useState<string>(activeFilters.from ?? "");
  const [draftTo, setDraftTo] = useState<string>(activeFilters.to ?? "");
  const [draftType, setDraftType] = useState<TypeOption>(
    activeType ?? "all",
  );
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
        className="flex-row gap-3 px-5 pb-5 pt-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: "rgba(196,198,206,0.3)",
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

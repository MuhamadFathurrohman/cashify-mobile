import { FilterSheetBody } from "@/features/transactions/history/filter/FilterSheetBody";
import { useAccounts } from "@/features/transactions/useAccounts";
import { useCategories } from "@/features/transactions/useCategories";
import type { TransactionListParams, TransactionType } from "@/types/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

// Porsi maksimum tinggi jendela yang dipakai sheet; sisanya jadi area backdrop
const SHEET_MAX_RATIO = 0.72;
const OPEN_DURATION = 280;
const CLOSE_DURATION = 220;
// Ambang tutup saat handle digeser: setengah tinggi sheet atau lemparan cepat
const CLOSE_THRESHOLD = 0.5;
const CLOSE_VELOCITY = 0.5;

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

// 1 = sheet di luar layar (tertutup), 0 = sheet penuh terbuka.
// Satu nilai menggerakkan slide sheet sekaligus memudarkan backdrop agar
// keduanya selalu bergerak bersamaan.
//
// Sheet memakai Modal penuh supaya menutupi BottomTabBar yang dilukis navigator
// di atas subtree layar. Gestur handle tetap memakai PanResponder seperti lama.
export function TransactionFilterSheet({
  visible,
  activeFilters,
  activeType,
  onApply,
  onReset,
  onClose,
}: TransactionFilterSheetProps) {
  const [progress] = useState(() => new Animated.Value(1));
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * SHEET_MAX_RATIO);

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
        // Klaim responder sejak touch dimulai supaya backdrop/ScrollView tidak
        // merebut gestur sebelum jari sempat bergerak.
        onStartShouldSetPanResponderCapture: () => true,
        onStartShouldSetPanResponder: () => true,
        // Hanya ambil alih gestur vertikal ke bawah; gestur lain dibiarkan
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={requestClose}
    >
      {/* Modal adalah root native terpisah: butuh provider sendiri agar
          useSafeAreaInsets() di FilterSheetBody menerima bottom inset yang benar */}
      <SafeAreaProvider style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
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
      </SafeAreaProvider>
    </Modal>
  );
}


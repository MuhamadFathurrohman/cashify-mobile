import type { MonthOption } from "@/utils/monthOptions";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface MonthPickerSheetProps {
  visible: boolean;
  months: MonthOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const OPEN_DURATION = 260;
const CLOSE_DURATION = 200;
const ROW_HEIGHT = 64;
const MAX_RATIO = 0.6;

interface SheetBodyProps extends MonthPickerSheetProps {
  sheetHeight: number;
  requestClose: () => void;
}

function SheetBody({
  months,
  selectedId,
  onSelect,
  sheetHeight,
  requestClose,
}: SheetBodyProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white"
      style={{
        height: sheetHeight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <View className="items-center justify-center" style={{ height: 24 }}>
        <View className="h-1 w-10 rounded-full bg-[rgba(196,198,206,0.8)]" />
      </View>

      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Text className="font-sans text-base font-semibold leading-[22px] text-[#121c2a]">
          Pilih Bulan
        </Text>
        <Pressable
          onPress={requestClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Tutup pemilih bulan"
          className="h-9 w-9 items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#43474d" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {months.map((month) => {
          const selected = month.id === selectedId;
          return (
            <Pressable
              key={month.id}
              onPress={() => {
                onSelect(month.id);
                requestClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${month.monthLabel}, ${month.rangeLabel}${month.isActive ? ", periode aktif" : ""}`}
              accessibilityState={{ selected }}
              android_ripple={{ color: "rgba(0,0,0,0.04)" }}
              className="flex-row items-center justify-between rounded-xl px-3"
              style={{ height: ROW_HEIGHT }}
            >
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text
                    className={`font-sans text-sm leading-5 ${
                      selected
                        ? "font-semibold text-[#006c50]"
                        : "font-semibold text-[#121c2a]"
                    }`}
                  >
                    {month.monthLabel}
                  </Text>
                  {month.isActive ? (
                    <View className="rounded-full bg-[rgba(0,108,80,0.1)] px-2 py-[2px]">
                      <Text className="font-sans text-[10px] font-semibold leading-[14px] text-[#006c50]">
                        Aktif
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="font-sans text-xs leading-4 text-[#43474d]">
                  {month.rangeLabel}
                </Text>
              </View>
              {selected ? (
                <Ionicons name="checkmark-circle" size={20} color="#006c50" />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Bottom sheet pemilih bulan untuk tab Analisis. Daftar bulan berasal dari
// pemanggil (anggaran: backend; laporan: 12 bulan terakhir di klien).
export function MonthPickerSheet({
  visible,
  months,
  selectedId,
  onSelect,
  onClose,
}: MonthPickerSheetProps) {
  const [progress] = useState(() => new Animated.Value(1));
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.min(
    Math.round(windowHeight * MAX_RATIO),
    ROW_HEIGHT * Math.max(months.length, 1) + 92,
  );

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sheetHeight],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={requestClose}
    >
      {/* Modal adalah root native terpisah: butuh provider sendiri agar inset bawah benar */}
      <SafeAreaProvider style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
          {visible ? (
            <>
              <Pressable onPress={requestClose} style={StyleSheet.absoluteFill}>
                <Animated.View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    opacity: backdropOpacity,
                  }}
                />
              </Pressable>

              <Animated.View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  transform: [{ translateY }],
                }}
              >
                <SheetBody
                  visible
                  months={months}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onClose={onClose}
                  sheetHeight={sheetHeight}
                  requestClose={requestClose}
                />
              </Animated.View>
            </>
          ) : null}
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

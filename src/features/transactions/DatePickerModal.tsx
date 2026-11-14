import "dayjs/locale/id";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import {
    earliestAllowedDate,
    pickerValueToDateString,
    todayDate,
} from "./transactionRules";

interface DatePickerModalProps {
  visible: boolean;
  // "YYYY-MM-DD"
  value: string;
  // Warna aksen hex untuk hari terpilih. Pustaka menerima objek `styles` (API-nya sendiri),
  // bukan kelas Tailwind dari kita, jadi warna ini diteruskan sebagai nilai.
  accentColor: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

// Pemilih tanggal dalam Modal (Figma tidak merancangnya, jadi memakai warna form).
// Hanya tanggal: jam tidak dipilih karena backend hanya menerima `date`.
// Batas min/max berupa string "YYYY-MM-DD" (stabil antar-render) dan memakai aturan
// yang sama dengan validasi form. Prop `timeZone` sengaja tidak dipakai: pustaka
// membaca tanggal lokal perangkat, dan hasilnya dibaca kembali dengan komponen lokal.
export function DatePickerModal({
  visible,
  value,
  accentColor,
  onSelect,
  onClose,
}: DatePickerModalProps) {
  const insets = useSafeAreaInsets();
  const defaultStyles = useDefaultStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup pemilih tanggal"
          onPress={onClose}
          className="absolute inset-0"
        >
          <View className="flex-1 bg-[rgba(18,28,42,0.4)]" />
        </Pressable>
        {/* paddingBottom mengikuti inset layar (nilai runtime), jadi lewat style */}
        <View
          className="rounded-t-3xl bg-white px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <Text className="mb-3 font-sans text-base font-semibold leading-[22px] text-[#121c2a]">
            Pilih Tanggal
          </Text>
          <DateTimePicker
            mode="single"
            date={value}
            minDate={earliestAllowedDate()}
            maxDate={todayDate()}
            locale="id"
            firstDayOfWeek={1}
            onChange={({ date }) => {
              const picked = pickerValueToDateString(date);
              if (picked) onSelect(picked);
            }}
            styles={{
              ...defaultStyles,
              today: { borderColor: accentColor, borderWidth: 1 },
              selected: { backgroundColor: accentColor },
              selected_label: { color: "#ffffff" },
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

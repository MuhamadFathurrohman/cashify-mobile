import "dayjs/locale/id";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

// Nilai `date`/`startDate`/`endDate` dari pustaka (Date, string ISO, angka, atau
// objek Dayjs) -> "YYYY-MM-DD". Dibaca dengan komponen tanggal LOKAL perangkat
// karena kalender menampilkan hari lokal; itu yang dipilih pengguna, apa pun zona
// waktu perangkat. String "YYYY-MM-DD" dikembalikan apa adanya agar tidak
// bergeser sehari (string tanggal saja dibaca sebagai UTC oleh Date).
function toDateString(value: unknown): string | null {
  if (typeof value === "string" && DATE_PATTERN.test(value)) {
    return value;
  }

  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    date = (value as { toDate: () => Date }).toDate();
  }
  if (!date || Number.isNaN(date.getTime())) return null;

  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

interface DatePickerBaseProps {
  visible: boolean;
  // Batas bawah "YYYY-MM-DD". Kosongkan untuk pemakaian yang tidak membatasi
  // tanggal lama (mis. filter riwayat); form transaksi memakai aturan 1 tahun.
  minDate?: string;
  // Batas atas "YYYY-MM-DD"
  maxDate?: string;
  // Warna aksen hex untuk hari terpilih. Pustaka menerima objek `styles` (API-nya
  // sendiri), bukan kelas Tailwind, jadi warna ini diteruskan sebagai nilai.
  accentColor: string;
  onClose: () => void;
}

interface SingleDatePickerProps extends DatePickerBaseProps {
  mode?: "single";
  // "YYYY-MM-DD"
  value: string;
  onSelect: (date: string) => void;
}

interface RangeDatePickerProps extends DatePickerBaseProps {
  mode: "range";
  // Keduanya "YYYY-MM-DD" atau string kosong
  startDate: string;
  endDate: string;
  // Dipanggil setiap kali rentang berubah; salah satu bisa kosong saat pengguna
  // baru memilih tanggal awal
  onChangeRange: (range: { start: string; end: string }) => void;
}

type DatePickerModalProps = SingleDatePickerProps | RangeDatePickerProps;

// Pemilih tanggal bersama untuk form transaksi (satu tanggal) dan filter riwayat
// (rentang). Hanya tanggal: jam tidak dipilih karena backend hanya menerima `date`.
// Prop `timeZone` sengaja tidak dipakai: pustaka membaca tanggal lokal perangkat,
// dan hasilnya dibaca kembali dengan komponen lokal.
export function DatePickerModal(props: DatePickerModalProps) {
  const { visible, minDate, maxDate, accentColor, onClose } = props;
  const insets = useSafeAreaInsets();
  const defaultStyles = useDefaultStyles();

  const styles = {
    ...defaultStyles,
    today: { borderColor: accentColor, borderWidth: 1 },
    selected: { backgroundColor: accentColor },
    selected_label: { color: "#ffffff" },
    range_start: { backgroundColor: accentColor },
    range_start_label: { color: "#ffffff" },
    range_end: { backgroundColor: accentColor },
    range_end_label: { color: "#ffffff" },
  };

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
            {props.mode === "range" ? "Pilih Rentang Tanggal" : "Pilih Tanggal"}
          </Text>

          {props.mode === "range" ? (
            <DateTimePicker
              mode="range"
              // String kosong bukan nilai yang valid bagi pustaka
              startDate={props.startDate || null}
              endDate={props.endDate || null}
              minDate={minDate}
              maxDate={maxDate}
              locale="id"
              firstDayOfWeek={1}
              onChange={({ startDate, endDate }) => {
                const start = toDateString(startDate);
                const end = toDateString(endDate);
                // Urutan ketukan bisa terbalik; kirim selalu dari tanggal lebih awal
                const [from, to] =
                  start && end && start > end ? [end, start] : [start, end];

                props.onChangeRange({ start: from ?? "", end: to ?? "" });
                // Rentang dianggap selesai setelah tanggal akhir dipilih
                if (from && to) onClose();
              }}
              styles={styles}
            />
          ) : (
            <DateTimePicker
              mode="single"
              date={props.value}
              minDate={minDate}
              maxDate={maxDate}
              locale="id"
              firstDayOfWeek={1}
              onChange={({ date }) => {
                const picked = toDateString(date);
                if (picked) {
                  props.onSelect(picked);
                  onClose();
                }
              }}
              styles={styles}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

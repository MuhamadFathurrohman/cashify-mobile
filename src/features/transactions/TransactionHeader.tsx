import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TransactionHeaderProps {
  title: string;
  // Opsional: layar yang tidak butuh keterangan tambahan boleh mengosongkannya.
  subtitle?: string;
  onClose: () => void;
  // "close" untuk layar yang dibuka dari bawah (form), "back" untuk layar yang
  // di-push dari daftar (detail dan ubah transaksi).
  leadingIcon?: "close" | "back";
}

const LEADING = {
  close: { icon: "close", label: "Tutup" },
  back: { icon: "chevron-back", label: "Kembali" },
} as const;

// Header layar transaksi (Figma 69:2506): ikon kiri, judul + subjudul di tengah.
// Komponen ini tidak menyimpan teks apa pun: judul dan subjudul ditentukan oleh layar
// yang mengimpornya supaya bisa dipakai ulang oleh tambah, detail, dan ubah transaksi.
// Spacer 40px di kanan menjaga judul tetap di tengah. Status bar 12px di Figma diganti
// inset safe area (nilai runtime, jadi lewat style seperti HomeHeader).
export function TransactionHeader({
  title,
  subtitle,
  onClose,
  leadingIcon = "close",
}: TransactionHeaderProps) {
  const insets = useSafeAreaInsets();
  const leading = LEADING[leadingIcon];

  return (
    <View
      className="bg-[#f8f9ff] px-5 pb-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={leading.label}
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name={leading.icon} size={22} color="#121c2a" />
        </Pressable>

        <View className="items-center">
          <Text
            numberOfLines={1}
            className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              className="font-sans text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#43474d]"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="h-10 w-10" />
      </View>
    </View>
  );
}

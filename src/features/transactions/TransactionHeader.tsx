import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TransactionHeaderProps {
  onClose: () => void;
}

// Header kustom (Figma 69:2506): X di kiri, judul + subjudul di tengah.
// Ikon bantuan (?) di kanan disembunyikan (belum ada fungsinya); spacer 40px
// menjaga judul tetap di tengah. Status bar 12px di Figma diganti inset safe area
// (nilai runtime, jadi lewat style seperti HomeHeader).
export function TransactionHeader({ onClose }: TransactionHeaderProps) {
  const insets = useSafeAreaInsets();

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
          accessibilityLabel="Tutup"
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name="close" size={22} color="#121c2a" />
        </Pressable>

        <View className="items-center">
          <Text className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]">
            Tambah Transaksi
          </Text>
          <Text className="font-sans text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#43474d]">
            Catat alur kas harian • Cashify
          </Text>
        </View>

        <View className="h-10 w-10" />
      </View>
    </View>
  );
}

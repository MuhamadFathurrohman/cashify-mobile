import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Bilah atas tetap. Lonceng notifikasi disembunyikan (keputusan 6: belum ada modul notifikasi).
// ⚠️ Sementara: logo asli (logo-cashify-icon dan logo-text-cashify dari Figma) belum dipakai;
// ikon dan teks di bawah adalah pengganti sampai aset logo proyek dihubungkan.
export function HomeHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-b border-[rgba(196,198,206,0.25)] bg-[#f8f9ff] px-5 pb-[14px]"
      style={{ paddingTop: insets.top + 14 }}
    >
      <View className="flex-row items-center" style={{ height: 41 }}>
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#006c50" }}
        >
          <Ionicons name="wallet" size={22} color="#ffffff" />
        </View>
        <Text className="ml-2 text-xl font-bold tracking-[-0.4px] text-[#006c50]">
          Cashify
        </Text>
      </View>
    </View>
  );
}

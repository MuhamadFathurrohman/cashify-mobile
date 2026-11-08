import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

// Kartu galat yang bisa dipakai ulang (Skenario B: gagal memuat data saat sesi berjalan).
// Warna tombol lewat style karena class warna pada Pressable tidak diterapkan di proyek ini;
// latar tombol saat memuat tetap solid (aturan 14).
export function ErrorState({
  title = "Gagal memuat data",
  message,
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  return (
    <View className="items-center rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white px-6 py-8">
      <View
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(237,118,88,0.1)" }}
      >
        <Ionicons name="cloud-offline-outline" size={26} color="#ed7658" />
      </View>
      <Text className="mt-4 text-center text-base font-semibold text-[#121c2a]">
        {title}
      </Text>
      <Text className="mt-1 text-center text-sm leading-5 text-[#43474d]">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="Coba lagi"
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
        className="mt-5 rounded-full px-6 py-[10px]"
        style={{ backgroundColor: retrying ? "#7aa89c" : "#006c50" }}
      >
        <Text className="text-sm font-semibold text-white">
          {retrying ? "Memuat…" : "Coba Lagi"}
        </Text>
      </Pressable>
    </View>
  );
}

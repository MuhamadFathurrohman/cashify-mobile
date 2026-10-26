import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { useAuthStore } from "@/features/auth/authStore";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function UnavailableScreen() {
  const setLoading = useAuthStore((s) => s.setLoading);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // setLoading memicu bootstrap ulang di useSessionGuard.
    // Bila berhasil, guard akan redirect otomatis ke rute yang sesuai.
    // Bila gagal lagi, status kembali ke "unavailable" dan layar ini muncul kembali.
    // isRetrying tidak perlu direset manual — komponen akan unmount saat redirect.
    setLoading();
  };

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <AmbientBlob
        color="green"
        className="right-[-80px] top-[-96px] w-[288px] h-[288px]"
      />
      <AmbientBlob
        color="blue"
        className="left-[-80px] bottom-[-96px] w-[288px] h-[288px]"
      />

      {/* Konten tengah */}
      <View className="flex-1 items-center justify-center px-5">
        <View
          className="w-full rounded-[28px] bg-white border border-[rgba(196,198,206,0.3)] p-[32px] items-center gap-5"
          style={{
            shadowColor: "#19324d",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 3,
          }}
        >
          {/* Ikon */}
          <View className="w-[80px] h-[80px] rounded-full bg-[rgba(0,108,80,0.08)] items-center justify-center">
            <Ionicons name="wifi-outline" size={40} color="#006c50" />
          </View>

          {/* Teks */}
          <View className="w-full items-center gap-2">
            <Text className="text-[#001d37] text-[20px] font-semibold leading-[26px] tracking-[-0.3px] text-center">
              Tidak Ada Koneksi
            </Text>
            <Text className="text-[#43474d] text-[12px] font-normal leading-[18px] text-center">
              Periksa koneksi internetmu dan coba lagi.
            </Text>
          </View>

          {/* Tombol */}
          <TouchableOpacity
            className="w-full h-[54px] rounded-[16px] items-center justify-center bg-[#006c50]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
            }}
            onPress={handleRetry}
            disabled={isRetrying}
            activeOpacity={0.85}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white text-[16px] font-semibold tracking-[-0.16px] leading-[22px]">
                Coba Lagi
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

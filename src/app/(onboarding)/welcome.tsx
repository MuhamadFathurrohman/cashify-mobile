import { useLogout } from "@/features/auth/useAuth";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  const { mutate: logout, isPending } = useLogout();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-gray-800">
        Selamat Datang
      </Text>
      <Text className="text-sm text-gray-400 mt-1">
        Onboarding Step 1 — belum diimplementasi
      </Text>

      {/* SEMENTARA: tombol keluar untuk uji alur auth, hapus saat onboarding dibuat */}
      <TouchableOpacity
        className={`mt-6 h-[44px] min-w-[140px] items-center justify-center rounded-[14px] px-6 ${
          isPending ? "bg-[#006c50]/70" : "bg-[#006c50]"
        }`}
        onPress={() => logout()}
        disabled={isPending}
        activeOpacity={0.85}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-[14px] font-semibold text-white">Keluar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

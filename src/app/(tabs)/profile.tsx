import { ComingSoon } from "@/components/ui/ComingSoon";
import { useLogout } from "@/features/auth/useAuth";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { mutate: logout, isPending } = useLogout();

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <ComingSoon
        icon="person-outline"
        title="Profil"
        description="Pengaturan profil segera hadir."
      />

      {/* Sementara: untuk berganti akun saat pengujian. Diganti saat layar Profil didesain */}
      <View className="px-5 pb-6">
        <TouchableOpacity
          className="h-[50px] w-full items-center justify-center rounded-[16px] border border-[#f87171] bg-white"
          onPress={() => logout()}
          disabled={isPending}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#f87171" />
          ) : (
            <Text className="text-[16px] font-semibold leading-[24px] text-[#f87171]">
              Keluar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

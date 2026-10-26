import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { notify } from "@/components/ui/notify";
import { useRegisterFlow } from "@/features/auth/RegisterContext";
import { useCompleteRegistration } from "@/features/auth/useAuth";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function RegisterSuccessScreen() {
  const router = useRouter();
  const { result } = useRegisterFlow();
  const { mutate: complete, isPending, isSuccess } = useCompleteRegistration();

  // Animasi masuk ikon (scale + fade)
  const iconScale = useSharedValue(0.85);
  const iconOpacity = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  useEffect(() => {
    iconScale.value = withTiming(1, { duration: 350 });
    iconOpacity.value = withTiming(1, { duration: 350 });
  }, [iconScale, iconOpacity]);

  // Akun sudah dibuat; kembali ke langkah sebelumnya akan menghasilkan 409
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => true,
      );
      return () => subscription.remove();
    }, []),
  );

  // Tanpa sesi di konteks (mis. state hilang), pengguna cukup masuk manual
  useEffect(() => {
    if (!result) router.replace("/(auth)/login");
  }, [result, router]);

  if (!result) return null;

  const firstName = result.user.full_name.trim().split(/\s+/)[0];
  // Cegah ketukan ganda; setelah sukses guard segera berpindah layar
  const isBusy = isPending || isSuccess;

  const handleContinue = () => {
    complete(result, {
      onError: () => {
        notify.error(
          "Gagal Melanjutkan",
          "Sesi tidak dapat disimpan. Coba lagi.",
        );
      },
    });
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

      <View className="flex-1 px-5 pt-14 pb-4">
        {/* ── Kartu sukses ── */}
        <View className="flex-1 justify-center">
          <View
            className="w-full items-center rounded-[28px] bg-white px-7 pt-7 pb-7"
            style={{
              shadowColor: "#001d37",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.06,
              shadowRadius: 20,
              elevation: 4,
            }}
          >
            <Animated.View
              style={iconStyle}
              className="h-[112px] w-[112px] items-center justify-center rounded-full bg-[rgba(127,249,204,0.25)]"
            >
              <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-[#006c50]">
                <Ionicons name="checkmark" size={40} color="#ffffff" />
              </View>
            </Animated.View>

            <View className="items-center pt-[19px] pb-2">
              <Text
                accessibilityRole="header"
                className="text-[#001d37] text-[22px] font-bold leading-[27.5px] text-center"
              >
                Akun Berhasil Dibuat!
              </Text>
            </View>

            <Text className="text-[#43474d] text-[13px] font-normal leading-[21px] text-center">
              Selamat datang di Cashify,{" "}
              <Text className="text-[#001d37] font-semibold">{firstName}</Text>.
              Kamu akan otomatis masuk ke akunmu. Lanjutkan untuk mengatur
              keuanganmu.
            </Text>

            <TouchableOpacity
              className="mt-5 h-[54px] rounded-[16px] flex-row gap-2 items-center justify-center bg-[#006c50]"
              style={{
                shadowColor: "#006c50",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.22,
                shadowRadius: 10,
                elevation: 4,
              }}
              onPress={handleContinue}
              disabled={isBusy}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text className="text-white text-[16px] font-semibold tracking-[-0.16px] leading-[22px]">
                    Lanjutkan
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Catatan keamanan ── */}
        <View className="w-full flex-row items-center justify-center gap-[6px] pt-4 pb-2">
          <Ionicons
            name="shield-checkmark-outline"
            size={12}
            color="rgba(116,119,126,0.8)"
          />
          <Text className="text-[rgba(116,119,126,0.8)] text-[11px] font-normal leading-[16.5px]">
            Datamu disimpan dengan aman
          </Text>
        </View>
      </View>
    </View>
  );
}

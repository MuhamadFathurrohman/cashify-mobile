import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { KeyboardScreen } from "@/components/ui/KeyboardScreen";
import { notify } from "@/components/ui/notify";
import { useGoogleAuth, useLogin } from "@/features/auth/useAuth";
import { useKeyboardAwareScreen } from "@/hooks/useKeyboardAwareScreen";
import { ApiRequestError } from "@/lib/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ComponentRef, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

// ─── Skema Validasi ────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(8, "Password minimal 8 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Aset lokal ───────────────────────────────────────────────────────────────
const logoIcon = require("@/assets/images/logo-icon-cashify.png");
const logoText = require("@/assets/images/logo-text-cashify.png");
const iconGoogle = require("@/assets/icons/icon-google.png");

function formatRetryAfter(seconds: number): string {
  return `${Math.max(1, Math.ceil(seconds / 60))} menit`;
}

// ─── Helper: terjemahkan ApiRequestError ke pesan pengguna ───────────────────
function resolveErrorMessage(error: Error): string {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Email atau password salah.";
      case "RATE_LIMITED": {
        const retryAfter = (error.details ?? []).find(
          (d) => typeof d.retry_after_seconds === "number",
        )?.retry_after_seconds;
        return retryAfter
          ? `Terlalu banyak percobaan masuk. Coba lagi dalam ${formatRetryAfter(retryAfter)}.`
          : "Terlalu banyak percobaan masuk. Coba lagi nanti.";
      }
      case "VALIDATION_ERROR":
        return error.message;
      default:
        return error.message ?? "Terjadi kesalahan. Coba lagi.";
    }
  }
  return "Tidak dapat terhubung ke server. Periksa koneksi kamu.";
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const { mutate: googleAuth, isPending: isGooglePending } = useGoogleAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    login(
      { email: data.email, password: data.password },
      {
        onError: (error) => {
          notify.error("Gagal Masuk", resolveErrorMessage(error));
        },
      },
    );
  };

  // ⚠️ DEV BUILD REQUIRED: aktifkan blok di bawah setelah development build siap.
  // Langkah aktivasi:
  // 1. Dapat webClientId dari tim backend → isi di app.json
  // 2. Konfirmasi keputusan Expo Go vs development build
  // 3. Jalankan: npx expo run:android
  // 4. Import GoogleSignin dari @react-native-google-signin/google-signin
  // 5. Tambah GoogleSignin.configure({ webClientId }) di luar komponen
  // 6. Ganti isi fungsi ini dengan:
  //    try {
  //      await GoogleSignin.hasPlayServices();
  //      const { data } = await GoogleSignin.signIn();
  //      if (!data?.idToken) throw new Error("id_token tidak ditemukan");
  //      googleAuth(
  //        { id_token: data.idToken },
  //        { onError: (err) => {
  //            const msg = resolveGoogleAuthError(err);
  //            if (msg) notify.error("Gagal Masuk", msg);
  //          }
  //        }
  //      );
  //    } catch (err) {
  //      const msg = resolveGoogleSignInError(err);
  //      if (msg) notify.error("Gagal Masuk", msg);
  //    }
  const handleGoogleLogin = () => {
    notify.info("Segera Hadir", "Login dengan Google akan segera tersedia.");
  };

  const googleRef = useRef<ComponentRef<typeof TouchableOpacity>>(null);
  const insets = useSafeAreaInsets();
  const { scrollRef, keyboardVisible, viewportHeight, onLayout } =
    useKeyboardAwareScreen({ scrollTo: googleRef });

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

      <KeyboardScreen
        className="bg-none"
        scrollRef={scrollRef}
        contentContainerClassName="grow"
        keyboardDismissMode="on-drag"
        onLayout={onLayout}
      >
        <View
          className="grow px-5 pt-20 gap-[75px] justify-between"
          style={viewportHeight > 0 ? { minHeight: viewportHeight } : undefined}
        >
          {/* ── Branding + Form ── */}
          <View className="w-full items-center">
            {/* Saat keyboard terbuka branding diringkas: ikon + wordmark
                berdampingan dan lebih kecil, supaya tombol Masuk & Google
                tetap terlihat di atas keyboard. */}
            <Animated.View
              layout={LinearTransition.duration(180)}
              style={{ width: "100%" }}
            >
              <View
                className={
                  keyboardVisible
                    ? "w-full flex-row items-center justify-center gap-[5px] pb-3"
                    : "w-full items-center"
                }
              >
                <Image
                  source={logoIcon}
                  className={
                    keyboardVisible ? "w-[60px] h-[60px]" : "w-[86px] h-[79px]"
                  }
                  resizeMode="contain"
                />

                <View
                  className={
                    keyboardVisible
                      ? "items-center"
                      : "w-full items-center pt-3 pb-6"
                  }
                >
                  <Image
                    source={logoText}
                    className={
                      keyboardVisible
                        ? "w-[77px] h-[24px] mt-3"
                        : "w-[87px] h-[27px]"
                    }
                    resizeMode="contain"
                  />
                </View>
              </View>
            </Animated.View>

            {/* Welcome section */}
            {!keyboardVisible && (
              <Animated.View
                exiting={FadeOut.duration(120)}
                style={{ width: "100%" }}
              >
                <View className="w-full items-center gap-1 pb-5">
                  <Text className="font-sans text-[#001d37] text-[20px] font-semibold leading-[26px] tracking-[-0.3px] text-center">
                    Selamat Datang Kembali
                  </Text>
                  <Text className="font-sans text-[#43474d] text-[12px] font-normal leading-[16px] text-center">
                    Masuk untuk melanjutkan pengelolaan keuanganmu.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Form Card */}
            <Animated.View
              layout={LinearTransition.duration(180)}
              style={{ width: "100%" }}
            >
              <View
                className="w-full rounded-[28px] bg-white border border-[rgba(196,198,206,0.3)] p-[25px] gap-4"
                style={{
                  shadowColor: "#19324d",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 20,
                  elevation: 3,
                }}
              >
                {/* Form fields */}
                <View className="w-full gap-3">
                  {/* Input Email */}
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FloatingInput
                        label="Email"
                        placeholder="Masukkan email kamu"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.email?.message}
                        editable={!isPending}
                      />
                    )}
                  />

                  {/* Input Password */}
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FloatingInput
                        label="Password"
                        placeholder="Masukkan password kamu"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="go"
                        onSubmitEditing={() => handleSubmit(onSubmit)()}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.password?.message}
                        editable={!isPending}
                      />
                    )}
                  />

                  {/* Lupa password */}
                  <View className="items-end">
                    <TouchableOpacity
                      onPress={() => router.push("/(auth)/forgot-password")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text className="font-sans text-[#006c50] text-[12px] font-semibold tracking-[0.24px] leading-[16px]">
                        Lupa password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tombol Masuk */}
                  <TouchableOpacity
                    className="mt-5 h-[54px] rounded-[16px] items-center justify-center bg-[#006c50]"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 1,
                      elevation: 1,
                    }}
                    onPress={() => handleSubmit(onSubmit)()}
                    disabled={isPending || isGooglePending}
                    activeOpacity={0.85}
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="font-sans text-white text-[16px] font-semibold tracking-[-0.16px] leading-[22px]">
                        Masuk
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Divider ATAU */}
                <View className="w-full items-center justify-center">
                  <View className="w-full h-px bg-[rgba(196,198,206,0.4)]" />
                  <View className="absolute bg-white px-3">
                    <Text className="font-sans text-[#74777e] text-[10px] font-semibold tracking-[0.5px] uppercase leading-[14px]">
                      ATAU
                    </Text>
                  </View>
                </View>

                {/* Tombol Google */}
                <TouchableOpacity
                  ref={googleRef}
                  className="h-[50px] w-full rounded-[16px] border border-[rgba(196,198,206,0.5)] bg-white flex-row items-center justify-center gap-3"
                  onPress={handleGoogleLogin}
                  activeOpacity={0.8}
                  disabled={isPending || isGooglePending}
                >
                  <Image
                    source={iconGoogle}
                    className="w-5 h-5"
                    resizeMode="contain"
                  />
                  <Text className="font-sans text-[#001d37] text-[14px] font-medium tracking-[-0.16px] leading-[20px]">
                    Lanjutkan dengan Google
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* ── Footer ── */}
          {/* Menempel di dasar layar saat konten lebih pendek dari viewport; ikut
              tergulir saat keyboard terbuka. paddingBottom memakai safe area agar
              tidak tertutup navigation bar 3 tombol maupun area gesture. */}
          <View
            className="w-full pt-8 gap-3 items-center"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="flex-row items-center justify-center">
              <Text className="font-sans text-[#43474d] text-[12px] font-normal leading-[16px]">
                Belum punya akun?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="font-sans text-[#006c50] text-[12px] font-semibold tracking-[0.24px] leading-[16px]">
                  Daftar sekarang
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-center opacity-60 gap-4">
              <TouchableOpacity>
                <Text className="font-sans text-[#74777e] text-[10px] font-semibold tracking-[0.4px] leading-[14px]">
                  Kebijakan Privasi
                </Text>
              </TouchableOpacity>
              <Text className="font-sans text-[#74777e] text-[10px] font-semibold">
                •
              </Text>
              <TouchableOpacity>
                <Text className="font-sans text-[#74777e] text-[10px] font-semibold tracking-[0.4px] leading-[14px]">
                  Syarat & Ketentuan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardScreen>
    </View>
  );
}

import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { notify } from "@/components/ui/notify";
import { useLogin } from "@/features/auth/useAuth";
import { ApiRequestError } from "@/lib/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

  const handleGoogleLogin = () => {
    // TODO: implementasi Google OAuth — tunggu endpoint /auth/google siap
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#f8f9ff]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AmbientBlob
        color="green"
        className="right-[-80px] top-[-96px] w-[288px] h-[288px]"
      />
      <AmbientBlob
        color="blue"
        className="left-[-80px] bottom-[-96px] w-[288px] h-[288px]"
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-5 pt-20 pb-4 gap-[75px]">
          {/* ── Branding + Form ── */}
          <View className="w-full items-center">
            {/* Logo icon */}
            <Image
              source={logoIcon}
              className="w-[86px] h-[79px]"
              resizeMode="contain"
            />

            {/* Logo text */}
            <View className="w-full items-center pt-3 pb-6">
              <Image
                source={logoText}
                className="w-[87px] h-[27px]"
                resizeMode="contain"
              />
            </View>

            {/* Welcome section */}
            <View className="w-full items-center gap-1 pb-5">
              <Text className="text-[#001d37] text-[20px] font-semibold leading-[26px] tracking-[-0.3px] text-center">
                Selamat Datang Kembali
              </Text>
              <Text className="text-[#43474d] text-[12px] font-normal leading-[16px] text-center">
                Masuk untuk melanjutkan pengelolaan keuanganmu.
              </Text>
            </View>

            {/* Form Card */}
            <View
              className="w-full rounded-[28px] bg-white border border-[rgba(196,198,206,0.3)] p-[25px] gap-5"
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
                    <Text className="text-[#006c50] text-[12px] font-semibold tracking-[0.24px] leading-[16px]">
                      Lupa password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Tombol Masuk */}
                <TouchableOpacity
                  className="mt-5 h-[54px] rounded-[16px] items-center justify-center bg-[#006c50] flex-row gap-2"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 1,
                    elevation: 1,
                  }}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isPending}
                  activeOpacity={0.85}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text className="text-white text-[16px] font-semibold tracking-[-0.16px] leading-[22px]">
                        Masuk
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#ffffff"
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Divider ATAU */}
              <View className="w-full items-center justify-center">
                <View className="w-full h-px bg-[rgba(196,198,206,0.4)]" />
                <View className="absolute bg-white px-3">
                  <Text className="text-[#74777e] text-[10px] font-semibold tracking-[0.5px] uppercase leading-[14px]">
                    ATAU
                  </Text>
                </View>
              </View>

              {/* Tombol Google */}
              <TouchableOpacity
                className="h-[50px] w-full rounded-[16px] border border-[rgba(196,198,206,0.5)] bg-white flex-row items-center justify-center gap-3"
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
                disabled={isPending}
              >
                <Image
                  source={iconGoogle}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text className="text-[#001d37] text-[14px] font-medium tracking-[-0.16px] leading-[20px]">
                  Lanjutkan dengan Google
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Footer ── */}
          <View className="w-full pb-2 pt-8 gap-3 items-center">
            <View className="flex-row items-center justify-center">
              <Text className="text-[#43474d] text-[12px] font-normal leading-[16px]">
                Belum punya akun?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-[#006c50] text-[12px] font-semibold tracking-[0.24px] leading-[16px]">
                  Daftar sekarang
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-center opacity-60 gap-4">
              <TouchableOpacity>
                <Text className="text-[#74777e] text-[10px] font-semibold tracking-[0.4px] leading-[14px]">
                  Kebijakan Privasi
                </Text>
              </TouchableOpacity>
              <Text className="text-[#74777e] text-[10px] font-semibold">
                •
              </Text>
              <TouchableOpacity>
                <Text className="text-[#74777e] text-[10px] font-semibold tracking-[0.4px] leading-[14px]">
                  Syarat & Ketentuan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

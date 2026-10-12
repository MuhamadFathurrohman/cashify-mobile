import { useLogin } from "@/features/auth/useAuth";
import { ApiRequestError } from "@/lib/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

// skema validasi
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

// aset lokal
const logoIcon = require("@/assets/images/logo-icon-cashify.png");
const logoText = require("@/assets/images/logo-text-cashify.png");
const iconGoogle = require("@/assets/icons/icon-google.png");

// Helper: terjemahkan ApiRequestEror ke pesan yang mudah dipahami pengguna
function resolveErrorMessage(error: Error): string {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Email atau password salah.";
      case "RATE_LIMITED":
        return "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.";
      case "VALIDATION_ERROR":
        return error.message;
      default:
        return error.message ?? "Terjadi kesalahan. Coba lagi.";
    }
  }
  return "Tidak dapat terhubung ke server. Periksa koneksi kamu.";
}

// komponen
export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending, error } = useLogin();

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
        // Session guard di RootLayoutNav yang mengurus redirect setelah
        // token tersimpan — tidak perlu router.push manual di sini
        onError: () => {
          // error ditangkap dari state `error` di atas, tidak perlu setState
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
      {/* ── Ambient blur circles ── */}
      <View className="absolute w-[224px] h-[224px] rounded-full bg-[#7ff9cc] opacity-20 right-[-64px] top-[-64px] overflow-hidden">
        <BlurView
          style={{ position: "absolute", inset: 0 }}
          intensity={32}
          blurMethod="dimezisBlurView"
        />
      </View>
      <View
        className="absolute w-[192px] rounded-full bg-[#d2e4ff] opacity-30 left-[-80px] overflow-hidden"
        style={{ top: "33.33%", bottom: "43.92%" }}
      >
        <BlurView
          style={{ position: "absolute", inset: 0 }}
          intensity={32}
          blurMethod="dimezisBlurView"
        />
      </View>

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
              {/* Error banner dari API */}
              {error && (
                <View className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3">
                  <Text className="text-red-600 text-[12px] font-normal leading-[16px]">
                    {resolveErrorMessage(error)}
                  </Text>
                </View>
              )}

              {/* Form fields */}
              <View className="w-full gap-4">
                {/* Input Email */}
                <View className="gap-[6px]">
                  <Text className="text-[#001d37] text-[12px] font-semibold tracking-[0.24px] leading-[16px]">
                    Email
                  </Text>
                  <View className="relative">
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className={`bg-white border rounded-[16px] h-[50px] pl-[45px] pr-[17px] text-[14px] text-[#001d37] font-normal ${
                            errors.email
                              ? "border-red-400"
                              : "border-[rgba(196,198,206,0.4)]"
                          }`}
                          placeholder="Masukkan email kamu"
                          placeholderTextColor="rgba(116,119,126,0.7)"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          editable={!isPending}
                        />
                      )}
                    />
                    <View className="absolute left-[15px] top-[18px]">
                      <Ionicons
                        name="mail-outline"
                        size={17}
                        color={
                          errors.email ? "#f87171" : "rgba(116,119,126,0.8)"
                        }
                      />
                    </View>
                  </View>
                  {errors.email && (
                    <Text className="text-red-500 text-[11px] leading-[14px]">
                      {errors.email.message}
                    </Text>
                  )}
                </View>

                {/* Input Password */}
                <View className="gap-[6px]">
                  <Text className="text-[#001d37] text-[12px] font-semibold tracking-[0.24px] leading-[16px]">
                    Password
                  </Text>
                  <View className="relative">
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className={`bg-white border rounded-[16px] h-[50px] pl-[45px] pr-[48px] text-[14px] text-[#001d37] font-normal ${
                            errors.password
                              ? "border-red-400"
                              : "border-[rgba(196,198,206,0.4)]"
                          }`}
                          placeholder="Masukkan password kamu"
                          placeholderTextColor="rgba(116,119,126,0.7)"
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          editable={!isPending}
                        />
                      )}
                    />
                    <View className="absolute left-[17px] top-[16px]">
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={
                          errors.password ? "#f87171" : "rgba(116,119,126,0.8)"
                        }
                      />
                    </View>
                    <TouchableOpacity
                      className="absolute right-[14px] top-[11px] p-[4px]"
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="rgba(116,119,126,0.8)"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text className="text-red-500 text-[11px] leading-[14px]">
                      {errors.password.message}
                    </Text>
                  )}
                </View>

                {/* Lupa password */}
                <View className="items-end pt-1 pb-2">
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
                  className={`h-[50px] rounded-[16px] items-center justify-center flex-row gap-2 ${
                    isPending ? "bg-[#006c50]/70" : "bg-[#006c50]"
                  }`}
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

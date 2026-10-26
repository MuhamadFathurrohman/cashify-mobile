import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { useRegisterFlow } from "@/features/auth/RegisterContext";
import {
  registerAccountSchema,
  type RegisterAccountForm,
} from "@/features/auth/registerSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Aset lokal ───────────────────────────────────────────────────────────────
const logoIcon = require("@/assets/images/logo-icon-cashify.png");
const logoText = require("@/assets/images/logo-text-cashify.png");
const iconGoogle = require("@/assets/icons/icon-google.png");

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function RegisterAccountScreen() {
  const router = useRouter();
  const emailRef = useRef<TextInput>(null);
  const { account, setAccount, emailError, setEmailError } = useRegisterFlow();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterAccountForm>({
    resolver: zodResolver(registerAccountSchema),
    // Isi ulang saat pengguna kembali dari langkah 2
    defaultValues: {
      full_name: account?.full_name ?? "",
      email: account?.email ?? "",
    },
  });

  // data sudah di-trim oleh zodResolver
  const onSubmit = (data: RegisterAccountForm) => {
    setEmailError(null);
    setAccount({ full_name: data.full_name, email: data.email });
    router.push("/(auth)/register/password");
  };

  const handleGoogleRegister = () => {
    // TODO: implementasi Google OAuth bersama tombol di login — tunggu endpoint /auth/google siap
  };

  // Bila layar dibuka tanpa riwayat (mis. deep link), kembali tidak mungkin
  const handleGoToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
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
        <View className="flex-1 justify-between px-6 pt-20 pb-4 gap-8">
          {/* ── Branding + Form ── */}
          <View className="w-full items-center">
            <Image
              source={logoIcon}
              className="w-[86px] h-[79px]"
              resizeMode="contain"
            />
            <View className="w-full items-center pt-3 pb-6">
              <Image
                source={logoText}
                className="w-[87px] h-[27px]"
                resizeMode="contain"
              />
            </View>

            <View className="pt-4">
              <StepIndicator step={1} />
            </View>

            <View className="items-center gap-[3px] pt-[13px] pb-5">
              <Text className="text-[#001d37] text-[22px] font-bold leading-[27.5px] text-center">
                Buat Akun Baru
              </Text>
              <Text className="text-[#74777e] text-[13px] font-normal leading-[19.5px] text-center">
                Mulai perjalanan finansialmu bersama Cashify.
              </Text>
            </View>

            {/* Form Card */}
            <View
              className="w-full rounded-[28px] bg-white border border-[rgba(196,198,206,0.3)] p-[25px] gap-3"
              style={{
                shadowColor: "#19324d",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 20,
                elevation: 3,
              }}
            >
              <Controller
                control={control}
                name="full_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Nama Lengkap"
                    placeholder="Masukkan nama lengkapmu"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.full_name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    ref={emailRef}
                    label="Email"
                    placeholder="Masukkan email kamu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      onChange(text);
                      // Error dari server tidak berlaku lagi setelah email diubah
                      if (emailError) setEmailError(null);
                    }}
                    value={value}
                    error={errors.email?.message ?? emailError ?? undefined}
                  />
                )}
              />

              <TouchableOpacity
                className="mt-3 h-[50px] rounded-[16px] bg-[#006c50] items-center justify-center flex-row gap-2"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1,
                }}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text className="text-white text-[16px] font-semibold tracking-[-0.16px] leading-[22px]">
                  Lanjutkan
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Divider ATAU */}
            <View className="w-full flex-row items-center px-2 py-4">
              <View className="flex-1 h-px bg-[rgba(190,201,194,0.3)]" />
              <Text className="px-3 text-[#74777e] text-[10px] font-semibold tracking-[0.5px] leading-[15px]">
                ATAU
              </Text>
              <View className="flex-1 h-px bg-[rgba(190,201,194,0.3)]" />
            </View>

            {/* Tombol Google (UI saja) */}
            <TouchableOpacity
              className="h-[50px] w-full rounded-[16px] border border-[rgba(196,198,206,0.5)] bg-white flex-row items-center justify-center gap-3"
              onPress={handleGoogleRegister}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Image
                source={iconGoogle}
                className="w-5 h-5"
                resizeMode="contain"
              />
              <Text className="text-[#001d37] text-[14px] font-medium tracking-[-0.16px] leading-[20px]">
                Daftar dengan Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View className="w-full flex-row items-center justify-center pt-4 pb-2">
            <Text className="text-[#43474d] text-[12px] font-normal leading-[18px]">
              Sudah punya akun?{" "}
            </Text>
            <TouchableOpacity
              onPress={handleGoToLogin}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
            >
              <Text className="text-[#006c50] text-[12px] font-semibold leading-[18px]">
                Masuk
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

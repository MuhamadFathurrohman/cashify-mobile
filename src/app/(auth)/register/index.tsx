import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { KeyboardScreen } from "@/components/ui/KeyboardScreen";
import { notify } from "@/components/ui/notify";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { useRegisterFlow } from "@/features/auth/RegisterContext";
import {
  registerAccountSchema,
  type RegisterAccountForm,
} from "@/features/auth/registerSchemas";
import { useKeyboardAwareScreen } from "@/hooks/useKeyboardAwareScreen";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ComponentRef, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Aset lokal ───────────────────────────────────────────────────────────────
const logoIcon = require("@/assets/images/logo-icon-cashify.png");
const logoText = require("@/assets/images/logo-text-cashify.png");
const iconGoogle = require("@/assets/icons/icon-google.png");

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function RegisterAccountScreen() {
  const router = useRouter();
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
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

  const googleRef = useRef<ComponentRef<typeof TouchableOpacity>>(null);
  const insets = useSafeAreaInsets();
  const { scrollRef, keyboardVisible, viewportHeight, onLayout } =
    useKeyboardAwareScreen({ scrollTo: googleRef });

  // data sudah di-trim oleh zodResolver
  const onSubmit = (data: RegisterAccountForm) => {
    setEmailError(null);
    setAccount({ full_name: data.full_name, email: data.email });
    router.push("/(auth)/register/password");
  };

  const handleGoogleRegister = () => {
    notify.info("Segera Hadir", "Daftar dengan Google akan segera tersedia.");
  };

  // Bila layar dibuka tanpa riwayat (mis. deep link), kembali tidak mungkin
  const handleGoToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
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

      <KeyboardScreen
        className="bg-none"
        scrollRef={scrollRef}
        contentContainerClassName="grow"
        keyboardDismissMode="on-drag"
        onLayout={onLayout}
      >
        <View
          className={`grow px-6 justify-between gap-8 ${
            keyboardVisible ? "pt-[50px]" : "pt-20"
          }`}
          style={viewportHeight > 0 ? { minHeight: viewportHeight } : undefined}
        >
          {/* ── Branding + Form ── */}
          <View className="w-full items-center">
            {/* Saat keyboard terbuka branding diringkas: ikon + wordmark
                berdampingan dan lebih kecil, supaya tombol Daftar & Google
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

            {/* Indikator progres tetap tampil sebagai konteks saat mengetik.
                pb-5 menggantikan jarak dari blok judul yang hilang saat keyboard. */}
            <View className={keyboardVisible ? "pt-4 pb-5" : "pt-4"}>
              <StepIndicator step={1} />
            </View>

            {/* Judul + subjudul hilang saat keyboard terbuka */}
            {!keyboardVisible && (
              <Animated.View
                exiting={FadeOut.duration(120)}
                style={{ width: "100%" }}
              >
                <View className="items-center gap-[3px] pt-[13px] pb-5">
                  <Text className="font-sans text-[#001d37] text-[22px] font-bold leading-[27.5px] text-center">
                    Buat Akun Baru
                  </Text>
                  <Text className="font-sans text-[#74777e] text-[13px] font-normal leading-[19.5px] text-center">
                    Mulai perjalanan finansialmu bersama Cashify.
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
                      onSubmitEditing={() => handleSubmit(onSubmit)()}
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
                  className="mt-5 h-[54px] rounded-[16px] bg-[#006c50] items-center justify-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 1,
                    elevation: 1,
                  }}
                  onPress={() => handleSubmit(onSubmit)()}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text className="font-sans text-white text-[16px] font-semibold tracking-[-0.16px] leading-[22px]">
                    Lanjutkan
                  </Text>
                </TouchableOpacity>

                {/* Divider ATAU — di dalam kartu putih, mengikuti pola login */}
                <View className="w-full items-center justify-center">
                  <View className="w-full h-px bg-[rgba(196,198,206,0.4)]" />
                  <View className="absolute bg-white px-3">
                    <Text className="font-sans text-[#74777e] text-[10px] font-semibold tracking-[0.5px] uppercase leading-[14px]">
                      ATAU
                    </Text>
                  </View>
                </View>

                {/* Tombol Google (UI saja) — target auto-scroll saat keyboard */}
                <TouchableOpacity
                  ref={googleRef}
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
                  <Text className="font-sans text-[#001d37] text-[14px] font-medium tracking-[-0.16px] leading-[20px]">
                    Daftar dengan Google
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* ── Footer ── */}
          <View
            className="w-full pt-4 items-center"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="flex-row items-center justify-center">
              <Text className="font-sans text-[#43474d] text-[12px] font-normal leading-[18px]">
                Sudah punya akun?{" "}
              </Text>
              <TouchableOpacity
                onPress={handleGoToLogin}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
              >
                <Text className="font-sans text-[#006c50] text-[12px] font-semibold leading-[18px]">
                  Masuk
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardScreen>
    </View>
  );
}

import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { KeyboardScreen } from "@/components/ui/KeyboardScreen";
import { notify } from "@/components/ui/notify";
import { useAuthStore } from "@/features/auth/authStore";
import {
  getPasswordRequirements,
  getPasswordStrength,
} from "@/features/auth/passwordPolicy";
import { resolveResetPasswordError } from "@/features/auth/passwordRecoveryErrors";
import { PasswordRequirements } from "@/features/auth/PasswordRequirements";
import { PasswordStrengthMeter } from "@/features/auth/PasswordStrengthMeter";
import {
  clearRecoveryLink,
  getRecoveryLink,
  subscribeRecoveryLink,
} from "@/features/auth/recoveryLinkStore";
import {
  resetPasswordSchema,
  type ResetPasswordForm,
} from "@/features/auth/recoverySchemas";
import { useResetPassword } from "@/features/auth/useAuth";
import { useKeyboardAwareScreen } from "@/hooks/useKeyboardAwareScreen";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ComponentRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const logoIcon = require("@/assets/images/logo-icon-cashify.png");
const logoText = require("@/assets/images/logo-text-cashify.png");

const cardShadow = {
  shadowColor: "#19324d",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 3,
} as const;

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function ResetPasswordScreen() {
  const router = useRouter();
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);
  const simpanRef = useRef<ComponentRef<typeof TouchableOpacity>>(null);
  const insets = useSafeAreaInsets();
  const { scrollRef, keyboardVisible, viewportHeight, onLayout } =
    useKeyboardAwareScreen({ scrollTo: simpanRef });
  // Token ditangkap di root sebelum layar ini terpasang; layar hanya membaca
  const link = useSyncExternalStore(subscribeRecoveryLink, getRecoveryLink);
  const { mutate: resetPassword, isPending } = useResetPassword();
  // Setelah sukses, tampilan form dipertahankan sampai navigasi selesai;
  // tautan sudah dibuang, tanpa ini panel "Tautan Tidak Valid" sempat muncul
  const [done, setDone] = useState(false);
  // Sukses reset: navigasi menunggu status auth berubah menjadi signedOut
  const [succeeded, setSucceeded] = useState(false);
  const status = useAuthStore((state) => state.status);
  const busy = isPending || done;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  const [password, confirmPassword] = useWatch({
    control,
    name: ["password", "confirm_password"],
  });

  // Layar sering dibuka dari tautan tanpa riwayat navigasi: back tanpa riwayat → login
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (busy) return true;
          if (router.canGoBack()) return false;
          router.replace("/(auth)/login");
          return true;
        },
      );
      return () => subscription.remove();
    }, [busy, router]),
  );

  const goToLogin = () => {
    clearRecoveryLink();
    if (router.canGoBack()) router.dismissTo("/(auth)/login");
    else router.replace("/(auth)/login");
  };

  const goToForgotPassword = () => {
    clearRecoveryLink();
    router.replace("/(auth)/forgot-password");
  };

  // Navigasi ke login menunggu status benar-benar signedOut. Tanpa ini, replace
  // bisa terjadi saat status masih "ready" ketika grup (auth) belum terdaftar
  // di navigator, sehingga pengguna terlempar ke Beranda sekejap.
  useEffect(() => {
    if (!succeeded || status !== "signedOut") return;
    clearRecoveryLink();
    if (router.canGoBack()) router.dismissTo("/(auth)/login");
    else router.replace("/(auth)/login");
  }, [succeeded, status, router]);

  const onSubmit = (data: ResetPasswordForm) => {
    if (done || link?.kind !== "token") return;

    resetPassword(
      { token: link.accessToken, password: data.password },
      {
        onSuccess: () => {
          setDone(true);
          setSucceeded(true);
          notify.success(
            "Kata Sandi Diperbarui",
            "Silakan masuk dengan kata sandi baru.",
          );
        },
        onError: (error) => {
          const { field, message, invalidLink } =
            resolveResetPasswordError(error);
          if (invalidLink) {
            // Pertahankan tampilan form sampai navigasi selesai (lihat done)
            setDone(true);
            notify.error("Tautan Tidak Valid", message);
            goToForgotPassword();
          } else if (field === "password") {
            setError("password", { type: "server", message });
          } else {
            notify.error("Gagal Mengubah Kata Sandi", message);
          }
        },
      },
    );
  };

  const requirements = getPasswordRequirements(password);
  const strength = getPasswordStrength(password);
  const isMatch = password !== "" && password === confirmPassword;

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
          className={`grow justify-between gap-6 px-6 ${
            keyboardVisible ? "pt-[50px]" : "pt-20"
          }`}
          style={viewportHeight > 0 ? { minHeight: viewportHeight } : undefined}
        >
          <View className="w-full">
            {/* ── Logo ── */}
            {/* Saat keyboard terbuka logo diringkas jadi satu baris agar tombol
                "Simpan Kata Sandi Baru" tetap terlihat di atas keyboard. */}
            <Animated.View
              layout={LinearTransition.duration(180)}
              style={{ width: "100%" }}
            >
              <View
                className={
                  keyboardVisible
                    ? "w-full flex-row items-center justify-center gap-[5px] pb-3"
                    : "w-full items-center pb-5"
                }
              >
                <Image
                  source={logoIcon}
                  className={
                    keyboardVisible ? "w-[60px] h-[60px]" : "w-[86px] h-[79px]"
                  }
                  resizeMode="contain"
                />
                <View className={keyboardVisible ? "items-center" : "pt-2"}>
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

            {link?.kind === "token" || done ? (
              /* ── Form reset ── */
              <>
                {/* Judul hilang saat keyboard terbuka */}
                {!keyboardVisible && (
                  <Animated.View
                    exiting={FadeOut.duration(120)}
                    style={{ width: "100%" }}
                  >
                    <View className="items-center gap-[3px] pb-5">
                      <Text className="font-sans text-[#001d37] text-[22px] font-bold leading-[27.5px] text-center">
                        Reset Kata Sandi
                      </Text>
                      <Text className="font-sans text-[#74777e] text-[13px] font-normal leading-[19.5px] text-center max-w-[270px]">
                        Buat kata sandi baru yang kuat untuk akunmu.
                      </Text>
                    </View>
                  </Animated.View>
                )}

                <Animated.View
                  layout={LinearTransition.duration(180)}
                  style={{ width: "100%" }}
                >
                  <View
                    className="w-full rounded-[28px] bg-white border border-[#edf1f7] p-[21px] gap-4"
                    style={cardShadow}
                  >
                    <View className="gap-[6px]">
                      <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <FloatingInput
                            label="Kata Sandi Baru"
                            placeholder="Buat kata sandi baru"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="next"
                            onSubmitEditing={() => confirmRef.current?.focus()}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            error={errors.password?.message}
                            editable={!busy}
                          />
                        )}
                      />
                      <PasswordStrengthMeter strength={strength} />
                    </View>

                    <View className="gap-[6px]">
                      <Controller
                        control={control}
                        name="confirm_password"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <FloatingInput
                            ref={confirmRef}
                            label="Konfirmasi Kata Sandi Baru"
                            placeholder="Ulangi kata sandi baru"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="done"
                            onSubmitEditing={() => handleSubmit(onSubmit)()}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            error={errors.confirm_password?.message}
                            editable={!busy}
                          />
                        )}
                      />
                      {isMatch && (
                        <View className="flex-row items-center gap-[6px] pt-[2px]">
                          <Ionicons
                            name="checkmark-circle"
                            size={13}
                            color="#006c50"
                          />
                          <Text className="font-sans text-[#006c50] text-[11px] font-normal leading-[16.5px]">
                            Kata sandi cocok
                          </Text>
                        </View>
                      )}
                    </View>

                    <PasswordRequirements items={requirements} />
                  </View>
                </Animated.View>

                <TouchableOpacity
                  ref={simpanRef}
                  className="mt-5 h-[54px] rounded-[16px] items-center justify-center bg-[#006c50]"
                  style={{
                    shadowColor: "#006c50",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.22,
                    shadowRadius: 10,
                    elevation: 4,
                  }}
                  onPress={() => handleSubmit(onSubmit)()}
                  disabled={busy}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="font-sans text-white text-[16px] font-semibold leading-[24px]">
                      Simpan Kata Sandi Baru
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* ── Tautan tidak valid / kedaluwarsa / belum diterima ── */
              <View
                className="w-full items-center gap-5 rounded-[28px] border border-[rgba(196,198,206,0.3)] bg-white p-[25px]"
                style={cardShadow}
              >
                <View className="h-16 w-16 items-center justify-center rounded-full bg-[#fee2e2]">
                  <Ionicons
                    name="alert-circle-outline"
                    size={30}
                    color="#f87171"
                  />
                </View>
                <View className="items-center gap-2">
                  <Text className="font-sans text-[#001d37] text-[20px] font-semibold leading-[26px] text-center">
                    Tautan Tidak Valid
                  </Text>
                  <Text className="font-sans text-[#43474d] text-[13px] font-normal leading-[20px] text-center">
                    Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.
                    Minta tautan baru untuk melanjutkan.
                  </Text>
                </View>
                <TouchableOpacity
                  className="h-[54px] w-full items-center justify-center rounded-[16px] bg-[#006c50]"
                  onPress={goToForgotPassword}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text className="font-sans text-white text-[16px] font-semibold leading-[22px]">
                    Minta Tautan Baru
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Kembali ke login ── */}
            <View className="items-center pt-5">
              <TouchableOpacity
                className="flex-row items-center gap-[4px] px-2 py-1"
                onPress={goToLogin}
                disabled={busy}
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={14} color="#006c50" />
                <Text className="font-sans text-[#006c50] text-[12px] font-semibold tracking-[0.24px] leading-[16px]">
                  Kembali ke halaman masuk
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Catatan keamanan ── */}
          <View
            className="w-full flex-row items-center justify-center gap-[6px] pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color="rgba(116,119,126,0.8)"
            />
            <Text className="font-sans text-[rgba(116,119,126,0.8)] text-[11px] font-normal leading-[16.5px]">
              Datamu disimpan dengan aman
            </Text>
          </View>
        </View>
      </KeyboardScreen>
    </View>
  );
}

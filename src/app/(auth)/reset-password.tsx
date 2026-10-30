import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { notify } from "@/components/ui/notify";
import { PasswordRequirements } from "@/components/ui/PasswordRequirements";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import {
  getPasswordRequirements,
  getPasswordStrength,
} from "@/features/auth/passwordPolicy";
import { resolveResetPasswordError } from "@/features/auth/passwordRecoveryErrors";
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
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const confirmRef = useRef<TextInput>(null);
  // Token ditangkap di root sebelum layar ini terpasang; layar hanya membaca
  const link = useSyncExternalStore(subscribeRecoveryLink, getRecoveryLink);
  const { mutate: resetPassword, isPending } = useResetPassword();
  // Setelah sukses, tampilan form dipertahankan sampai navigasi selesai;
  // tautan sudah dibuang, tanpa ini panel "Tautan Tidak Valid" sempat muncul
  const [done, setDone] = useState(false);
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

  const onSubmit = (data: ResetPasswordForm) => {
    if (done || link?.kind !== "token") return;

    resetPassword(
      { token: link.accessToken, password: data.password },
      {
        onSuccess: () => {
          setDone(true);
          notify.success(
            "Kata Sandi Diperbarui",
            "Silakan masuk dengan kata sandi baru.",
          );
          goToLogin();
        },
        onError: (error) => {
          const { field, message, invalidLink } =
            resolveResetPasswordError(error);
          if (invalidLink) {
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
        <View className="flex-1 justify-between px-6 pt-16 pb-4 gap-6">
          <View className="w-full">
            {/* ── Logo ── */}
            <View className="w-full items-center pb-5">
              <Image
                source={logoIcon}
                className="w-[64px] h-[59px]"
                resizeMode="contain"
              />
              <View className="pt-2">
                <Image
                  source={logoText}
                  className="w-[72px] h-[22px]"
                  resizeMode="contain"
                />
              </View>
            </View>

            {link?.kind === "token" || done ? (
              /* ── Form reset ── */
              <>
                <View className="items-center gap-[3px] pb-5">
                  <Text className="text-[#001d37] text-[22px] font-bold leading-[27.5px] text-center">
                    Reset Kata Sandi
                  </Text>
                  <Text className="text-[#74777e] text-[13px] font-normal leading-[19.5px] text-center max-w-[270px]">
                    Buat kata sandi baru yang kuat untuk akunmu.
                  </Text>
                </View>

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
                          onSubmitEditing={handleSubmit(onSubmit)}
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
                        <Text className="text-[#006c50] text-[11px] font-normal leading-[16.5px]">
                          Kata sandi cocok
                        </Text>
                      </View>
                    )}
                  </View>

                  <PasswordRequirements items={requirements} />
                </View>

                <TouchableOpacity
                  className="mt-5 h-[54px] rounded-[16px] items-center justify-center bg-[#006c50]"
                  style={{
                    shadowColor: "#006c50",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.22,
                    shadowRadius: 10,
                    elevation: 4,
                  }}
                  onPress={handleSubmit(onSubmit)}
                  disabled={busy}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-white text-[16px] font-semibold leading-[24px]">
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
                  <Text className="text-[#001d37] text-[20px] font-semibold leading-[26px] text-center">
                    Tautan Tidak Valid
                  </Text>
                  <Text className="text-[#43474d] text-[13px] font-normal leading-[20px] text-center">
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
                  <Text className="text-white text-[16px] font-semibold leading-[22px]">
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
                <Text className="text-[#006c50] text-[12px] font-semibold tracking-[0.24px] leading-[16px]">
                  Kembali ke halaman masuk
                </Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

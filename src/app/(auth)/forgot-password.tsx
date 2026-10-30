import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { notify } from "@/components/ui/notify";
import { ForgotPasswordSent } from "@/features/auth/ForgotPasswordSent";
import {
  isInCooldown,
  useForgotPasswordCooldown,
} from "@/features/auth/forgotPasswordCooldown";
import { resolveForgotPasswordError } from "@/features/auth/passwordRecoveryErrors";
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "@/features/auth/recoverySchemas";
import { useForgotPassword } from "@/features/auth/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
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
export default function ForgotPasswordScreen() {
  const router = useRouter();
  // null = tampilkan form; terisi = tampilkan state "terkirim" untuk email ini
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const { mutate: sendLink, isPending } = useForgotPassword();
  const startCooldown = useForgotPasswordCooldown((s) => s.start);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const leaveToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
  };

  // Di state terkirim, back hanya kembali ke form (email tetap terisi)
  const handleBack = () => (sentEmail ? setSentEmail(null) : leaveToLogin());

  useFocusEffect(
    useCallback(() => {
      if (!sentEmail) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          setSentEmail(null);
          return true;
        },
      );
      return () => subscription.remove();
    }, [sentEmail]),
  );

  const send = (email: string) => {
    sendLink(
      { email },
      {
        onSuccess: () => {
          startCooldown(email);
          setSentEmail(email);
        },
        onError: (error) => {
          const { field, message, retryAfterSeconds } =
            resolveForgotPasswordError(error);
          if (retryAfterSeconds) startCooldown(email, retryAfterSeconds);
          if (field === "email") {
            setError("email", { type: "server", message });
          } else {
            notify.error("Gagal Mengirim Tautan", message);
          }
        },
      },
    );
  };

  const onSubmit = ({ email }: ForgotPasswordForm) => {
    // Email yang sama baru saja diproses: tidak perlu request ulang
    if (isInCooldown(email)) {
      setSentEmail(email);
      return;
    }
    send(email);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#f8f9ff]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Swipe-back iOS dimatikan di state terkirim; back dikendalikan layar */}
      <Stack.Screen options={{ gestureEnabled: !sentEmail }} />

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
        <View className="flex-1 justify-between px-5 pt-14 pb-4 gap-6">
          <View className="w-full">
            {/* ── Navigasi kembali ── */}
            <View className="h-11 justify-center">
              <TouchableOpacity
                className="-ml-2 h-10 w-10 items-center justify-center rounded-full"
                onPress={handleBack}
                disabled={isPending}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={
                  sentEmail
                    ? "Kembali ke form email"
                    : "Kembali ke halaman masuk"
                }
              >
                <Ionicons name="arrow-back" size={20} color="#001d37" />
              </TouchableOpacity>
            </View>

            {/* ── Logo ── */}
            <View className="w-full items-center pt-4 pb-6">
              <Image
                source={logoIcon}
                className="w-[86px] h-[79px]"
                resizeMode="contain"
              />
              <View className="pt-3">
                <Image
                  source={logoText}
                  className="w-[87px] h-[27px]"
                  resizeMode="contain"
                />
              </View>
            </View>

            {sentEmail ? (
              <ForgotPasswordSent
                email={sentEmail}
                isPending={isPending}
                onResend={() => send(sentEmail)}
              />
            ) : (
              <>
                <View className="w-full items-center gap-1 pb-5">
                  <Text className="text-[#001d37] text-[20px] font-semibold leading-[26px] tracking-[-0.3px] text-center">
                    Lupa Kata Sandi?
                  </Text>
                  <Text className="text-[#43474d] text-[12px] font-normal leading-[18px] text-center max-w-[290px]">
                    Masukkan email terdaftar. Kami akan mengirimkan tautan untuk
                    mereset kata sandimu.
                  </Text>
                </View>

                <View
                  className="w-full gap-5 rounded-[28px] border border-[rgba(196,198,206,0.3)] bg-white p-[25px]"
                  style={cardShadow}
                >
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FloatingInput
                        label="Email Terdaftar"
                        placeholder="nama@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="send"
                        onSubmitEditing={handleSubmit(onSubmit)}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.email?.message}
                        editable={!isPending}
                      />
                    )}
                  />

                  <TouchableOpacity
                    className="h-[54px] flex-row items-center justify-center gap-2 rounded-[16px] bg-[#006c50]"
                    onPress={handleSubmit(onSubmit)}
                    disabled={isPending}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text className="text-white text-[16px] font-semibold tracking-[-0.16px] leading-[22px]">
                          Kirim Tautan Reset
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
              </>
            )}

            {/* ── Kembali ke login ── */}
            <View className="items-center pt-5">
              <TouchableOpacity
                className="flex-row items-center gap-[4px] px-2 py-1"
                onPress={leaveToLogin}
                disabled={isPending}
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

import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { notify } from "@/components/ui/notify";
import { PasswordRequirements } from "@/components/ui/PasswordRequirements";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { StepIndicator } from "@/components/ui/StepIndicator";
import {
  getPasswordRequirements,
  getPasswordStrength,
} from "@/features/auth/passwordPolicy";
import { useRegisterFlow } from "@/features/auth/RegisterContext";
import { resolveRegisterError } from "@/features/auth/registerErrors";
import {
  registerPasswordSchema,
  type RegisterPasswordForm,
} from "@/features/auth/registerSchemas";
import { useRegister } from "@/features/auth/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function RegisterPasswordScreen() {
  const router = useRouter();
  const confirmRef = useRef<TextInput>(null);
  const { account, setEmailError, setResult } = useRegisterFlow();
  const { mutate: register, isPending } = useRegister();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterPasswordForm>({
    resolver: zodResolver(registerPasswordSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  const [password, confirmPassword] = useWatch({
    control,
    name: ["password", "confirm_password"],
  });

  // Tanpa data langkah 1 (mis. layar dibuka langsung) pendaftaran tidak bisa dikirim
  useEffect(() => {
    if (!account) router.replace("/(auth)/register");
  }, [account, router]);

  if (!account) return null;

  const requirements = getPasswordRequirements(password);
  const strength = getPasswordStrength(password);
  const isMatch = password !== "" && password === confirmPassword;

  const onSubmit = (data: RegisterPasswordForm) => {
    register(
      {
        email: account.email,
        password: data.password,
        full_name: account.full_name,
      },
      {
        // Sesi ditahan di konteks; layar sukses yang mengomitnya. Password hilang bersama form ini.
        onSuccess: (response) => {
          setResult(response);
          router.replace("/(auth)/register/success");
        },
        onError: (error) => {
          const { field, message } = resolveRegisterError(error);
          if (field === "email") {
            // Kolom email ada di langkah 1
            setEmailError(message);
            router.back();
          } else if (field === "password") {
            setError("password", { type: "server", message });
          } else {
            notify.error("Gagal Mendaftar", message);
          }
        },
      },
    );
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
        <View className="flex-1 justify-between px-6 pt-14 pb-4 gap-6">
          <View className="w-full">
            {/* ── Navigasi kembali ── */}
            <View className="h-11 justify-center">
              <TouchableOpacity
                className="-ml-2 h-10 w-10 items-center justify-center rounded-full"
                onPress={() => router.back()}
                disabled={isPending}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Kembali ke langkah sebelumnya"
              >
                <Ionicons name="arrow-back" size={20} color="#001d37" />
              </TouchableOpacity>
            </View>

            {/* ── Indikator + judul ── */}
            <View className="items-center pt-2">
              <StepIndicator step={2} />
            </View>
            <View className="items-center gap-[3px] pt-[13px] pb-5">
              <Text className="text-[#001d37] text-[22px] font-bold leading-[27.5px] text-center">
                Buat Kata Sandi
              </Text>
              <Text className="text-[#74777e] text-[13px] font-normal leading-[19.5px] text-center max-w-[270px]">
                Gunakan kombinasi yang kuat untuk melindungi akunmu.
              </Text>
            </View>

            {/* ── Form Card ── */}
            <View
              className="w-full rounded-[28px] bg-white border border-[#edf1f7] p-[21px] gap-4"
              style={{
                shadowColor: "#001d37",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.04,
                shadowRadius: 15,
                elevation: 3,
              }}
            >
              <View className="gap-[6px]">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FloatingInput
                      label="Kata Sandi"
                      placeholder="Buat kata sandi kamu"
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
                      editable={!isPending}
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
                      label="Konfirmasi Kata Sandi"
                      placeholder="Ulangi kata sandi kamu"
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
                      editable={!isPending}
                    />
                  )}
                />
                {/* Ketidakcocokan ditampilkan sebagai error kolom setelah submit */}
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

            {/* ── Tombol Daftar ── */}
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
              disabled={isPending}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-[16px] font-semibold leading-[24px]">
                  Daftar
                </Text>
              )}
            </TouchableOpacity>

            <View className="items-center pt-4">
              <TouchableOpacity
                className="px-2 py-1 flex-row gap-[4px]"
                onPress={() => router.back()}
                disabled={isPending}
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={18} color="#001d37" />
                <Text className="text-[#74777e] text-[12px] font-normal leading-[18px]">
                  Kembali ke langkah sebelumnya
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

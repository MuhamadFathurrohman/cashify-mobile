import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { notify } from "@/components/ui/notify";
import { useCompleteOnboarding } from "@/features/profile/useProfile";
import {
  useResendWhatsAppOtp,
  useVerifyWhatsApp,
} from "@/features/whatsapp/useWhatsApp";
import {
  describeResendError,
  describeVerifyError,
  getRetryAfterSeconds,
} from "@/features/whatsapp/whatsappErrors";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ComponentRef, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ─── Konfigurasi ──────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // detik
// ⚠️ Ganti dengan nomor WA bot Cashify yang sebenarnya (tanpa + dan spasi)
const BOT_WA_NUMBER = "628XXXXXXXXXX";

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s} detik`;
}

// ─── Komponen OTP Box ─────────────────────────────────────────────────────────
interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
  editable: boolean;
}

function OtpInput({ value, onChange, hasError, editable }: OtpInputProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const digits = value.split("");

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      accessibilityLabel="Kotak input kode OTP"
    >
      <View className="flex-row justify-center gap-3">
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const filled = digits[i] !== undefined;
          const isActive = i === digits.length && editable;
          return (
            <View
              key={i}
              style={{
                width: 46,
                height: 54,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: hasError
                  ? "#f87171"
                  : isActive
                    ? "#006c50"
                    : filled
                      ? "#001d37"
                      : "rgba(196,198,206,0.5)",
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="font-sans"
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#001d37",
                  letterSpacing: -0.5,
                }}
              >
                {digits[i] ?? ""}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Input tersembunyi — menangkap keyboard */}
      <TextInput className="font-sans"
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
          onChange(digits);
        }}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        autoFocus
        caretHidden
        style={{
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1,
        }}
        editable={editable}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </TouchableOpacity>
  );
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
type ScreenState = "input" | "success";

export default function WhatsAppVerifyScreen() {
  const router = useRouter();
  // maskedPhone dari server. fresh="1": OTP baru saja dikirim dari layar sebelumnya;
  // fresh="0": dilanjutkan dari OTP pending (waktu kirim tidak diketahui)
  const params = useLocalSearchParams<{
    maskedPhone?: string;
    fresh?: string;
  }>();
  const phoneDisplay = params.maskedPhone ?? "+62 xxx-xxxx-xxxx";

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyWhatsApp();
  const { mutate: resendOtp, isPending: isResending } = useResendWhatsAppOtp();
  const { mutateAsync: completeOnboarding, isPending: isFinishing } =
    useCompleteOnboarding();

  const [screenState, setScreenState] = useState<ScreenState>("input");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  // Saat dilanjutkan dari OTP pending, jeda mulai dari 0; batas sebenarnya
  // dijaga backend (429) dan disinkronkan di handleResend
  const [cooldown, setCooldown] = useState(
    params.fresh === "1" ? RESEND_COOLDOWN : 0,
  );

  // Animasi sukses
  const iconScale = useSharedValue(0.85);
  const iconOpacity = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  // Cooldown timer kirim ulang
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Blokir hardware back saat state sukses
  useEffect(() => {
    if (screenState !== "success") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [screenState]);

  // Animasi masuk saat sukses
  const triggerSuccessAnimation = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    iconScale.value = withTiming(1, { duration: 350 });
    // eslint-disable-next-line react-hooks/immutability
    iconOpacity.value = withTiming(1, { duration: 350 });
  }, [iconScale, iconOpacity]);

  const handleVerify = () => {
    if (otp.length < OTP_LENGTH) {
      setOtpError("Masukkan semua 6 digit kode");
      return;
    }
    setOtpError(null);

    verifyOtp(
      { code: otp },
      {
        onSuccess: () => {
          setScreenState("success");
          triggerSuccessAnimation();
        },
        onError: (err) => {
          // Reset OTP agar user tidak edit parsial — lebih mudah ketik ulang
          setOtp("");
          setOtpError(describeVerifyError(err));
        },
      },
    );
  };

  const handleResend = () => {
    if (cooldown > 0 || isResending) return;
    resendOtp(undefined, {
      onSuccess: () => {
        setOtp("");
        setOtpError(null);
        setCooldown(RESEND_COOLDOWN);
        notify.success("Kode Terkirim", "Periksa WhatsApp-mu.");
      },
      onError: (err) => {
        // Selaraskan hitung mundur dengan sisa jeda dari backend bila singkat;
        // batas harian yang panjang cukup ditampilkan lewat pesan
        const retryAfter = getRetryAfterSeconds(err);
        if (retryAfter && retryAfter <= RESEND_COOLDOWN) {
          setCooldown(retryAfter);
        }
        notify.error("Gagal Mengirim", describeResendError(err));
      },
    });
  };

  const handleOpenBot = () => {
    Linking.openURL(`https://wa.me/${BOT_WA_NUMBER}`);
  };

  // Tandai onboarding selesai di server; setUser membuat guard memindahkan ke tabs,
  // jadi tidak ada router.replace di sini
  const handleFinish = async () => {
    try {
      await completeOnboarding(undefined);
    } catch {
      notify.error("Gagal Menyelesaikan", "Periksa koneksi, lalu coba lagi.");
    }
  };

  const isBusy = isVerifying || isResending;

  // ── State: sukses ────────────────────────────────────────────────────────────
  if (screenState === "success") {
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

        {/* Header — back menuju tabs, bukan kembali ke OTP */}
        <View className="flex-row items-center justify-between px-5 pt-4 h-[56px]">
          <TouchableOpacity
            onPress={handleFinish}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isFinishing}
            accessibilityRole="button"
            accessibilityLabel="Ke Dashboard"
          >
            <Ionicons name="arrow-back" size={22} color="#001d37" />
          </TouchableOpacity>
          <Text className="font-sans text-[#001d37] text-[16px] font-semibold tracking-[-0.08px] leading-[24px]">
            Verifikasi WhatsApp
          </Text>
          {/* Spacer agar judul tetap tengah */}
          <View style={{ width: 22 }} />
        </View>

        <View className="flex-1 px-5 pb-6 justify-center">
          <View
            className="w-full rounded-[28px] bg-white px-7 pt-7 pb-7 items-center"
            style={{
              shadowColor: "#001d37",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.06,
              shadowRadius: 20,
              elevation: 4,
            }}
          >
            {/* Ikon centang animasi */}
            <Animated.View
              style={iconStyle}
              className="h-[112px] w-[112px] items-center justify-center rounded-full bg-[rgba(127,249,204,0.25)]"
            >
              <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-[#006c50]">
                <Ionicons name="checkmark" size={40} color="#ffffff" />
              </View>
            </Animated.View>

            {/* Teks */}
            <View className="items-center pt-5 pb-2">
              <Text className="font-sans text-[#001d37] text-[22px] font-bold leading-[27.5px] text-center">
                WhatsApp Terhubung!
              </Text>
            </View>
            <Text className="font-sans text-[#43474d] text-[13px] font-normal leading-[21px] text-center pb-5">
              Mulai kirim pesan ke bot Cashify untuk mencatat transaksimu kapan
              saja.
            </Text>

            {/* Divider */}
            <View
              style={{ height: 1, backgroundColor: "#dee9fc", width: "100%" }}
              className="mb-5"
            />

            {/* Info nomor bot */}
            <View className="w-full items-center gap-1 pb-5">
              <Text className="font-sans text-[#74777e] text-[11px] font-normal leading-[16px]">
                Nomor bot Cashify
              </Text>
              <View
                className="flex-row items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: "rgba(127,249,204,0.15)" }}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#006c50" />
                <Text className="font-sans text-[#006c50] text-[13px] font-semibold leading-[19px]">
                  {BOT_WA_NUMBER.replace(/^62/, "+62 ")}
                </Text>
              </View>
            </View>

            {/* Tombol buka WhatsApp */}
            <TouchableOpacity
              className="h-[54px] w-full rounded-[16px] flex-row gap-2 items-center justify-center bg-[#006c50]"
              style={{
                shadowColor: "#006c50",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.22,
                shadowRadius: 10,
                elevation: 4,
              }}
              onPress={handleOpenBot}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
              <Text className="font-sans text-white text-[16px] font-semibold tracking-[-0.16px] leading-[22px]">
                Buka WhatsApp
              </Text>
            </TouchableOpacity>

            {/* Link sekunder ke dashboard */}
            <TouchableOpacity
              onPress={handleFinish}
              disabled={isFinishing}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="pt-4"
              accessibilityRole="button"
            >
              {isFinishing ? (
                <ActivityIndicator size="small" color="#74777e" />
              ) : (
                <Text className="font-sans text-[#74777e] text-[12px] font-normal leading-[18px] text-center">
                  Lanjut ke Cashify
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── State: input OTP ─────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <AmbientBlob
        color="green"
        className="right-[-80px] top-[-64px] w-[288px] h-[288px]"
      />
      <AmbientBlob
        color="blue"
        className="left-[-80px] bottom-[-80px] w-[320px] h-[320px]"
      />

      {/* Header — hanya back + judul, tanpa Lewati */}
      <View className="flex-row items-center justify-between px-5 pt-4 h-[56px]">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          disabled={isBusy}
        >
          <Ionicons name="arrow-back" size={22} color="#001d37" />
        </TouchableOpacity>
        <Text className="font-sans text-[#001d37] text-[16px] font-semibold tracking-[-0.08px] leading-[24px]">
          Verifikasi WhatsApp
        </Text>
        {/* Spacer agar judul tetap tengah */}
        <View style={{ width: 22 }} />
      </View>

      <View className="flex-1 px-5 pb-6">
        {/* ── Kartu konten ── */}
        <View
          className="w-full rounded-[24px] bg-white px-[25px] py-[22px] mt-4 gap-5"
          style={{
            borderWidth: 1,
            borderColor: "rgba(222,233,252,0.4)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 20,
            elevation: 3,
          }}
        >
          {/* Heading */}
          <View className="items-center gap-[6px]">
            <Text className="font-sans text-[#001d37] text-[20px] font-bold tracking-[-0.5px] leading-[25px] text-center">
              Masukkan Kode OTP
            </Text>
            <Text className="font-sans text-[#74777e] text-[13px] font-normal leading-[20px] text-center">
              Kode 6 digit dikirim ke WhatsApp{"\n"}
              <Text className="font-sans text-[#001d37] font-semibold">
                {phoneDisplay}
              </Text>
            </Text>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: "#dee9fc" }} />

          {/* OTP boxes */}
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (otpError) setOtpError(null);
            }}
            hasError={!!otpError}
            editable={!isBusy}
          />

          {/* Error atau spacer */}
          {otpError ? (
            <Text className="font-sans text-red-500 text-[12px] leading-[16px] text-center -mt-2">
              {otpError}
            </Text>
          ) : (
            <View style={{ height: 4 }} />
          )}

          {/* Kirim ulang */}
          <View className="items-center">
            {cooldown > 0 ? (
              <Text className="font-sans text-[#74777e] text-[12px] font-normal leading-[18px]">
                Kirim ulang dalam{" "}
                <Text className="font-sans text-[#001d37] font-semibold">
                  {formatCountdown(cooldown)}
                </Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={isResending}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#006c50" />
                ) : (
                  <Text className="font-sans text-[#006c50] text-[12px] font-semibold leading-[18px]">
                    Kirim ulang kode
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Spacer ── */}
        <View className="flex-1" />

        {/* ── Tombol verifikasi ── */}
        <View className="gap-3 pb-2">
          <TouchableOpacity
            className="h-[50px] w-full rounded-[16px] items-center justify-center bg-[#006c50]"
            style={{
              shadowColor: "#006c50",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 6,
              elevation: 3,
              opacity: otp.length < OTP_LENGTH && !isBusy ? 0.6 : 1,
            }}
            onPress={handleVerify}
            disabled={isBusy || otp.length < OTP_LENGTH}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="font-sans text-white text-[16px] font-semibold tracking-[-0.16px] leading-[24px]">
                Verifikasi
              </Text>
            )}
          </TouchableOpacity>

          {/* Catatan keamanan */}
          <View className="flex-row items-center justify-center gap-[6px]">
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color="rgba(116,119,126,0.8)"
            />
            <Text className="font-sans text-[rgba(116,119,126,0.8)] text-[11px] font-normal leading-[16.5px]">
              Kode hanya berlaku sekali dan akan kedaluwarsa
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

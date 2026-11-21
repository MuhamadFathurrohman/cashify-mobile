import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { KeyboardScreen } from "@/components/ui/KeyboardScreen";
import { notify } from "@/components/ui/notify";
import { StepDots } from "@/components/ui/StepIndicator";
import { useCompleteOnboarding } from "@/features/profile/useProfile";
import {
  useLinkWhatsApp,
  useWhatsAppStatus,
} from "@/features/whatsapp/useWhatsApp";
import { describeLinkError } from "@/features/whatsapp/whatsappErrors";
import {
  WhatsAppButtonSkeleton,
  WhatsAppCardSkeleton,
} from "@/features/whatsapp/WhatsAppSkeleton";
import { useKeyboardAwareScreen } from "@/hooks/useKeyboardAwareScreen";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { ComponentRef, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Aset lokal ───────────────────────────────────────────────────────────────
const iconWhatsapp = require("@/assets/icons/icon-whatsapp.png");

// ─── Fitur WhatsApp (sesuai fungsi backend: input transaksi via chat) ─────────
const FEATURES = [
  {
    icon: "chatbubble-outline" as const,
    label: "Catat transaksi cukup dengan chat WhatsApp",
  },
  {
    icon: "create-outline" as const,
    label: "Ketik pengeluaran, bot langsung mencatatnya",
  },
  {
    icon: "checkmark-circle-outline" as const,
    label: "Transaksi tersimpan otomatis tanpa buka app",
  },
] as const;

// ─── Helper ───────────────────────────────────────────────────────────────────
// Backend memvalidasi E.164 ketat dan tidak menormalisasi: +62, digit pertama 1-9,
// 8-12 digit setelahnya. Awalan 0 atau 62 yang diketik user dibuang di sini.
function normalizePhone(input: string): string | null {
  let national = input.replace(/\D/g, "");
  if (national.startsWith("62")) national = national.slice(2);
  else if (national.startsWith("0")) national = national.slice(1);
  return /^[1-9]\d{7,11}$/.test(national) ? `+62${national}` : null;
}

// Tampilan input memakai strip (3-4-sisa); permintaan ke backend tetap digits
function formatPhoneDisplay(digits: string): string {
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function OnboardingWhatsAppScreen() {
  const router = useRouter();
  const { mutate: linkWhatsApp, isPending: isLinking } = useLinkWhatsApp();
  const { data: linkStatus, isPending: isCheckingStatus } = useWhatsAppStatus();
  const { mutateAsync: completeOnboarding, isPending: isFinishing } =
    useCompleteOnboarding();

  const insets = useSafeAreaInsets();
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);
  const { scrollRef, keyboardVisible, onLayout } = useKeyboardAwareScreen({
    scrollTo: phoneRef,
    delay: 200,
  });

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  // isFinishing berasal dari satu mutation yang dipakai bersama. Penanda ini
  // memastikan spinner hanya muncul di tombol yang benar-benar ditekan pengguna.
  const [finishSource, setFinishSource] = useState<
    "header" | "footer" | "verified" | null
  >(null);

  // Selesai maupun Lewati sama-sama menandai onboarding selesai di server.
  // setUser membuat guard memindahkan ke tabs, jadi tidak ada router.replace di sini.
  const finishOnboarding = useCallback(async () => {
    try {
      await completeOnboarding(undefined);
    } catch {
      notify.error("Gagal Menyelesaikan", "Periksa koneksi, lalu coba lagi.");
    }
  }, [completeOnboarding]);

  const finishFrom = async (source: "header" | "footer" | "verified") => {
    setFinishSource(source);
    try {
      await finishOnboarding();
    } finally {
      setFinishSource(null);
    }
  };

  // Status server menentukan langkah ini, sekali per kunjungan:
  // pending → lanjut ke verifikasi tanpa meminta OTP baru (hemat kuota harian)
  // verified → langkah selesai, onboarding langsung ditutup
  // unlinked atau gagal cek → form biasa
  const statusHandled = useRef(false);
  useEffect(() => {
    if (!linkStatus || statusHandled.current) return;
    statusHandled.current = true;

    if (linkStatus.status === "pending" && linkStatus.masked_phone) {
      router.push({
        pathname: "/(onboarding)/whatsapp-verify",
        params: { maskedPhone: linkStatus.masked_phone, fresh: "0" },
      });
    } else if (linkStatus.status === "verified") {
      void finishOnboarding();
    }
  }, [linkStatus, router, finishOnboarding]);

  // Hanya angka yang disimpan; strip hanya untuk tampilan
  const handleChangePhone = (text: string) => {
    setPhone(text.replace(/\D/g, ""));
    if (phoneError) setPhoneError(null);
  };

  const handleLink = () => {
    if (!phone) {
      setPhoneError("Nomor WhatsApp wajib diisi");
      return;
    }
    const e164 = normalizePhone(phone);
    if (!e164) {
      setPhoneError("Nomor tidak valid");
      return;
    }
    Keyboard.dismiss();

    linkWhatsApp(
      { phone: e164 },
      {
        onSuccess: (data) => {
          // Teruskan nomor tersamar dari server agar layar verifikasi menampilkannya
          router.push({
            pathname: "/(onboarding)/whatsapp-verify",
            params: { maskedPhone: data.masked_phone, fresh: "1" },
          });
        },
        onError: (err) => {
          notify.error("Gagal Menghubungkan", describeLinkError(err));
        },
      },
    );
  };

  const isBusy = isLinking || isFinishing;
  const isVerified = linkStatus?.status === "verified";

  const footerPadding = keyboardVisible ? 12 : insets.bottom + 16;

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

      {/* ── Header ── */}
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 16, paddingBottom: 8 }}
      >
        {/* Pengganti tombol kembali: layar ini bisa menjadi layar pertama tanpa riwayat */}
        <View className="w-[22px]" />

        <Text className="font-sans text-[#001d37] text-[16px] font-semibold tracking-[-0.08px] leading-[24px] pl-5">
          Pengaturan Awal
        </Text>

        <TouchableOpacity
          onPress={() => finishFrom("header")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={isBusy}
          accessibilityRole="button"
        >
          {isFinishing && finishSource === "header" ? (
            <ActivityIndicator size="small" color="#74777e" />
          ) : (
            <Text className="font-sans text-[#74777e] text-[12px] font-normal leading-[18px]">
              Lewati
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardScreen
        className="bg-none"
        scrollRef={scrollRef}
        contentContainerClassName="px-5 pb-6"
        keyboardDismissMode="on-drag"
        onLayout={onLayout}
        footer={
          <View className="px-5 pt-2" style={{ paddingBottom: footerPadding }}>
            {isVerified ? (
              <TouchableOpacity
                className="h-[50px] w-full rounded-[16px] items-center justify-center bg-[#006c50]"
                onPress={() => finishFrom("verified")}
                disabled={isFinishing}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {isFinishing && finishSource === "verified" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="font-sans text-white text-[15px] font-semibold leading-[22.5px]">
                    Lanjut ke Beranda
                  </Text>
                )}
              </TouchableOpacity>
            ) : isCheckingStatus ? (
              <WhatsAppButtonSkeleton />
            ) : (
              <View className="gap-3 items-center">
                <TouchableOpacity
                  className="h-[54px] w-full rounded-[16px] items-center justify-center bg-[#006c50]"
                  style={{
                    shadowColor: "#006c50",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.18,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                  onPress={handleLink}
                  disabled={isBusy}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {isLinking ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="font-sans text-white text-[15px] font-semibold leading-[22.5px]">
                      Hubungkan WhatsApp
                    </Text>
                  )}
                </TouchableOpacity>

                {!keyboardVisible && (
                  <>
                    <TouchableOpacity
                      onPress={() => finishFrom("footer")}
                      disabled={isBusy}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                    >
                      {isFinishing && finishSource === "footer" ? (
                        <ActivityIndicator size="small" color="#74777e" />
                      ) : (
                        <Text className="font-sans text-[#74777e] text-[12px] font-normal leading-[18px] text-center">
                          Lewati, atur nanti
                        </Text>
                      )}
                    </TouchableOpacity>

                    <Text className="font-sans text-[#74777e] text-[10px] font-normal leading-[12.5px] text-center px-6">
                      Nomormu tidak akan dibagikan ke pihak ketiga.
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        }
      >
        <View>
          {/* ── Step indicator ── */}
          <View className="py-[8px]">
            <StepDots active={2} />
          </View>

          {isCheckingStatus ? (
            /* ── Memeriksa status tautan di server ── */
            <WhatsAppCardSkeleton />
          ) : isVerified ? (
            /* ── Sudah terhubung (misal dari sesi sebelumnya) ── */
            <View
              className="w-full rounded-[24px] bg-white px-[25px] py-[28px] mt-1 items-center gap-3"
              style={{
                borderWidth: 1,
                borderColor: "rgba(222,233,252,0.4)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <View className="h-[64px] w-[64px] items-center justify-center rounded-full bg-[#006c50]">
                <Ionicons name="checkmark" size={32} color="#ffffff" />
              </View>
              <Text className="font-sans text-[#001d37] text-[20px] font-bold tracking-[-0.5px] leading-[25px] text-center">
                WhatsApp Sudah Terhubung
              </Text>
              {linkStatus?.masked_phone ? (
                <Text className="font-sans text-[#74777e] text-[13px] font-normal leading-[21px] text-center">
                  {linkStatus.masked_phone} sudah tertaut ke akunmu.
                </Text>
              ) : null}
            </View>
          ) : (
            /* ── Form hubungkan nomor ── */
            <Animated.View
              layout={LinearTransition.duration(180)}
              className="w-full rounded-[24px] bg-white px-[25px] py-[22px] mt-1 gap-4"
              style={{
                borderWidth: 1,
                borderColor: "rgba(222,233,252,0.4)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              {/* Judul & deskripsi */}
              <View className="gap-[5px]">
                <View className="flex-row items-center gap-2">
                  <Image
                    source={iconWhatsapp}
                    className="h-9 w-9"
                    resizeMode="contain"
                  />
                  <Text className="font-sans text-[#001d37] text-[20px] font-bold tracking-[-0.5px] leading-[25px]">
                    Hubungkan WhatsApp
                  </Text>
                </View>
                <Text className="font-sans text-[#74777e] text-[13px] font-normal leading-[21px]">
                  Catat pengeluaran dan pemasukan langsung dari WhatsApp-mu.
                </Text>
              </View>

              {/* Divider 1 — setelah judul & deskripsi */}
              <View style={{ height: 1, backgroundColor: "#dee9fc" }} />

              {/* Daftar fitur dan divider bawahnya disembunyikan saat keyboard
                  terbuka agar kartu tidak terlalu tinggi dan tidak ada dua divider */}
              {!keyboardVisible && (
                <Animated.View exiting={FadeOut.duration(120)}>
                  <View>
                    {FEATURES.map((feature) => (
                      <View
                        key={feature.label}
                        className="flex-row items-center gap-3 py-[9px]"
                      >
                        <Ionicons
                          name={feature.icon}
                          size={16}
                          color="#006c50"
                        />
                        <Text className="font-sans text-[#43474d] text-[13px] font-normal leading-[18px] flex-1">
                          {feature.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Divider 2 — sebelum input nomor */}
                  <View style={{ height: 1, backgroundColor: "#dee9fc" }} />
                </Animated.View>
              )}

              {/* Input nomor */}
              <View className="gap-2">
                <Text className="font-sans text-[#001d37] text-[12px] font-semibold tracking-[-0.3px] leading-[18px]">
                  Nomor WhatsApp
                </Text>

                <View className="flex-row items-center gap-[10px]">
                  {/* Prefix +62 */}
                  <View
                    className="h-[50px] px-[14px] items-center justify-center rounded-[12px]"
                    style={{ backgroundColor: "#dee9fc" }}
                  >
                    <Text className="font-sans text-[#001d37] text-[14px] font-medium leading-[21px]">
                      +62
                    </Text>
                  </View>

                  {/* Input field */}
                  <View
                    className="flex-1 h-[50px] rounded-[16px] bg-white px-[16px] justify-center"
                    style={{
                      borderWidth: 1,
                      borderColor: phoneError ? "#f87171" : "#dee9fc",
                    }}
                  >
                    <TextInput
                      ref={phoneRef}
                      value={formatPhoneDisplay(phone)}
                      onChangeText={handleChangePhone}
                      keyboardType="phone-pad"
                      placeholder="812-3456-7890"
                      placeholderTextColor="rgba(116,119,126,0.7)"
                      className="font-sans text-[#001d37] text-[14px] font-normal leading-[21px]"
                      style={{ padding: 0 }}
                      underlineColorAndroid="transparent"
                      editable={!isBusy}
                      maxLength={16}
                      accessibilityLabel="Nomor WhatsApp tanpa kode negara"
                    />
                  </View>
                </View>

                {phoneError ? (
                  <Text className="font-sans text-red-500 text-[11px] leading-[14px] pl-[4px]">
                    {phoneError}
                  </Text>
                ) : (
                  <Text className="font-sans text-[#74777e] text-[11px] font-normal leading-[16.5px]">
                    Contoh: 812-3456-7890
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </KeyboardScreen>
    </View>
  );
}

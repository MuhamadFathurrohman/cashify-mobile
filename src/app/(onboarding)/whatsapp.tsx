import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { notify } from "@/components/ui/notify";
import { useCompleteOnboarding } from "@/features/profile/useProfile";
import {
  useLinkWhatsApp,
  useWhatsAppStatus,
} from "@/features/whatsapp/useWhatsApp";
import { describeLinkError } from "@/features/whatsapp/whatsappErrors";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// ─── Fitur WhatsApp (sesuai fungsi backend: input transaksi via chat) ─────────
const FEATURES = [
  "Catat transaksi cukup dengan chat WhatsApp",
  "Ketik pengeluaran, bot langsung mencatatnya",
  "Transaksi tersimpan otomatis tanpa buka app",
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

// ─── Dot Step Indicator ───────────────────────────────────────────────────────
function StepDots({ active }: { active: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: i === active ? 8 : 6,
            height: i === active ? 8 : 6,
            borderRadius: 9999,
            backgroundColor: i === active ? "#001d37" : "#c4c6ce",
          }}
        />
      ))}
    </View>
  );
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function OnboardingWhatsAppScreen() {
  const router = useRouter();
  const { mutate: linkWhatsApp, isPending: isLinking } = useLinkWhatsApp();
  const { data: linkStatus, isPending: isCheckingStatus } = useWhatsAppStatus();
  const { mutateAsync: completeOnboarding, isPending: isFinishing } =
    useCompleteOnboarding();

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Selesai maupun Lewati sama-sama menandai onboarding selesai di server.
  // setUser membuat guard memindahkan ke tabs, jadi tidak ada router.replace di sini.
  const finishOnboarding = useCallback(async () => {
    try {
      await completeOnboarding(undefined);
    } catch {
      notify.error("Gagal Menyelesaikan", "Periksa koneksi, lalu coba lagi.");
    }
  }, [completeOnboarding]);

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

  // Hanya angka yang disimpan; format akhir dibentuk saat kirim
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
        <View className="flex-row items-center justify-between px-5 pt-4 h-[56px]">
          {/* Pengganti tombol kembali: layar ini bisa menjadi layar pertama tanpa riwayat */}
          <View className="w-[22px]" />

          <Text className="text-[#001d37] text-[16px] font-semibold tracking-[-0.08px] leading-[24px]">
            Pengaturan Awal
          </Text>

          <TouchableOpacity
            onPress={finishOnboarding}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isBusy}
            accessibilityRole="button"
          >
            <Text className="text-[#74777e] text-[12px] font-normal leading-[18px]">
              Lewati
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-5 pb-6">
          {/* ── Step indicator ── */}
          <View className="py-[8px]">
            <StepDots active={2} />
          </View>

          {isCheckingStatus ? (
            /* ── Memeriksa status tautan di server ── */
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color="#006c50" />
            </View>
          ) : isVerified ? (
            /* ── Sudah terhubung (misal dari sesi sebelumnya) ── */
            <>
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
                <Text className="text-[#001d37] text-[20px] font-bold tracking-[-0.5px] leading-[25px] text-center">
                  WhatsApp Sudah Terhubung
                </Text>
                {linkStatus?.masked_phone ? (
                  <Text className="text-[#74777e] text-[13px] font-normal leading-[21px] text-center">
                    {linkStatus.masked_phone} sudah tertaut ke akunmu.
                  </Text>
                ) : null}
              </View>

              <View className="flex-1" />

              <View className="gap-3 items-center pb-2">
                <TouchableOpacity
                  className="h-[50px] w-full rounded-[16px] items-center justify-center bg-[#006c50]"
                  onPress={finishOnboarding}
                  disabled={isFinishing}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {isFinishing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-white text-[15px] font-semibold leading-[22.5px]">
                      Lanjut ke Cashify
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* ── Form hubungkan nomor ── */
            <>
              <View
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
                  <Text className="text-[#001d37] text-[20px] font-bold tracking-[-0.5px] leading-[25px]">
                    Hubungkan WhatsApp
                  </Text>
                  <Text className="text-[#74777e] text-[13px] font-normal leading-[21px]">
                    Catat pengeluaran dan pemasukan langsung dari WhatsApp-mu.
                  </Text>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: "#dee9fc" }} />

                {/* Daftar fitur */}
                <View>
                  {FEATURES.map((feature, i) => (
                    <View key={feature}>
                      <Text className="text-[#43474d] text-[13px] font-normal leading-[18px] py-[9px]">
                        {feature}
                      </Text>
                      {i < FEATURES.length - 1 && (
                        <View
                          style={{ height: 1, backgroundColor: "#dee9fc" }}
                        />
                      )}
                    </View>
                  ))}
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: "#dee9fc" }} />

                {/* Input nomor */}
                <View className="gap-2">
                  <Text className="text-[#001d37] text-[12px] font-semibold tracking-[-0.3px] leading-[18px]">
                    Nomor WhatsApp
                  </Text>

                  <View className="flex-row items-center gap-[10px]">
                    {/* Prefix +62 */}
                    <View
                      className="h-[50px] px-[14px] items-center justify-center rounded-[12px]"
                      style={{ backgroundColor: "#dee9fc" }}
                    >
                      <Text className="text-[#001d37] text-[14px] font-medium leading-[21px]">
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
                        value={phone}
                        onChangeText={handleChangePhone}
                        keyboardType="phone-pad"
                        placeholder="8xx-xxxx-xxxx"
                        placeholderTextColor="rgba(116,119,126,0.7)"
                        className="text-[#001d37] text-[14px] font-normal leading-[21px]"
                        style={{ padding: 0 }}
                        underlineColorAndroid="transparent"
                        editable={!isBusy}
                        maxLength={16}
                        accessibilityLabel="Nomor WhatsApp tanpa kode negara"
                      />
                    </View>
                  </View>

                  {phoneError ? (
                    <Text className="text-red-500 text-[11px] leading-[14px] pl-[4px]">
                      {phoneError}
                    </Text>
                  ) : (
                    <Text className="text-[#74777e] text-[11px] font-normal leading-[16.5px]">
                      Contoh: 0812-3456-7890
                    </Text>
                  )}
                </View>
              </View>

              {/* ── Spacer ── */}
              <View className="flex-1" />

              {/* ── Bottom action ── */}
              <View className="gap-3 items-center pb-2">
                {/* Tombol utama */}
                <TouchableOpacity
                  className="h-[50px] w-full rounded-[16px] items-center justify-center bg-[#006c50]"
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
                    <Text className="text-white text-[15px] font-semibold leading-[22.5px]">
                      Hubungkan WhatsApp
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Link lewati */}
                <TouchableOpacity
                  onPress={finishOnboarding}
                  disabled={isBusy}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                >
                  {isFinishing ? (
                    <ActivityIndicator size="small" color="#74777e" />
                  ) : (
                    <Text className="text-[#74777e] text-[12px] font-normal leading-[18px] text-center">
                      Lewati, atur nanti
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Privacy note */}
                <Text className="text-[#74777e] text-[10px] font-normal leading-[12.5px] text-center px-6">
                  Nomormu tidak akan dibagikan ke pihak ketiga.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

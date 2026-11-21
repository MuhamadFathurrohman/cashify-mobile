import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { KeyboardScreen } from "@/components/ui/KeyboardScreen";
import { notify } from "@/components/ui/notify";
import { StepDots } from "@/components/ui/StepIndicator";
import { useOnboardingStore } from "@/features/onboarding/onboardingStore";
import { useUpdateProfile } from "@/features/profile/useProfile";
import { useKeyboardAwareScreen } from "@/hooks/useKeyboardAwareScreen";
import { formatInputAmount, parseRawAmount } from "@/utils/currency";
import { useRouter } from "expo-router";
import { ComponentRef, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Konstanta ────────────────────────────────────────────────────────────────
const MAX_BALANCE = 2_147_483_647; // INT32 max (batas backend)
const PRESETS = [100_000, 500_000, 1_000_000] as const;
const MAX_MESSAGE = `Maksimal ${formatInputAmount(String(MAX_BALANCE))}`;

function formatPreset(value: number): string {
  if (value >= 1_000_000) return `+${value / 1_000_000} jt`;
  return `+${(value / 1000).toFixed(0)} rb`;
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function InitialBalanceScreen() {
  const router = useRouter();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const markBalanceDone = useOnboardingStore((s) => s.markBalanceDone);

  const insets = useSafeAreaInsets();
  const nominalRef = useRef<ComponentRef<typeof TextInput>>(null);
  const { scrollRef, keyboardVisible, onLayout } = useKeyboardAwareScreen({
    scrollTo: nominalRef,
    delay: 200,
  });

  const [rawValue, setRawValue] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  // "Lewati" tidak mengirim request, tapi tetap butuh indikator karena
  // markBalanceDone menulis SecureStore sebelum navigasi.
  const [isSkipping, setIsSkipping] = useState(false);

  const displayValue = isFocused
    ? inputText
    : formatInputAmount(String(rawValue));

  // Hanya angka yang masuk; format ribuan memakai helper bersama di utils/currency
  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) {
      setRawValue(0);
      setInputText("");
      setBalanceError(null);
      return;
    }
    const parsed = parseRawAmount(digits);
    if (parsed > MAX_BALANCE) {
      setBalanceError(MAX_MESSAGE);
      return;
    }
    setBalanceError(null);
    setRawValue(parsed);
    setInputText(formatInputAmount(digits));
  };

  const handlePreset = (amount: number) => {
    const requested = rawValue + amount;
    const next = Math.min(requested, MAX_BALANCE);
    setRawValue(next);
    setInputText(formatInputAmount(String(next)));
    setBalanceError(requested > MAX_BALANCE ? MAX_MESSAGE : null);
  };

  // Catat progres lalu pindah. Replace, bukan push: onboarding hanya maju,
  // dan saat resume layar ini bisa menjadi layar pertama tanpa riwayat
  const goToWhatsApp = async () => {
    await markBalanceDone();
    router.replace("/(onboarding)/whatsapp");
  };

  const handleContinue = async () => {
    try {
      await updateProfile({ initial_balance: rawValue });
    } catch {
      notify.error("Gagal Menyimpan", "Saldo awal tidak tersimpan. Coba lagi.");
      return;
    }
    await goToWhatsApp();
  };

  // Lewati = saldo tetap 0 (default server), tanpa API call
  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await goToWhatsApp();
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <AmbientBlob
        color="green"
        className="right-[-80px] top-[-48px] w-[288px] h-[288px]"
      />
      <AmbientBlob
        color="blue"
        className="left-[-80px] bottom-[224px] w-[320px] h-[320px]"
      />

      {/* ── Header ── */}
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 16, paddingBottom: 8 }}
      >
        {/* Pengganti tombol kembali: menjaga posisi judul tetap sama */}
        <View className="w-[22px]" />

        <Text className="font-sans text-[#001d37] text-[16px] font-semibold tracking-[-0.4px] leading-[24px] pl-5">
          Pengaturan Awal
        </Text>

        <TouchableOpacity
          onPress={handleSkip}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={isPending || isSkipping}
          accessibilityRole="button"
        >
          {isSkipping ? (
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
          <View
            className="px-5 pt-2"
            style={{
              paddingBottom: keyboardVisible ? 12 : insets.bottom + 16,
            }}
          >
            <TouchableOpacity
              className="h-[54px] w-full rounded-[16px] items-center justify-center bg-[#006c50]"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
              }}
              onPress={handleContinue}
              disabled={isPending}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-sans text-white text-[16px] font-semibold tracking-[-0.16px] leading-[24px]">
                  Lanjutkan
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
      >
        <View>
          {/* ── Step indicator ── */}
          <View className="py-[10px]">
            <StepDots active={1} />
          </View>

          {/* ── Kartu input saldo ── */}
          <View
            className="w-full rounded-[24px] bg-white px-[25px] pt-[20px] pb-[22px] mt-1"
            style={{
              borderWidth: 1,
              borderColor: "rgba(222,233,252,0.4)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.04,
              shadowRadius: 15,
              elevation: 3,
            }}
          >
            {/* Label */}
            <Text className="font-sans text-[#001d37] text-[12px] font-semibold leading-[18px] pb-[12px]">
              Saldo Awal Akun
            </Text>

            {/* Input nominal besar — mengikuti pola TransactionForm: "Rp" absolut
                dan input selebar kartu agar angka panjang tidak terpotong */}
            <View className="relative w-full items-center justify-center pb-[4px]">
              <Text
                style={{ top: 3 }}
                className=" absolute left-3 font-sans text-[24px] font-bold tracking-[-0.7px] text-[#001d37]"
              >
                Rp
              </Text>
              <TextInput
                ref={nominalRef}
                className={`h-12 w-full p-0 text-center font-sans font-bold text-[#001d37] tracking-[-0.7px] ${
                  displayValue.length > 11 ? "text-[26px]" : "text-[32px]"
                }`}
                value={displayValue}
                onChangeText={handleChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(116,119,126,0.5)"
                underlineColorAndroid="transparent"
                maxLength={13}
                accessibilityLabel="Nominal saldo awal"
              />
              {/* Underline aktif */}
              <View
                style={{
                  height: 1.5,
                  width: "100%",
                  backgroundColor: balanceError
                    ? "#f87171"
                    : isFocused
                      ? "#006c50"
                      : "#dee9fc",
                  marginTop: 4,
                }}
              />
            </View>

            {/* Hint / error — tinggi dicadangkan agar kartu tidak bergeser */}
            <View className="pt-[10px] pb-[14px]">
              <View className="h-[17px] justify-center">
                {balanceError ? (
                  <Text className="font-sans text-red-500 text-[11px] leading-[17px] text-center">
                    {balanceError}
                  </Text>
                ) : (
                  <Text className="font-sans text-[#74777e] text-[11px] font-normal leading-[17px] text-center">
                    Total semua saldo: rekening bank, dompet, dan uang tunai.
                  </Text>
                )}
              </View>
            </View>

            {/* Preset chips */}
            <View className="flex-row gap-2 justify-center">
              {PRESETS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => handlePreset(amount)}
                  className="px-[13px] py-[5px] rounded-full bg-white"
                  style={{
                    borderWidth: 1,
                    borderColor: "#dee9fc",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Tambah ${formatPreset(amount)}`}
                >
                  <Text className="font-sans text-[#43474d] text-[11px] font-medium leading-[16.5px]">
                    {formatPreset(amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </KeyboardScreen>
    </View>
  );
}

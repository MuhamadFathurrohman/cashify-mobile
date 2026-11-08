import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { notify } from "@/components/ui/notify";
import { useOnboardingStore } from "@/features/onboarding/onboardingStore";
import { useUpdateProfile } from "@/features/profile/useProfile";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// ─── Konstanta ────────────────────────────────────────────────────────────────
const MAX_BALANCE = 2_147_483_647; // INT32 max (batas backend)
const PRESETS = [100_000, 500_000, 1_000_000] as const;

// ─── Helper format ────────────────────────────────────────────────────────────
function formatDisplay(value: number): string {
  if (value === 0) return "0";
  return value.toLocaleString("id-ID");
}

function formatPreset(value: number): string {
  if (value >= 1_000_000) return `+${value / 1_000_000} jt`;
  return `+${(value / 1_000).toFixed(0)} rb`;
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
export default function InitialBalanceScreen() {
  const router = useRouter();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const markBalanceDone = useOnboardingStore((s) => s.markBalanceDone);

  const [rawValue, setRawValue] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Hanya angka yang masuk; strip format ribuan sebelum parse
  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) {
      setRawValue(0);
      setInputText("");
      return;
    }
    const parsed = parseInt(digits, 10);
    if (parsed > MAX_BALANCE) return; // tolak diam-diam bila melebihi batas
    setRawValue(parsed);
    setInputText(digits);
  };

  const handlePreset = (amount: number) => {
    const next = Math.min(rawValue + amount, MAX_BALANCE);
    setRawValue(next);
    setInputText(String(next));
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
    await goToWhatsApp();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
        <View className="flex-row items-center justify-between px-5 pt-4 h-[56px]">
          {/* Pengganti tombol kembali: menjaga posisi judul tetap sama */}
          <View className="w-[22px]" />

          <Text className="text-[#001d37] text-[16px] font-semibold tracking-[-0.4px] leading-[24px]">
            Pengaturan Awal
          </Text>

          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isPending}
            accessibilityRole="button"
          >
            <Text className="text-[#74777e] text-[12px] font-normal leading-[18px]">
              Lewati
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-5 pb-6">
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
            <Text className="text-[#001d37] text-[12px] font-semibold leading-[18px] pb-[12px]">
              Saldo Awal Akun
            </Text>

            {/* Input nominal besar */}
            <View className="items-center pb-[4px]">
              <View className="flex-row items-baseline gap-[6px]">
                <Text className="text-[#001d37] text-[28px] font-bold tracking-[-0.7px] leading-[42px]">
                  Rp
                </Text>
                <TextInput
                  value={isFocused ? inputText : formatDisplay(rawValue)}
                  onChangeText={handleChangeText}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="rgba(116,119,126,0.5)"
                  className="text-[#001d37] text-[32px] font-bold tracking-[-0.8px] leading-[48px] min-w-[60px]"
                  style={{ padding: 0 }}
                  underlineColorAndroid="transparent"
                  maxLength={13}
                  accessibilityLabel="Nominal saldo awal"
                />
              </View>
              {/* Underline aktif */}
              <View
                style={{
                  height: 1.5,
                  width: "100%",
                  backgroundColor: isFocused ? "#006c50" : "#dee9fc",
                  marginTop: 4,
                }}
              />
            </View>

            {/* Hint */}
            <Text className="text-[#74777e] text-[11px] font-normal leading-[17px] text-center pt-[10px] pb-[14px]">
              Total semua saldo: rekening bank, dompet, dan uang tunai.
            </Text>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "#dee9fc",
                marginBottom: 14,
              }}
            />

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
                  <Text className="text-[#43474d] text-[11px] font-medium leading-[16.5px]">
                    {formatPreset(amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Spacer ── */}
          <View className="flex-1" />

          {/* ── Bottom area ── */}
          <View className="gap-[10px] items-center pb-2">
            <Text className="text-[#74777e] text-[11px] font-normal leading-[16.5px]">
              Bisa diubah kapan saja di pengaturan profil.
            </Text>

            <TouchableOpacity
              className="h-[50px] w-full rounded-[16px] items-center justify-center bg-[#006c50]"
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
                <Text className="text-white text-[16px] font-semibold tracking-[-0.16px] leading-[24px]">
                  Lanjutkan
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

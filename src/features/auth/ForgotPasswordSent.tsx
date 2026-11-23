import { useCooldownRemaining } from "@/features/auth/forgotPasswordCooldown";
import { formatCountdown } from "@/utils/duration";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

const cardShadow = {
  shadowColor: "#19324d",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 3,
} as const;

// ─── Tombol kirim ulang (hanya bagian ini yang dirender ulang tiap detik) ─────
function ResendButton({
  email,
  isPending,
  onResend,
}: {
  email: string;
  isPending: boolean;
  onResend: () => void;
}) {
  const remaining = useCooldownRemaining(email);
  const disabled = isPending || remaining > 0;

  return (
    <View className="w-full items-center gap-2">
      <TouchableOpacity
        className={`h-[50px] w-full flex-row items-center justify-center gap-2 rounded-[16px] border border-[#006c50] bg-white ${
          disabled ? "opacity-50" : ""
        }`}
        onPress={onResend}
        disabled={disabled}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#006c50" />
        ) : (
          <>
            <Ionicons name="refresh" size={16} color="#006c50" />
            <Text className="font-sans text-[#006c50] text-[14px] font-semibold leading-[20px]">
              Kirim Ulang
            </Text>
          </>
        )}
      </TouchableOpacity>
      {/* Tinggi baris countdown selalu dipesan agar kartu tidak menyusut ketika
          hitungan habis dan tidak menggeser seluruh tata letak layar. */}
      <View className="h-[18px] justify-center">
        {remaining > 0 && (
          <Text className="font-sans text-[#74777e] text-[12px] font-normal leading-[18px]">
            Tersedia dalam {formatCountdown(remaining)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
interface ForgotPasswordSentProps {
  email: string;
  isPending: boolean;
  onResend: () => void;
}

// Kartu "terkirim" pada layar forgot-password; navigasi back diatur layar induk
export function ForgotPasswordSent({
  email,
  isPending,
  onResend,
}: ForgotPasswordSentProps) {
  return (
    <View
      className="w-full items-center gap-5 rounded-[28px] border border-[rgba(196,198,206,0.3)] bg-white p-[25px]"
      style={cardShadow}
    >
      <View className="h-16 w-16 items-center justify-center rounded-full bg-[#006c50]">
        <Ionicons name="mail-outline" size={28} color="#ffffff" />
      </View>

      <View className="items-center gap-2">
        <Text className="font-sans text-[#001d37] text-[20px] font-semibold leading-[26px] text-center">
          Periksa Email Kamu
        </Text>
        <Text className="font-sans text-[#43474d] text-[13px] font-normal leading-[20px] text-center">
          Jika{" "}
          <Text className="font-sans text-[#001d37] font-semibold">
            {email}
          </Text>{" "}
          terdaftar, kami akan mengirim tautan untuk mereset kata sandi.
        </Text>
      </View>

      <View className="w-full flex-row items-start gap-2 rounded-[12px] bg-[#dee9fc] px-4 py-3">
        <Ionicons
          name="information-circle-outline"
          size={16}
          color="#43474d"
          style={{ marginTop: 1 }}
        />
        <Text className="font-sans flex-1 text-[#43474d] text-[12px] font-normal leading-[18px]">
          Email belum masuk? Cek folder Spam atau Promosi.
        </Text>
      </View>

      <ResendButton email={email} isPending={isPending} onResend={onResend} />
    </View>
  );
}

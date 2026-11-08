import { AmbientBlob } from "@/components/ui/AmbientBlob";
import { useOnboardingStore } from "@/features/onboarding/onboardingStore";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

// ─── Aset lokal ───────────────────────────────────────────────────────────────
const logoIcon = require("@/assets/images/logo-icon-cashify.png");
const logoText = require("@/assets/images/logo-text-cashify.png");

// ─── Daftar fitur ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "trending-up-outline" as const,
    label: "Catat pemasukan & pengeluaran",
  },
  {
    icon: "pie-chart-outline" as const,
    label: "Pantau anggaran bulanan",
  },
  {
    icon: "document-text-outline" as const,
    label: "Laporan keuangan ringkas",
  },
] as const;

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
export default function WelcomeScreen() {
  const router = useRouter();
  const markWelcomeDone = useOnboardingStore((s) => s.markWelcomeDone);

  // Replace, bukan push: onboarding hanya maju, dan saat resume layar ini
  // tidak boleh muncul lagi di bawah layar berikutnya
  const handleStart = async () => {
    await markWelcomeDone();
    router.replace("/(onboarding)/initial-balance");
  };

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

      <View className="flex-1 px-5 pt-14 pb-6 justify-between">
        {/* ── Logo ── */}
        <View className="items-center pt-2">
          <Image
            source={logoIcon}
            className="w-[86px] h-[79px]"
            resizeMode="contain"
          />
          <Image
            source={logoText}
            className="w-[87px] h-[27px] mt-3"
            resizeMode="contain"
          />
        </View>

        {/* ── Greeting + Feature card ── */}
        <View className="gap-6">
          <View className="items-center gap-2 px-1">
            <Text className="text-[#001d37] text-[24px] font-bold leading-[32px] tracking-[-0.6px] text-center">
              Halo! 👋
            </Text>
            <Text className="text-[#43474d] text-[14px] font-normal leading-[20px] text-center">
              Yuk, kendalikan keuanganmu.
            </Text>
          </View>

          {/* Feature card */}
          <View
            className="w-full rounded-[24px] bg-white px-[25px] py-[20px]"
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,108,80,0.06)",
              shadowColor: "#2c3437",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 20,
              elevation: 3,
            }}
          >
            {FEATURES.map((f, i) => (
              <View key={f.icon}>
                <View className="flex-row items-center gap-3 py-[10px]">
                  <Ionicons name={f.icon} size={20} color="#006c50" />
                  <Text className="text-[#43474d] text-[14px] font-normal leading-[20px] flex-1">
                    {f.label}
                  </Text>
                </View>
                {i < FEATURES.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#dee9fc",
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Step indicator + CTA ── */}
        <View className="gap-4 items-center">
          <StepDots active={0} />
          <TouchableOpacity
            className="h-[50px] w-full rounded-[16px] items-center justify-center bg-[#006c50]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
            }}
            onPress={handleStart}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text className="text-white text-[16px] font-semibold tracking-[-0.16px] leading-[24px]">
              Mulai Sekarang
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

import { Text, View } from "react-native";

interface StepIndicatorProps {
  // Langkah aktif (mulai dari 1); segmen sampai langkah ini berwarna aktif
  step: number;
  total?: number;
}

// Dot indicator untuk onboarding: tiga titik dengan titik aktif lebih besar.
// Dipisah dari StepIndicator (bar) agar tampilan register tidak berubah.
export function StepDots({ active }: { active: number }) {
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

export function StepIndicator({ step, total = 2 }: StepIndicatorProps) {
  const label = `Langkah ${step} dari ${total}`;

  return (
    <View className="items-center" accessible accessibilityLabel={label}>
      <Text className="font-sans text-[#74777e] text-[11px] font-normal tracking-[0.275px] leading-[16.5px]">
        {label}
      </Text>
      {/* Lebar grup tetap 112; segmen flex-1 agar jumlah langkah bebas */}
      <View className="w-[112px] flex-row gap-[6px] pt-2">
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            className={`flex-1 h-1 rounded-full ${
              index < step ? "bg-[#006c50]" : "bg-[rgba(190,201,194,0.4)]"
            }`}
          />
        ))}
      </View>
    </View>
  );
}

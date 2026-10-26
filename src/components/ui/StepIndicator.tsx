import { Text, View } from "react-native";

interface StepIndicatorProps {
  // Langkah aktif (mulai dari 1); segmen sampai langkah ini berwarna aktif
  step: number;
  total?: number;
}

export function StepIndicator({ step, total = 2 }: StepIndicatorProps) {
  const label = `Langkah ${step} dari ${total}`;

  return (
    <View className="items-center" accessible accessibilityLabel={label}>
      <Text className="text-[#74777e] text-[11px] font-normal tracking-[0.275px] leading-[16.5px]">
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

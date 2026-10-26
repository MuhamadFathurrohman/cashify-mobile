import { Text, View } from "react-native";

export type StrengthLevel = "none" | "weak" | "medium" | "strong";

// Class ditulis sebagai string utuh agar terbaca Tailwind
const LEVELS = {
  weak: {
    filled: 1,
    label: "Lemah",
    barClass: "bg-[#f87171]",
    textClass: "text-[#f87171]",
  },
  medium: {
    filled: 2,
    label: "Sedang",
    barClass: "bg-[#f59e0b]",
    textClass: "text-[#f59e0b]",
  },
  strong: {
    filled: 3,
    label: "Kuat",
    barClass: "bg-[#006c50]",
    textClass: "text-[#006c50]",
  },
} as const;

const SEGMENTS = [1, 2, 3] as const;

interface PasswordStrengthMeterProps {
  strength: StrengthLevel;
}

export function PasswordStrengthMeter({
  strength,
}: PasswordStrengthMeterProps) {
  const level = strength === "none" ? null : LEVELS[strength];

  return (
    <View
      className="gap-[6px] pt-1"
      accessible
      accessibilityLabel={
        level
          ? `Kekuatan kata sandi: ${level.label}`
          : "Kekuatan kata sandi belum dinilai"
      }
    >
      <View className="flex-row gap-[6px]">
        {SEGMENTS.map((segment) => (
          <View
            key={segment}
            className={`flex-1 h-1 rounded-full ${
              level && segment <= level.filled
                ? level.barClass
                : "bg-[rgba(190,201,194,0.4)]"
            }`}
          />
        ))}
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-[#74777e] text-[10px] font-normal leading-[15px]">
          Kekuatan kata sandi:
        </Text>
        {level && (
          <Text
            className={`${level.textClass} text-[11px] font-medium leading-[16.5px]`}
          >
            {level.label}
          </Text>
        )}
      </View>
    </View>
  );
}

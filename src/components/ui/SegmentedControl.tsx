import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

// Nilai dari Figma (node 216:606)
const COLORS = {
  track: "rgba(226,232,240,0.7)",
  active: "#1a2b49",
  activeText: "#ffffff",
  inactiveText: "#475569",
} as const;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        gap: 4,
        padding: 4,
        borderRadius: 16,
        backgroundColor: COLORS.track,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const color = selected ? COLORS.activeText : COLORS.inactiveText;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: selected ? COLORS.active : "transparent",
            }}
          >
            {option.icon ? (
              <Ionicons name={option.icon} size={14} color={color} />
            ) : null}
            <Text className="font-sans"
              style={{
                fontSize: 12,
                lineHeight: 16,
                fontWeight: selected ? "700" : "600",
                color,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

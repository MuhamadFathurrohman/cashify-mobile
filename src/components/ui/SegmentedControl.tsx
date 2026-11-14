import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  // Kelas NativeWind untuk pembungkus ikon (mis. "rotate-45" membuat panah lurus jadi diagonal)
  iconClassName?: string;
  // Kelas latar saat terpilih (mis. "bg-[#ed7658]"); kosong = bg-[#1a2b49] bawaan
  activeClassName?: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // "md" = ukuran asli (Figma 216:606); "lg" = toggle form transaksi (Figma 69:2506)
  size?: "md" | "lg";
  // Kelas latar kontainer
  trackClassName?: string;
  // Kelas warna teks tidak terpilih, dan warna ikonnya (prop `color` Ionicons tidak bisa
  // diisi kelas, jadi kedua nilai ini harus dijaga sama)
  inactiveTextClassName?: string;
  inactiveIconColor?: string;
}

// Nilai dari Figma (node 216:606). Kelas ditulis utuh (bukan dirakit) agar terbaca Tailwind.
const SIZES = {
  md: {
    segment: "px-4 py-2",
    text: "text-xs leading-4",
    selectedWeight: "font-bold",
    iconSize: 14,
  },
  lg: {
    segment: "px-2 py-[10px]",
    text: "text-base leading-[22px] tracking-[-0.16px]",
    selectedWeight: "font-semibold",
    iconSize: 12,
  },
} as const;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  trackClassName = "bg-[rgba(226,232,240,0.7)]",
  inactiveTextClassName = "text-[#475569]",
  inactiveIconColor = "#475569",
}: SegmentedControlProps<T>) {
  const metrics = SIZES[size];

  return (
    <View
      accessibilityRole="tablist"
      className={`flex-row gap-1 rounded-2xl p-1 ${trackClassName}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            className="flex-1"
          >
            {/*
              ⚠️ Jangan "disederhanakan" dengan menukar kelas bg pada View bersudut ini.
              Saat kelas elemen bersudut berubah setelah tampil, radiusnya hilang (teramati
              di emulator dengan NativeWind). Karena itu penampung bersudut ini statis
              (kelasnya tidak pernah berubah, overflow-hidden ikut memotong), dan latar
              terpilih adalah lapisan terpisah yang dipasang baru saat terpilih dan
              dilepas saat tidak.
            */}
            <View className="overflow-hidden rounded-xl">
              {selected ? (
                <View
                  className={`absolute inset-0 rounded-xl ${
                    option.activeClassName ?? "bg-[#1a2b49]"
                  }`}
                />
              ) : null}
              <View
                className={`flex-row items-center justify-center gap-[6px] ${metrics.segment}`}
              >
                {option.icon ? (
                  <View className={option.iconClassName}>
                    <Ionicons
                      name={option.icon}
                      size={metrics.iconSize}
                      color={selected ? "#ffffff" : inactiveIconColor}
                    />
                  </View>
                ) : null}
                <Text
                  className={`font-sans ${metrics.text} ${
                    selected
                      ? `${metrics.selectedWeight} text-white`
                      : `font-semibold ${inactiveTextClassName}`
                  }`}
                >
                  {option.label}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

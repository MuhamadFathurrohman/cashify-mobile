import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface ComingSoonProps {
  icon: IconName;
  title: string;
  description: string;
}

// Placeholder untuk tab yang fiturnya belum ada (backend atau desain belum siap)
export function ComingSoon({ icon, title, description }: ComingSoonProps) {
  return (
    <View className="flex-1 items-center justify-center bg-[#f8f9ff] px-10">
      <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-[#dee9fc]">
        <Ionicons name={icon} size={32} color="#001d37" />
      </View>
      <Text className="mt-5 text-center text-[20px] font-bold leading-[25px] tracking-[-0.5px] text-[#001d37]">
        {title}
      </Text>
      <Text className="mt-2 text-center text-[13px] font-normal leading-[21px] text-[#74777e]">
        {description}
      </Text>
    </View>
  );
}

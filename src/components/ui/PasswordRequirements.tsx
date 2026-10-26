import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";

export interface RequirementItem {
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  items: RequirementItem[];
  title?: string;
}

// Hanya presentasi: status syarat dihitung pemanggil (features/auth/passwordPolicy)
export function PasswordRequirements({
  items,
  title = "Syarat keamanan kata sandi:",
}: PasswordRequirementsProps) {
  return (
    <View className="gap-1 border-t border-[#f1f5f9] pt-[5px]">
      <Text className="text-[#74777e] text-[11px] font-medium leading-[16.5px]">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-y-[6px]">
        {items.map((item) => (
          <View
            key={item.label}
            className="w-1/2 h-[15px] flex-row items-center gap-1"
            accessible
            accessibilityLabel={`${item.label}, ${
              item.met ? "terpenuhi" : "belum terpenuhi"
            }`}
          >
            <View className="w-[10px] items-center">
              {item.met ? (
                <Ionicons name="checkmark" size={10} color="#006c50" />
              ) : (
                <Ionicons name="ellipse-outline" size={7} color="#74777e" />
              )}
            </View>
            <Text
              className={`text-[10px] font-normal leading-[15px] ${
                item.met ? "text-[#006c50]" : "text-[#74777e]"
              }`}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

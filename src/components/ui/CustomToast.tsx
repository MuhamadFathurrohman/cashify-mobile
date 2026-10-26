import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

// Class harus string utuh (bukan hasil interpolasi) agar terdeteksi scanner Tailwind
const VARIANT_CONFIG = {
  success: {
    box: "bg-[#f2fbf5] border-[#52c974]",
    circle: "bg-[#34c759]",
    icon: "checkmark",
  },
  error: {
    box: "bg-[#fff5f5] border-[#f87171]",
    circle: "bg-[#ef4444]",
    icon: "close",
  },
  warning: {
    box: "bg-[#fffbf0] border-[#f59e0b]",
    circle: "bg-[#f59e0b]",
    icon: null, // dirender sebagai teks "!"
  },
  info: {
    box: "bg-[#f2f7ff] border-[#3b82f6]",
    circle: "bg-[#2563eb]",
    icon: "information",
  },
} as const;

export type CustomToastVariant = keyof typeof VARIANT_CONFIG;

type CustomToastProps = {
  id: string | number; // dipakai untuk toast.dismiss(id)
  variant: CustomToastVariant;
  title: string;
  description?: string;
};

// Shadow tetap lewat style: elevation Android tidak dipetakan class NativeWind
const SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 3,
} as const;

export function CustomToast({
  id,
  variant,
  title,
  description,
}: CustomToastProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <View
      className={`mx-4 flex-row items-center rounded-[16px] border-[1.5px] p-3 ${config.box}`}
      style={SHADOW}
    >
      {/* Lingkaran ikon */}
      <View
        className={`mr-3.5 h-8 w-8 items-center justify-center rounded-full ${config.circle}`}
      >
        {config.icon ? (
          <Ionicons name={config.icon} size={18} color="#ffffff" />
        ) : (
          <Text className="text-[18px] font-extrabold leading-[22px] text-white">
            !
          </Text>
        )}
      </View>

      {/* Teks: tanpa numberOfLines agar pesan terbaca penuh */}
      <View className="mr-1 flex-1">
        <Text className="text-[13px] font-bold leading-[20px] tracking-[-0.3px] text-[#1e293b]">
          {title}
        </Text>
        {description ? (
          <Text className="mt-0.5 text-[11px] font-normal leading-[17px] text-[#64748b]">
            {description}
          </Text>
        ) : null}
      </View>

      {/* Tombol tutup */}
      <TouchableOpacity
        onPress={() => toast.dismiss(id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="p-1.5"
      >
        <Ionicons name="close" size={14} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}

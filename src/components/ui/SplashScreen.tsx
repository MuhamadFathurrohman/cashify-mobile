import { Image, Text, View } from "react-native";

const LOGO_ICON = require("@/assets/images/logo-icon-cashify.png");
const LOGO_TEXT = require("@/assets/images/logo-text-cashify.png");

export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#f8f9ff]">
      {/* Ambients lingkaran hijau */}
      <View className="absolute right-[-80px] top-[-96px] rounded-full w-[288px] h-[288px] bg-[rgba(127,249,204,0.3)]" />

      {/* Ambient lingkaran biru muda */}
      <View className="absolute left-[-80px] bottom-[-112px] rounded-full w-[320px] h-[320px] bg-[rgba(222,233,252,0.6)]" />

      {/* Konten Tengah */}
      <View className="items-center justify-center">
        {/* logo icon */}
        <View
          className="p-2 rounded-[32px] items-center justify-center"
          style={{
            shadowColor: "rgba(25,50,77,0.1)",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 12,
          }}
        >
          <View
            className="bg-white border border-[rgba(196,198,206,0.3)] rounded-[28px] p-px items-center justify-center w-[112px] h-[112px]"
            style={{
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 15,
            }}
          >
            <Image
              source={LOGO_ICON}
              style={{ width: 80, height: 75 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Logo text dan tagline */}
        <View className="items-center pt-8">
          <Image
            source={LOGO_TEXT}
            style={{ width: 99, height: 31 }}
            resizeMode="contain"
          />
          <Text className="text-[#43474d] text-[14px] text-center mt-2 font-normal">
            Kelola Keuangan, Capai Tujuan
          </Text>
        </View>
      </View>
    </View>
  );
}

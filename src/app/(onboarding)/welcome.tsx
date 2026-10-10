import { Text, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-gray-800">
        Selamat Datang
      </Text>
      <Text className="text-sm text-gray-400 mt-1">
        Onboarding Step 1 — belum diimplementasi
      </Text>
    </View>
  );
}

import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-gray-800">
        Detail Transaksi
      </Text>
      <Text className="text-sm text-gray-400 mt-1">ID: {id}</Text>
      <Text className="text-sm text-gray-400 mt-1">
        Placeholder — belum diimplementasi
      </Text>
    </View>
  );
}

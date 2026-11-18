import { Pressable, Text, View } from "react-native";

// Banner saat refresh gagal: data lama tetap tampil (keputusan 3.9).
export function TransactionRefreshBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-[rgba(240,120,90,0.1)] px-4 py-3">
      <Text className="font-sans flex-1 text-xs leading-4 text-[#43474d]">
        Gagal menyegarkan. Data yang tampil mungkin belum terbaru.
      </Text>
      <Pressable
        onPress={onRetry}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Coba segarkan lagi"
      >
        <Text className="font-sans ml-3 text-xs font-semibold text-[#001d37]">
          Coba Lagi
        </Text>
      </Pressable>
    </View>
  );
}

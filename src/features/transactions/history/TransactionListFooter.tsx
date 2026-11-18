import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface TransactionListFooterProps {
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onRetry: () => void;
}

// Footer daftar: indikator saat memuat halaman berikutnya, atau pesan gagal + retry.
export function TransactionListFooter({
  isFetchingNextPage,
  isFetchNextPageError,
  onRetry,
}: TransactionListFooterProps) {
  if (isFetchingNextPage) {
    return (
      <View className="items-center py-4">
        <ActivityIndicator color="#006c50" />
      </View>
    );
  }
  if (isFetchNextPageError) {
    return (
      <View className="items-center py-4">
        <Text className="font-sans text-xs text-[#43474d]">
          Gagal memuat transaksi berikutnya.
        </Text>
        <Pressable
          onPress={onRetry}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Coba muat lagi"
          className="mt-2"
        >
          <Text className="font-sans text-xs font-semibold text-[#006c50]">
            Coba Lagi
          </Text>
        </Pressable>
      </View>
    );
  }
  return null;
}

import { Pressable, Text, View } from "react-native";

const DEFAULT_MESSAGE =
  "Gagal menyegarkan. Data yang tampil mungkin belum terbaru.";

interface RefreshErrorBannerProps {
  onRetry: () => void;
  // Bisa diganti bila konteks layar butuh kalimat khusus
  message?: string;
  // Saat true, tombol dinonaktifkan dan banner tetap tampil (tidak berkedip)
  retrying?: boolean;
}

// Banner saat refresh gagal sementara data lama masih tampil.
// Bedanya dengan ErrorState: layar tidak dikosongkan, pengguna tetap melihat data
// terakhir dan diberi tahu bahwa data itu mungkin belum terbaru.
export function RefreshErrorBanner({
  onRetry,
  message = DEFAULT_MESSAGE,
  retrying = false,
}: RefreshErrorBannerProps) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-[rgba(240,120,90,0.1)] px-4 py-3">
      <Text className="font-sans flex-1 text-xs leading-4 text-[#43474d]">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        disabled={retrying}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Coba segarkan lagi"
        accessibilityState={{ disabled: retrying, busy: retrying }}
      >
        <Text
          className="font-sans ml-3 text-xs font-semibold"
          style={{ color: retrying ? "#8a8d94" : "#001d37" }}
        >
          {retrying ? "Memuat…" : "Coba Lagi"}
        </Text>
      </Pressable>
    </View>
  );
}

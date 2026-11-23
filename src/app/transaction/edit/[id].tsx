import { ErrorState } from "@/components/ui/ErrorState";
import { TransactionHeader } from "@/features/transactions/TransactionHeader";
import { useTransactionDetail } from "@/features/transactions/detail/useTransactionDetail";
import { TransactionForm } from "@/features/transactions/form/TransactionForm";
import { TransactionFormSkeleton } from "@/features/transactions/form/TransactionFormSkeleton";
import { ApiRequestError } from "@/lib/api/client";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const FALLBACK_LOAD_ERROR =
  "Data transaksi belum bisa dimuat. Coba lagi sebentar lagi.";

function loadErrorMessage(error: unknown): string {
  return error instanceof ApiRequestError && error.code === "NETWORK_ERROR"
    ? error.message
    : FALLBACK_LOAD_ERROR;
}

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = useTransactionDetail(id);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/history");
  };

  const notFound =
    !id ||
    (detail.error instanceof ApiRequestError && detail.error.status === 404);

  let body;
  if (notFound) {
    body = (
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(196,198,206,0.25)" }}
        >
          <Ionicons name="receipt-outline" size={26} color="#43474d" />
        </View>
        <Text className="mt-4 font-sans text-base font-semibold text-[#121c2a]">
          Transaksi tidak ditemukan
        </Text>
        <Text className="mt-1 text-center font-sans text-sm leading-5 text-[#43474d]">
          Transaksi ini mungkin sudah dihapus.
        </Text>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke riwayat"
          className="mt-5 rounded-full px-6 py-[10px] active:opacity-90"
          style={{ backgroundColor: "#006c50" }}
        >
          <Text className="font-sans text-sm font-semibold text-white">
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  } else if (detail.isPending) {
    body = <TransactionFormSkeleton />;
  } else if (detail.isError || !detail.data) {
    body = (
      <View className="flex-1 px-5 pt-4">
        <ErrorState
          title="Gagal memuat transaksi"
          message={loadErrorMessage(detail.error)}
          onRetry={() => void detail.refetch()}
          retrying={detail.isFetching}
        />
      </View>
    );
  } else {
    const transaction = detail.data;
    body = (
      <TransactionForm
        // updated_at baru berarti data di server berubah (mis. setelah 409):
        // form dimuat ulang dengan nilai terbaru, bukan menimpa dengan data lama.
        key={transaction.updated_at}
        account={transaction.account}
        initial={transaction}
        onConflict={() => void detail.refetch()}
        onDone={close}
      />
    );
  }

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <TransactionHeader
        title="Ubah Transaksi"
        subtitle="Perbarui data transaksi"
        leadingIcon="back"
        onClose={close}
      />
      {body}
    </View>
  );
}

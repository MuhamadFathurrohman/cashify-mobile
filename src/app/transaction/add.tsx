import { ErrorState } from "@/components/ui/ErrorState";
import { TransactionForm } from "@/features/transactions/form/TransactionForm";
import { TransactionFormSkeleton } from "@/features/transactions/form/TransactionFormSkeleton";
import { TransactionHeader } from "@/features/transactions/TransactionHeader";
import {
  pickDefaultAccount,
  useAccounts,
} from "@/features/transactions/useAccounts";
import { categoryKeys } from "@/features/transactions/transactionKeys";
import { networkOrFallbackMessage } from "@/features/transactions/transactionErrorMessages";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

const FALLBACK_LOAD_ERROR =
  "Form transaksi belum bisa dimuat. Coba lagi sebentar lagi.";

export default function AddTransactionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accounts = useAccounts();
  const account = accounts.data ? pickDefaultAccount(accounts.data) : undefined;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  // Kategori bisa ikut gagal saat form sebelumnya pernah dibuka. Invalidasi
  // memastikan kategori dimuat ulang sebelum form dirender lagi.
  const retry = () => {
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    void accounts.refetch();
  };

  let body;
  if (accounts.isPending) {
    body = <TransactionFormSkeleton />;
  } else if (accounts.isError) {
    body = (
      <View className="flex-1 px-5 pt-4">
        <ErrorState
          title="Gagal memuat form transaksi"
          message={networkOrFallbackMessage(
            accounts.error,
            FALLBACK_LOAD_ERROR,
          )}
          onRetry={retry}
          retrying={accounts.isFetching}
        />
      </View>
    );
  } else if (!account) {
    // Beda dengan galat jaringan: ini kondisi data, bukan kegagalan sementara
    body = (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center font-sans text-sm leading-5 text-[#43474d]">
          Belum ada dompet. Hubungi dukungan bila ini tidak seharusnya terjadi.
        </Text>
      </View>
    );
  } else {
    body = <TransactionForm account={account} onDone={close} />;
  }

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <TransactionHeader
        title="Tambah Transaksi"
        subtitle="Catat alur kas harian"
        onClose={close}
      />
      {body}
    </View>
  );
}

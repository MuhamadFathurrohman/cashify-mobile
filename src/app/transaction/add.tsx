import { TransactionForm } from "@/features/transactions/TransactionForm";
import { TransactionFormSkeleton } from "@/features/transactions/TransactionFormSkeleton";
import { TransactionHeader } from "@/features/transactions/TransactionHeader";
import {
  pickDefaultAccount,
  useAccounts,
} from "@/features/transactions/useAccounts";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function AddTransactionScreen() {
  const router = useRouter();
  const accounts = useAccounts();
  const account = accounts.data ? pickDefaultAccount(accounts.data) : undefined;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  let body;
  if (accounts.isPending) {
    body = <TransactionFormSkeleton />;
  } else if (!account) {
    // Gagal memuat dompet, atau akun belum punya dompet sama sekali
    body = (
      <View className="flex-1 items-center justify-center gap-2 px-8">
        <Text className="text-center font-sans text-sm leading-5 text-[#43474d]">
          {accounts.isError
            ? "Dompet gagal dimuat. Periksa koneksi kamu."
            : "Belum ada dompet. Hubungi dukungan bila ini tidak seharusnya terjadi."}
        </Text>
        {accounts.isError ? (
          <Pressable
            onPress={() => void accounts.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Muat ulang dompet"
            className="px-4 py-2"
          >
            <Text className="font-sans text-sm font-semibold text-[#006c50]">
              Coba lagi
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  } else {
    body = <TransactionForm account={account} onDone={close} />;
  }

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <TransactionHeader onClose={close} />
      {body}
    </View>
  );
}

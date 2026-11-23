import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { TransactionHeader } from "@/features/transactions/TransactionHeader";
import { TransactionDetailCard } from "@/features/transactions/detail/TransactionDetailCard";
import { TransactionDetailSkeleton } from "@/features/transactions/detail/TransactionDetailSkeleton";
import { TransactionSourceMessage } from "@/features/transactions/detail/TransactionSourceMessage";
import { useDeleteTransaction } from "@/features/transactions/detail/useDeleteTransaction";
import { useTransactionDetail } from "@/features/transactions/detail/useTransactionDetail";
import { ApiRequestError } from "@/lib/api/client";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const FALLBACK_LOAD_ERROR =
  "Detail transaksi belum bisa dimuat. Coba lagi sebentar lagi.";

function loadErrorMessage(error: unknown): string {
  return error instanceof ApiRequestError && error.code === "NETWORK_ERROR"
    ? error.message
    : FALLBACK_LOAD_ERROR;
}

function deleteErrorMessage(error: unknown): string {
  return error instanceof ApiRequestError && error.code === "NETWORK_ERROR"
    ? error.message
    : "Transaksi gagal dihapus. Coba lagi.";
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const detail = useTransactionDetail(id);
  const remove = useDeleteTransaction();

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/history");
  };

  const notFound =
    !id ||
    (detail.error instanceof ApiRequestError && detail.error.status === 404);

  const handleDelete = async () => {
    if (!id || remove.isPending) return;
    try {
      await remove.mutateAsync(id);
    } catch (error) {
      setConfirmVisible(false);
      // 404 = transaksi sudah tidak ada (mis. dihapus dari perangkat lain);
      // hasil akhirnya sama, jadi diperlakukan seperti berhasil.
      if (error instanceof ApiRequestError && error.status === 404) {
        toast.success("Transaksi sudah tidak ada");
        close();
        return;
      }
      toast.error(deleteErrorMessage(error));
      return;
    }
    setConfirmVisible(false);
    toast.success("Transaksi dihapus");
    close();
  };

  let content;
  if (notFound) {
    content = (
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
    content = (
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <TransactionDetailSkeleton />
      </ScrollView>
    );
  } else if (detail.isError || !detail.data) {
    content = (
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <ErrorState
          title="Gagal memuat transaksi"
          message={loadErrorMessage(detail.error)}
          onRetry={() => void detail.refetch()}
          retrying={detail.isFetching}
        />
      </ScrollView>
    );
  } else {
    const item = detail.data;
    content = (
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={detail.isRefetching}
            onRefresh={() => void detail.refetch()}
            colors={["#006c50"]}
            tintColor="#006c50"
          />
        }
      >
        <TransactionDetailCard item={item} />
        {item.source_message ? (
          <TransactionSourceMessage message={item.source_message} />
        ) : null}
      </ScrollView>
    );
  }

  // Panel aksi hanya tampil bila transaksinya benar-benar ada
  const showActions = !!detail.data && !notFound;

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <TransactionHeader
        title="Detail Transaksi"
        subtitle="Rincian catatan transaksi"
        leadingIcon="back"
        onClose={close}
      />

      {content}

      {showActions ? (
        <View
          className="border-t border-[rgba(196,198,206,0.3)] bg-[rgba(255,255,255,0.95)] px-5 pt-[21px]"
          style={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}
        >
          <View className="flex-row gap-3">
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/transaction/edit/[id]",
                  params: { id: id ?? "" },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Ubah transaksi"
              className="h-[54px] flex-1 active:opacity-90"
            >
              <View className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-[#006c50] shadow-lg shadow-[#006c50]/20">
                <Ionicons name="create-outline" size={18} color="#ffffff" />
                <Text className="font-sans text-base font-semibold leading-[22px] text-white">
                  Ubah
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setConfirmVisible(true)}
              disabled={remove.isPending}
              accessibilityRole="button"
              accessibilityLabel="Hapus transaksi"
              accessibilityState={{ disabled: remove.isPending }}
              className={`h-[54px] flex-1 ${
                remove.isPending ? "opacity-80" : "active:opacity-90"
              }`}
            >
              <View className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl border border-[#ba1a1a] bg-white">
                {remove.isPending ? (
                  <ActivityIndicator color="#ba1a1a" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#ba1a1a" />
                    <Text className="font-sans text-base font-semibold leading-[22px] text-[#ba1a1a]">
                      Hapus
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ConfirmDialog
        visible={confirmVisible}
        title="Hapus transaksi ini?"
        message="Transaksi akan dihapus dan tidak lagi muncul di riwayat maupun Beranda."
        confirmLabel="Ya, hapus"
        destructive
        pending={remove.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

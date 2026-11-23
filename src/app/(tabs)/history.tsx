import { useTabBarClearance } from "@/components/ui/BottomTabBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { RefreshErrorBanner } from "@/components/ui/RefreshErrorBanner";
import { HistoryHeader } from "@/features/transactions/history/HistoryHeader";
import {
  type DateGroup,
  TransactionDateGroup,
  groupByDate,
} from "@/features/transactions/history/TransactionDateGroup";
import { TransactionEmptyState } from "@/features/transactions/history/TransactionEmptyState";
import {
  type ActiveFilters,
  TransactionFilterSheet,
} from "@/features/transactions/history/TransactionFilterSheet";
import { TransactionListFooter } from "@/features/transactions/history/TransactionListFooter";
import { TransactionListSkeleton } from "@/features/transactions/history/TransactionListSkeleton";
import { TransactionSummaryCard } from "@/features/transactions/history/TransactionSummaryCard";
import { useTransactions } from "@/features/transactions/history/useTransactions";
import {
  type SummaryParams,
  useTransactionSummary,
} from "@/features/transactions/history/useTransactionSummary";
import { transactionKeys } from "@/features/transactions/transactionKeys";
import { ApiRequestError } from "@/lib/api/client";
import type {
  TransactionListParams,
  TransactionListResponse,
  TransactionType,
} from "@/types/api";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, RefreshControl, View } from "react-native";

const SEARCH_DEBOUNCE_MS = 400;
const FALLBACK_ERROR =
  "Riwayat transaksi belum bisa dimuat. Coba lagi sebentar lagi.";

// Fungsi stabil di luar komponen: tidak dibuat ulang tiap render (TH-10 Tahap 2)
const keyExtractor = (group: DateGroup) => group.date;

function errorMessage(error: unknown): string {
  return error instanceof ApiRequestError && error.code === "NETWORK_ERROR"
    ? error.message
    : FALLBACK_ERROR;
}

function GroupSeparator() {
  return <View className="h-6" />;
}

export default function HistoryScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const tabBarSpace = useTabBarClearance();

  const [filters, setFilters] = useState<ActiveFilters>({});
  const [type, setType] = useState<TransactionType | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Tab bar tetap bisa ditekan saat sheet terbuka, jadi sheet ditutup ketika
  // pengguna berpindah tab agar tidak terbuka lagi saat layar ini kembali
  useFocusEffect(useCallback(() => () => setSheetVisible(false), []));

  // Debounce manual: query dikirim ke hook hanya setelah pengguna berhenti mengetik
  useEffect(() => {
    const timer = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput]);

  const listParams = useMemo<TransactionListParams>(
    () => ({ ...filters, type, q: searchQuery || undefined }),
    [filters, type, searchQuery],
  );
  // Ringkasan tidak dibatasi tab/tipe
  const summaryParams = useMemo<SummaryParams>(
    () => ({ ...filters, q: searchQuery || undefined }),
    [filters, searchQuery],
  );

  const list = useTransactions(listParams);
  const {
    data,
    error,
    isPending,
    isError,
    isRefetchError,
    isFetchNextPageError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = list;
  const summary = useTransactionSummary(summaryParams);

  const groups = useMemo(
    () => groupByDate(data?.pages.flatMap((page) => page.data) ?? []),
    [data],
  );

  const hasActiveFilters =
    Object.keys(filters).length > 0 || type !== undefined;
  const isFiltered = hasActiveFilters || searchQuery.length > 0;
  // Banner tetap tampil selama retry (status memuat di tombol) agar tidak berkedip
  const showRefreshError = isRefetchError && !isFetchNextPageError;
  // Daftar gagal tanpa data: ErrorState menggantikan konten, jadi kartu ringkasan
  // disembunyikan agar tidak muncul dua pesan dan dua tombol Coba Lagi.
  const listFailedWithoutData = isError && !data;

  const handleEndReached = useCallback(() => {
    // Guard: tanpa halaman berikutnya, saat sedang memuat, atau setelah gagal
    // (tanpa guard terakhir, onEndReached bisa memicu loop request gagal)
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Buang halaman selain pertama agar refetch hanya mengulang dari awal
    // (tanpa ini, refetch infinite query mengambil ulang SEMUA halaman yang sudah dimuat)
    queryClient.setQueryData<
      InfiniteData<TransactionListResponse, string | undefined>
    >(transactionKeys.list(listParams), (old) =>
      old
        ? {
            pages: old.pages.slice(0, 1),
            pageParams: old.pageParams.slice(0, 1),
          }
        : old,
    );
    summary.retry();
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, listParams, summary, refetch]);

  // Keyboard dari kolom pencarian bisa menutupi sheet, jadi ditutup lebih dulu
  const handleOpenFilter = useCallback(() => {
    Keyboard.dismiss();
    setSheetVisible(true);
  }, []);

  const handleApplyFilters = useCallback(
    (next: ActiveFilters, nextType: TransactionType | undefined) => {
      setFilters(next);
      setType(nextType);
    },
    [],
  );

  // Reset TIDAK menghapus pencarian (keputusan 3.5)
  const handleResetFilters = useCallback(() => {
    setFilters({});
    setType(undefined);
  }, []);

  // renderItem/header/footer/empty dibuat sekali agar FlatList tidak menerima
  // elemen baru tiap render (TH-10 Tahap 2).
  const handleOpenDetail = useCallback(
    (id: string) => {
      router.push({ pathname: "/transaction/[id]", params: { id } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: DateGroup }) => (
      <TransactionDateGroup group={item} onPressItem={handleOpenDetail} />
    ),
    [handleOpenDetail],
  );

  const listHeader = useMemo(
    () => (
      <View className="pb-4">
        <TransactionSummaryCard
          summary={summary.summary}
          // Ikut status daftar agar galat ringkasan tidak muncul lebih dulu
          // saat skeleton daftar masih berjalan.
          isLoading={summary.isLoading || isPending}
          isError={summary.isError && !isPending && !listFailedWithoutData}
        />
      </View>
    ),
    [
      summary.summary,
      summary.isLoading,
      summary.isError,
      isPending,
      listFailedWithoutData,
    ],
  );

  const emptyContent = useMemo(() => {
    if (isPending) return <TransactionListSkeleton />;
    if (isError) {
      return (
        <ErrorState
          message={errorMessage(error)}
          // Satu aksi pemulihan untuk seluruh layar: daftar dan ringkasan ikut segar.
          onRetry={() => void handleRefresh()}
          retrying={list.isRefetching}
        />
      );
    }
    return (
      <TransactionEmptyState
        filtered={isFiltered}
        canResetFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />
    );
  }, [
    isPending,
    isError,
    error,
    handleRefresh,
    list.isRefetching,
    isFiltered,
    hasActiveFilters,
    handleResetFilters,
  ]);

  const listFooter = useMemo(
    () => (
      <TransactionListFooter
        isFetchingNextPage={isFetchingNextPage}
        isFetchNextPageError={isFetchNextPageError}
        onRetry={() => void fetchNextPage()}
      />
    ),
    [isFetchingNextPage, isFetchNextPageError, fetchNextPage],
  );

  return (
    // Latar #f8f9ff dipakai semua layar tab; tab bar kini overlay transparan
    <View className="flex-1 bg-[#f8f9ff]">
      <HistoryHeader
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        hasActiveFilters={hasActiveFilters}
        onOpenFilter={handleOpenFilter}
        type={type}
        onTypeChange={setType}
      />

      {/* Banner di luar FlatList agar tetap terlihat di posisi gulir mana pun */}
      {showRefreshError ? (
        <View className="px-5 pt-3">
          <RefreshErrorBanner
            onRetry={() => void handleRefresh()}
            retrying={refreshing}
          />
        </View>
      ) : null}

      <FlatList
        data={groups}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={GroupSeparator}
        ListHeaderComponent={listFailedWithoutData ? undefined : listHeader}
        ListEmptyComponent={emptyContent}
        ListFooterComponent={listFooter}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: tabBarSpace,
        }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            colors={["#006c50"]}
            tintColor="#006c50"
          />
        }
      />

      <TransactionFilterSheet
        visible={sheetVisible}
        activeFilters={filters}
        activeType={type}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

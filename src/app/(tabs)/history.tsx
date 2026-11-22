import { useTabBarClearance } from "@/components/ui/BottomTabBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { RefreshErrorBanner } from "@/components/ui/RefreshErrorBanner";
import { HistoryHeader } from "@/features/transactions/history/HistoryHeader";
import {
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
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, RefreshControl, View } from "react-native";

const SEARCH_DEBOUNCE_MS = 400;
const FALLBACK_ERROR =
  "Riwayat transaksi belum bisa dimuat. Coba lagi sebentar lagi.";

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
  const tabBarSpace = useTabBarClearance();

  const [filters, setFilters] = useState<ActiveFilters>({});
  const [type, setType] = useState<TransactionType | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Tab bar tetap bisa ditekan saat sheet terbuka, jadi sheet ditutup ketika
  // pengguna berpindah tab agar tidak terbuka lagi saat layar ini kembali
  useFocusEffect(
    useCallback(() => () => setSheetVisible(false), []),
  );

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
  const showRefreshError =
    isRefetchError && !isFetchNextPageError && !refreshing;

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

  const listHeader = (
    <View className="gap-3 pb-4">
      {showRefreshError ? (
        <RefreshErrorBanner onRetry={() => void handleRefresh()} />
      ) : null}
      <TransactionSummaryCard
        summary={summary.summary}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={summary.retry}
      />
    </View>
  );

  let emptyContent;
  if (isPending) {
    emptyContent = <TransactionListSkeleton />;
  } else if (isError) {
    emptyContent = (
      <ErrorState
        message={errorMessage(error)}
        onRetry={() => void refetch()}
        retrying={list.isRefetching}
      />
    );
  } else {
    emptyContent = (
      <TransactionEmptyState
        filtered={isFiltered}
        canResetFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />
    );
  }

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

      <FlatList
        data={groups}
        keyExtractor={(group) => group.date}
        renderItem={({ item }) => <TransactionDateGroup group={item} />}
        ItemSeparatorComponent={GroupSeparator}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyContent}
        ListFooterComponent={
          <TransactionListFooter
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            onRetry={() => void fetchNextPage()}
          />
        }
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

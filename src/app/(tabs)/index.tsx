import { useTabBarClearance } from "@/components/ui/BottomTabBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { RefreshErrorBanner } from "@/components/ui/RefreshErrorBanner";
import { useAuthStore } from "@/features/auth/authStore";
import { BalanceCard } from "@/features/dashboard/BalancedCard";
import { CashflowCard } from "@/features/dashboard/CashflowCard";
import { DashboardSkeleton } from "@/features/dashboard/DashboardSkeleton";
import { HomeHeader } from "@/features/dashboard/HomeHeader";
import { RecentTransactions } from "@/features/dashboard/RecentTransaction";
import { groupCashflow } from "@/features/dashboard/cashflow";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { ApiRequestError } from "@/lib/api/client";
import {
  currentDay,
  currentMonth,
  formatMonthLabel,
} from "@/utils/jakartaDates";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";

const FALLBACK_ERROR =
  "Ringkasan keuangan belum bisa dimuat. Coba lagi sebentar lagi.";

const TAP_SLOP = 10; // perpindahan jari di bawah nilai ini dianggap tap, bukan scroll

export default function HomeScreen() {
  const router = useRouter();
  const tabBarSpace = useTabBarClearance();
  const fullName = useAuthStore((state) => state.user?.full_name);
  const month = currentMonth();
  const { data, error, isError, isRefetching, refetch } = useDashboard(month);
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);
  // Deteksi tap di luar chart tanpa overlay: simpan titik awal sentuhan dan
  // apakah sentuhan itu berasal dari area chart.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const chartTouchedRef = useRef(false);
  const buckets = useMemo(
    () => groupCashflow(data?.cashflow ?? [], month),
    [data, month],
  );

  const closeDetail = useCallback(() => setSelectedBucket(null), []);

  const handleSelectBucket = useCallback((index: number | null) => {
    setSelectedBucket(index);
  }, []);

  // Hanya tap (bukan scroll) di luar area chart yang menutup detail.
  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      const fromChart = chartTouchedRef.current;
      chartTouchedRef.current = false;

      if (!start || fromChart) return;
      const dx = event.nativeEvent.pageX - start.x;
      const dy = event.nativeEvent.pageY - start.y;
      if (Math.hypot(dx, dy) < TAP_SLOP) closeDetail();
    },
    [closeDetail],
  );

  // Detail adalah interaksi sesaat: tutup saat Beranda kehilangan fokus
  useFocusEffect(useCallback(() => () => closeDetail(), [closeDetail]));

  const goToAdd = () => router.push({ pathname: "/transaction/add" });
  const goToHistory = () => router.navigate("/(tabs)/history");

  // Pesan jaringan dari apiClient sudah berbahasa Indonesia; galat lain dibuat umum
  const errorMessage =
    error instanceof ApiRequestError && error.code === "NETWORK_ERROR"
      ? error.message
      : FALLBACK_ERROR;

  // Refresh gagal sementara data lama masih ada: beri tahu tanpa mengosongkan layar
  const showRefreshError = isError && !!data && !isRefetching;

  let body;
  if (data) {
    body = (
      <>
        <BalanceCard
          balance={data.balance}
          income={data.month.income}
          expense={data.month.expense}
        />
        <View
          onTouchStart={() => {
            chartTouchedRef.current = true;
          }}
        >
          <CashflowCard
            buckets={buckets}
            monthLabel={formatMonthLabel(month)}
            today={currentDay()}
            selectedIndex={selectedBucket}
            onSelect={handleSelectBucket}
          />
        </View>
        <RecentTransactions
          items={data.recent_transactions}
          onSeeAll={goToHistory}
          onAdd={goToAdd}
        />
      </>
    );
  } else if (isError) {
    body = (
      <ErrorState
        message={errorMessage}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    );
  } else {
    body = <DashboardSkeleton />;
  }

  return (
    // Latar #f8f9ff dipakai semua layar tab; tab bar kini overlay transparan
    <View
      className="flex-1 bg-[#f8f9ff]"
      onTouchStart={(event) => {
        touchStartRef.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        };
      }}
      onTouchEnd={handleTouchEnd}
    >
      <HomeHeader />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: tabBarSpace,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !!data}
            onRefresh={() => void refetch()}
            colors={["#006c50"]}
            tintColor="#006c50"
          />
        }
      >
        <View>
          <Text className="font-sans text-2xl font-bold leading-[30px] tracking-[-0.6px] text-[#001d37]">
            {fullName ? `Halo, ${fullName}` : "Halo!"}
          </Text>
          <Text className="font-sans pt-[2px] text-sm leading-5 text-[#43474d]">
            Kelola Keuanganmu, Untuk Mencapai Tujuan.
          </Text>
        </View>
        {showRefreshError ? (
          <RefreshErrorBanner onRetry={() => void refetch()} />
        ) : null}
        {body}
      </ScrollView>
    </View>
  );
}

import { ErrorState } from "@/components/ui/ErrorState";
import { useAuthStore } from "@/features/auth/authStore";
import { BalanceCard } from "@/features/dashboard/BalancedCard";
import { CashflowCard } from "@/features/dashboard/CashflowCard";
import { DashboardSkeleton } from "@/features/dashboard/DashboardSkeleton";
import { HomeHeader } from "@/features/dashboard/HomeHeader";
import { RecentTransactions } from "@/features/dashboard/RecentTransaction";
import { groupCashflow } from "@/features/dashboard/cashflow";
import {
  currentDay,
  currentMonth,
  formatMonthLabel,
} from "@/features/dashboard/dashboardDates";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { ApiRequestError } from "@/lib/api/client";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

const FALLBACK_ERROR =
  "Ringkasan keuangan belum bisa dimuat. Coba lagi sebentar lagi.";

export default function HomeScreen() {
  const router = useRouter();
  const fullName = useAuthStore((state) => state.user?.full_name);
  const month = currentMonth();
  const { data, error, isError, isRefetching, refetch } = useDashboard(month);
  const buckets = useMemo(
    () => groupCashflow(data?.cashflow ?? [], month),
    [data, month],
  );

  const firstName = fullName?.trim().split(/\s+/)[0];
  const goToAdd = () => router.push({ pathname: "/transaction/add" });
  const goToHistory = () => router.navigate("/(tabs)/history");

  // Pesan jaringan dari apiClient sudah berbahasa Indonesia; galat lain dibuat umum
  const errorMessage =
    error instanceof ApiRequestError && error.code === "NETWORK_ERROR"
      ? error.message
      : FALLBACK_ERROR;

  let body;
  if (data) {
    body = (
      <>
        <BalanceCard
          balance={data.balance}
          income={data.month.income}
          expense={data.month.expense}
        />
        <CashflowCard
          buckets={buckets}
          monthLabel={formatMonthLabel(month)}
          today={currentDay()}
        />
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
    // Latar #f8f9ff sama dengan wrapper BottomTabBar (aturan 20)
    <View className="flex-1 bg-[#f8f9ff]">
      <HomeHeader />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
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
            {firstName ? `Halo, ${firstName}! 👋` : "Halo! 👋"}
          </Text>
          <Text className="font-sans pt-[2px] text-sm leading-5 text-[#43474d]">
            Kelola Keuangan, Capai Tujuan.
          </Text>
        </View>
        {body}
      </ScrollView>
    </View>
  );
}

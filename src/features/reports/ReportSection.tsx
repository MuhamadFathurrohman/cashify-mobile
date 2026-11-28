import { SegmentedControl, type SegmentOption } from "@/components/ui/SegmentedControl";
import { useTabBarClearance } from "@/components/ui/BottomTabBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { RefreshErrorBanner } from "@/components/ui/RefreshErrorBanner";
import { useCategories } from "@/features/transactions/useCategories";
import { networkOrFallbackMessage } from "@/features/transactions/transactionErrorMessages";
import { currentMonth, formatMonthLabel } from "@/utils/jakartaDates";
import { previousMonth } from "@/utils/monthOptions";
import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { ReportCategorySection, type CategoryVisual } from "./ReportCategorySection";
import { ReportInsightCard } from "./ReportInsightCard";
import { ReportOverviewCard } from "./ReportOverviewCard";
import { ReportPeriodTrendCard } from "./ReportPeriodTrendCard";
import { ReportEmptyState, ReportSkeleton } from "./ReportStates";
import { ReportTrendCard } from "./ReportTrendCard";
import {
  buildReportInsights,
  type InsightOptions,
} from "./reportInsights";
import { useMonthlyReport, useReportWindow } from "./reportQueries";
import { aggregateMonthlyReports } from "./reportWindow";

const LOAD_FALLBACK =
  "Laporan keuangan belum bisa dimuat. Coba lagi sebentar lagi.";

export type ReportPeriod = "1" | "6" | "12";

const PERIOD_OPTIONS: readonly SegmentOption<ReportPeriod>[] = [
  { value: "1", label: "1 Bulan" },
  { value: "6", label: "6 Bulan" },
  { value: "12", label: "12 Bulan" },
];

export const PERIOD_MONTHS: Record<ReportPeriod, number> = {
  "1": 1,
  "6": 6,
  "12": 12,
};

interface ReportSectionProps {
  // Bulan dan periode dipegang tab (header) supaya MonthPicker bisa menampilkan
  // label rentang tanpa prop drilling tambahan.
  month: string;
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
}

// Segmen "Laporan" pada tab Analisis.
export function ReportSection({
  month,
  period,
  onPeriodChange,
}: ReportSectionProps) {
  const tabBarSpace = useTabBarClearance();
  const isWindow = period !== "1";
  const windowMonths = isWindow ? PERIOD_MONTHS[period] : 0;

  // Flag ini memisahkan skeleton karena pindah periode dari spinner karena
  // refresh manual. Keduanya diturunkan dari state fetch aktif, jadi tidak
  // perlu useEffect untuk mengubahnya kembali. Tab periode tidak ikut skeleton.
  const [switchingPeriod, setSwitchingPeriod] = useState<ReportPeriod | null>(
    null,
  );
  const [manualRefreshPeriod, setManualRefreshPeriod] =
    useState<ReportPeriod | null>(null);

  const report = useMonthlyReport(month, !isWindow);
  // Satu permintaan tambahan untuk membandingkan pengeluaran dengan bulan
  // sebelumnya. Hanya dipakai tab 1 Bulan.
  const previous = useMonthlyReport(previousMonth(month), !isWindow);
  const rangeReport = useReportWindow(month, windowMonths);
  const categories = useCategories("expense");

  const activeFetching = isWindow ? rangeReport.isFetching : report.isFetching;

  const visuals = useMemo(() => {
    const map = new Map<string, CategoryVisual>();
    for (const category of categories.data ?? []) {
      map.set(category.id, {
        icon: category.icon,
        color: category.color,
      });
    }
    return map;
  }, [categories.data]);

  const handlePeriodChange = useCallback(
    (next: ReportPeriod) => {
      setSwitchingPeriod(next);
      setManualRefreshPeriod(null);
      onPeriodChange(next);
    },
    [onPeriodChange],
  );

  const refreshAll = useCallback(() => {
    setManualRefreshPeriod(period);
    setSwitchingPeriod(null);
    if (isWindow) {
      rangeReport.refetch();
    } else {
      void report.refetch();
      void previous.refetch();
    }
  }, [isWindow, period, previous, rangeReport, report]);

  const periodLabel = isWindow
    ? `${windowMonths} bulan terakhir`
    : month === currentMonth()
      ? "bulan ini"
      : formatMonthLabel(month);
  const emptyLabel = isWindow ? periodLabel : formatMonthLabel(month);

  const pending = isWindow ? rangeReport.isPending : report.isPending;
  const isPeriodSwitching = switchingPeriod === period && activeFetching;
  const showSkeleton = pending || isPeriodSwitching;
  const refreshing = manualRefreshPeriod === period && activeFetching;
  const fatalError = isWindow
    ? rangeReport.isError
    : report.isError && !report.data;
  const partialError = isWindow
    ? rangeReport.hasPartialError
    : Boolean(report.isError && report.data);

  const data = isWindow
    ? rangeReport.reports.length > 0
      ? aggregateMonthlyReports(rangeReport.reports)
      : null
    : report.data;

  let body: ReactNode;
  if (showSkeleton) {
    body = <ReportSkeleton />;
  } else if (fatalError) {
    const error = isWindow ? rangeReport.error : report.error;
    body = (
      <ErrorState
        title="Gagal memuat laporan"
        message={networkOrFallbackMessage(error, LOAD_FALLBACK)}
        onRetry={refreshAll}
        retrying={refreshing}
      />
    );
  } else if (!data) {
    body = <ReportSkeleton />;
  } else if (data.income_total === 0 && data.expense_total === 0) {
    body = <ReportEmptyState label={emptyLabel} />;
  } else {
    const expenseCategories = data.by_category
      .filter((category) => category.type === "expense")
      .slice(0, 5);
    const insightOptions: InsightOptions = { periodLabel };
    if (!isWindow) {
      insightOptions.previous = {
        report: previous.data ?? null,
        pending: previous.isPending,
        unavailable: previous.isError && !previous.data,
      };
    }
    const insights = buildReportInsights(data, insightOptions);

    body = (
      <View className="gap-4">
        <ReportOverviewCard
          report={data}
          periodLabel={isWindow ? periodLabel : undefined}
        />
        {isWindow ? (
          <ReportPeriodTrendCard
            key={`${period}-${month}`}
            reports={rangeReport.reports}
            periodLabel={periodLabel}
          />
        ) : (
          <ReportTrendCard key={data.month} report={data} />
        )}
        <ReportCategorySection
          categories={expenseCategories}
          visuals={visuals}
        />
        <ReportInsightCard insights={insights} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Banner di luar ScrollView agar tetap terlihat di posisi gulir mana pun */}
      {partialError ? (
        <View className="px-5 pt-3">
          <RefreshErrorBanner
            onRetry={refreshAll}
            retrying={refreshing}
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: tabBarSpace,
          gap: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            colors={["#006c50"]}
            tintColor="#006c50"
          />
        }
      >
        <SegmentedControl
          options={PERIOD_OPTIONS}
          value={period}
          onChange={handlePeriodChange}
        />
        {body}
      </ScrollView>
    </View>
  );
}

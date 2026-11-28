import type { MonthlyReport } from "@/types/api";
import {
  formatCompactRupiah,
  formatPlainRupiah,
  formatSigned,
} from "@/utils/money";
import {
  formatMonthLabel,
  formatMonthShort,
} from "@/utils/jakartaDates";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import {
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from "react-native-svg";
import {
  linePath,
  nearestPointIndex,
  niceMax,
  REPORT_CHART,
  tickIndexes,
  xForIndex,
  yForValue,
} from "./reportChart";

interface ReportPeriodTrendCardProps {
  /** Laporan bulanan yang berhasil dimuat, urut menaik. */
  reports: MonthlyReport[];
  /** "6 bulan terakhir" atau "12 bulan terakhir". */
  periodLabel: string;
}

const INCOME_COLOR = "#006c50";
const EXPENSE_COLOR = "#ed7658";

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View
        className="h-[10px] w-[10px] rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text className="font-sans ml-1 text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#43474d]">
        {label}
      </Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-sans text-[11px] leading-[14px] text-[#43474d]">
        {label}
      </Text>
      <Text
        className="font-sans text-[11px] font-semibold leading-[14px]"
        style={{ color }}
      >
        {value}
      </Text>
    </View>
  );
}

// Grafik garis per bulan untuk tab 6/12 Bulan. Memakai utilitas yang sama
// dengan grafik harian supaya ketiga tab punya bahasa visual yang konsisten.
export function ReportPeriodTrendCard({
  reports,
  periodLabel,
}: ReportPeriodTrendCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(216, windowWidth - 84);
  const plotWidth = Math.max(
    1,
    chartWidth - REPORT_CHART.left - REPORT_CHART.right,
  );
  const plotHeight =
    REPORT_CHART.height - REPORT_CHART.top - REPORT_CHART.bottom;

  const points = useMemo(
    () =>
      reports.map((report) => ({
        month: report.month,
        label: formatMonthShort(report.month),
        income: report.income_total,
        expense: report.expense_total,
      })),
    [reports],
  );
  const linePoints = useMemo(
    () =>
      points.map((point, index) => ({
        date: point.month,
        day: index + 1,
        income: point.income,
        expense: point.expense,
      })),
    [points],
  );
  const maxValue = Math.max(
    0,
    ...points.flatMap((point) => [point.income, point.expense]),
  );
  const axisMax = niceMax(maxValue);
  const incomePath = linePath(linePoints, "income", axisMax, chartWidth);
  const expensePath = linePath(linePoints, "expense", axisMax, chartWidth);
  const xTicks = tickIndexes(points.length, 6);
  const yTicks = [0, 0.5, 1] as const;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const active = selectedIndex === null ? null : points[selectedIndex] ?? null;
  const activeX =
    selectedIndex === null
      ? null
      : REPORT_CHART.left +
        xForIndex(selectedIndex, points.length, plotWidth);
  const activeIncomeY =
    active === null
      ? null
      : REPORT_CHART.top + yForValue(active.income, axisMax, plotHeight);
  const activeExpenseY =
    active === null
      ? null
      : REPORT_CHART.top + yForValue(active.expense, axisMax, plotHeight);

  const selectAt = (event: GestureResponderEvent) => {
    setSelectedIndex(
      nearestPointIndex(event.nativeEvent.locationX, plotWidth, points.length),
    );
  };

  const moveSelection = (delta: number) => {
    if (points.length === 0) return;
    const current = selectedIndex ?? 0;
    setSelectedIndex(
      Math.min(points.length - 1, Math.max(0, current + delta)),
    );
  };

  const hasChart = points.length > 0 && maxValue > 0;

  return (
    <View
      className="gap-3 rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-[21px]"
      style={{
        shadowColor: "#19324d",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 1,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]">
            Tren Arus Kas
          </Text>
          <Text className="font-sans text-xs leading-4 text-[#43474d]">
            {periodLabel}
          </Text>
        </View>

        <View className="flex-row items-center gap-3 pt-[2px]">
          <LegendDot color={INCOME_COLOR} label="Masuk" />
          <LegendDot color={EXPENSE_COLOR} label="Keluar" />
        </View>
      </View>

      {hasChart ? (
        <>
          <View
            style={{
              width: chartWidth,
              height: REPORT_CHART.height,
              position: "relative",
            }}
          >
            <Svg width={chartWidth} height={REPORT_CHART.height}>
              {yTicks.map((ratio) => {
                const value = axisMax * ratio;
                const y =
                  REPORT_CHART.top + yForValue(value, axisMax, plotHeight);
                return (
                  <Line
                    key={ratio}
                    x1={REPORT_CHART.left}
                    y1={y}
                    x2={REPORT_CHART.left + plotWidth}
                    y2={y}
                    stroke={ratio === 0 ? "#e2e8f0" : "#eef2f7"}
                    strokeWidth={1}
                  />
                );
              })}

              {yTicks.map((ratio) => {
                const value = axisMax * ratio;
                const y =
                  REPORT_CHART.top + yForValue(value, axisMax, plotHeight);
                return (
                  <SvgText
                    key={`label-${ratio}`}
                    x={REPORT_CHART.left - 6}
                    y={y + 3}
                    fontSize={9}
                    fill="#74777e"
                    textAnchor="end"
                  >
                    {formatCompactRupiah(value)}
                  </SvgText>
                );
              })}

              {xTicks.map((index) => {
                const point = points[index];
                if (!point) return null;
                return (
                  <SvgText
                    key={`x-${index}`}
                    x={
                      REPORT_CHART.left +
                      xForIndex(index, points.length, plotWidth)
                    }
                    y={REPORT_CHART.height - 6}
                    fontSize={9}
                    fill="#74777e"
                    textAnchor="middle"
                  >
                    {point.label}
                  </SvgText>
                );
              })}

              {activeX !== null ? (
                <Line
                  x1={activeX}
                  y1={REPORT_CHART.top}
                  x2={activeX}
                  y2={REPORT_CHART.top + plotHeight}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ) : null}

              {points.length > 1 ? (
                <>
                  <Path
                    d={incomePath}
                    fill="none"
                    stroke={INCOME_COLOR}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d={expensePath}
                    fill="none"
                    stroke={EXPENSE_COLOR}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ) : (
                <>
                  <Circle
                    cx={REPORT_CHART.left + xForIndex(0, 1, plotWidth)}
                    cy={
                      REPORT_CHART.top +
                      yForValue(points[0].income, axisMax, plotHeight)
                    }
                    r={3}
                    fill={INCOME_COLOR}
                  />
                  <Circle
                    cx={REPORT_CHART.left + xForIndex(0, 1, plotWidth)}
                    cy={
                      REPORT_CHART.top +
                      yForValue(points[0].expense, axisMax, plotHeight)
                    }
                    r={3}
                    fill={EXPENSE_COLOR}
                  />
                </>
              )}

              {activeX !== null &&
              activeIncomeY !== null &&
              activeExpenseY !== null ? (
                <>
                  <Circle
                    cx={activeX}
                    cy={activeIncomeY}
                    r={4}
                    fill={INCOME_COLOR}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <Circle
                    cx={activeX}
                    cy={activeExpenseY}
                    r={4}
                    fill={EXPENSE_COLOR}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </>
              ) : null}
            </Svg>

            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={`Grafik arus kas ${periodLabel}`}
              accessibilityHint="Ketuk atau geser untuk melihat rincian per bulan."
              accessibilityValue={
                active
                  ? {
                      text: `${formatMonthLabel(active.month)}, pemasukan ${formatPlainRupiah(active.income)}, pengeluaran ${formatPlainRupiah(active.expense)}`,
                    }
                  : undefined
              }
              accessibilityActions={[
                { name: "increment", label: "Bulan berikutnya" },
                { name: "decrement", label: "Bulan sebelumnya" },
              ]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === "increment") {
                  moveSelection(1);
                } else if (event.nativeEvent.actionName === "decrement") {
                  moveSelection(-1);
                }
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={selectAt}
              onResponderMove={selectAt}
              onResponderTerminationRequest={() => true}
              style={{
                position: "absolute",
                left: REPORT_CHART.left,
                top: REPORT_CHART.top,
                width: plotWidth,
                height: plotHeight,
              }}
            />
          </View>

          <View style={{ height: 62, justifyContent: "center" }}>
            {active ? (
              <View className="flex-row items-center">
                <Text
                  className="font-sans w-[86px] text-[11px] font-semibold leading-4 text-[#001d37]"
                  numberOfLines={1}
                >
                  {formatMonthLabel(active.month)}
                </Text>
                <View
                  style={{
                    width: 1,
                    height: 42,
                    marginHorizontal: 10,
                    backgroundColor: "#e2e8f0",
                  }}
                />
                <View className="flex-1 gap-[3px]">
                  <DetailRow
                    label="Pemasukan"
                    value={formatPlainRupiah(active.income)}
                    color={INCOME_COLOR}
                  />
                  <DetailRow
                    label="Pengeluaran"
                    value={formatPlainRupiah(active.expense)}
                    color={EXPENSE_COLOR}
                  />
                  <DetailRow
                    label="Selisih"
                    value={formatSigned(active.income - active.expense)}
                    color={
                      active.income - active.expense < 0
                        ? EXPENSE_COLOR
                        : INCOME_COLOR
                    }
                  />
                </View>
              </View>
            ) : (
              <Text className="font-sans text-[12px] leading-5 text-[#74777e]">
                Ketuk atau geser grafik untuk melihat rincian per bulan.
              </Text>
            )}
          </View>

          <Text className="font-sans text-[10px] leading-4 text-[#8a8d94]">
            Bulan tanpa transaksi ditampilkan 0.
          </Text>
        </>
      ) : (
        <View className="h-[188px] items-center justify-center px-4">
          <Ionicons name="analytics-outline" size={28} color="#c4c6ce" />
          <Text className="font-sans mt-2 text-sm font-semibold text-[#43474d]">
            Belum ada arus kas
          </Text>
          <Text className="font-sans mt-1 text-center text-xs leading-4 text-[#74777e]">
            Transaksi pada periode ini akan tampil di sini.
          </Text>
        </View>
      )}
    </View>
  );
}

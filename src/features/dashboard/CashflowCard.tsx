import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";
import type { CashflowBucket } from "./cashflow";

interface CashflowCardProps {
  buckets: CashflowBucket[];
  monthLabel: string; // mis. "November 2026"
  today: number; // tanggal hari ini (zona Jakarta); rentang yang memuatnya dicetak tebal
}

const INCOME_COLOR = "#006c50";
const EXPENSE_COLOR = "#ed7658";
const BAR_AREA_HEIGHT = 96;
const MAX_BAR_HEIGHT = 92;
const MIN_BAR_HEIGHT = 4; // nilai kecil tetap terlihat

function barHeight(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(MIN_BAR_HEIGHT, Math.round((value / max) * MAX_BAR_HEIGHT));
}

function Bar({ height, color }: { height: number; color: string }) {
  return (
    <View
      style={{
        width: 12,
        height,
        backgroundColor: color,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
      }}
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View
        className="h-[10px] w-[10px] rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text className="ml-1 text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#43474d]">
        {label}
      </Text>
    </View>
  );
}

// Grafik batang 4 rentang tanggal bulan berjalan (keputusan 4), dibuat dari View
// tanpa dependensi grafik. Tinggi batang relatif terhadap nilai terbesar di grafik.
export function CashflowCard({
  buckets,
  monthLabel,
  today,
}: CashflowCardProps) {
  const max = Math.max(0, ...buckets.flatMap((b) => [b.income, b.expense]));
  const isEmpty = max === 0;

  return (
    <View
      className="gap-4 rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-[21px]"
      style={{
        shadowColor: "#19324d",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 1,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]">
            Arus Kas Bulan Ini
          </Text>
          <Text className="text-xs leading-4 text-[#43474d]">{monthLabel}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <LegendDot color={INCOME_COLOR} label="Masuk" />
          <LegendDot color={EXPENSE_COLOR} label="Keluar" />
        </View>
      </View>

      {isEmpty ? (
        <View className="h-[144px] items-center justify-center px-4">
          <Ionicons name="bar-chart-outline" size={28} color="#c4c6ce" />
          <Text className="mt-2 text-sm font-semibold text-[#43474d]">
            Belum ada arus kas
          </Text>
          <Text className="mt-1 text-center text-xs leading-4 text-[#74777e]">
            Transaksi bulan ini akan tampil di sini.
          </Text>
        </View>
      ) : (
        <View
          className="h-[144px] flex-row items-end px-2 pt-4"
          accessibilityLabel={`Grafik arus kas ${monthLabel}`}
        >
          {buckets.map((bucket) => {
            const isCurrent =
              today >= bucket.startDay && today <= bucket.endDay;
            return (
              <View key={bucket.label} className="flex-1 items-center">
                <View
                  className="flex-row items-end"
                  style={{ height: BAR_AREA_HEIGHT, gap: 6 }}
                >
                  <Bar
                    height={barHeight(bucket.income, max)}
                    color={INCOME_COLOR}
                  />
                  <Bar
                    height={barHeight(bucket.expense, max)}
                    color={EXPENSE_COLOR}
                  />
                </View>
                <Text
                  className={
                    isCurrent
                      ? "pt-2 text-[10px] font-bold leading-[14px] tracking-[0.4px] text-[#001d37]"
                      : "pt-2 text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#74777e]"
                  }
                >
                  {bucket.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

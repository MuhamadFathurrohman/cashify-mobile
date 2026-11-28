import { balanceParts, formatExpense, formatIncome } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";
import {
  reportHealth,
  reportHealthLabel,
  type ReportHealthKey,
  type ReportTotals,
} from "./reportInsights";

interface ReportOverviewCardProps {
  report: ReportTotals;
  // Hanya untuk tab 6/12 Bulan: "6 bulan terakhir" dll. Bulan/tahun tidak
  // diulang di kartu karena sudah tampil di MonthPicker header.
  periodLabel?: string;
}

const BADGE_THEME: Record<
  ReportHealthKey,
  { backgroundColor: string; color: string }
> = {
  empty: { backgroundColor: "rgba(255,255,255,0.12)", color: "#dbe7f3" },
  deficit: { backgroundColor: "rgba(255,180,162,0.15)", color: "#ffb4a2" },
  fair: { backgroundColor: "rgba(255,255,255,0.12)", color: "#dbe7f3" },
  healthy: { backgroundColor: "rgba(127,249,204,0.15)", color: "#7ff9cc" },
};

function SummaryTile({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: "arrow-down-circle-outline" | "arrow-up-circle-outline";
}) {
  return (
    <View className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] p-[13px]">
      <View className="flex-row items-center gap-[6px]">
        <Ionicons name={icon} size={14} color={color} />
        <Text className="font-sans text-[11px] font-semibold leading-4 tracking-[0.3px] text-[#b8c7d9]">
          {label}
        </Text>
      </View>
      <Text
        className="font-sans mt-[6px] text-[15px] font-semibold leading-5 tracking-[-0.2px]"
        style={{ color }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// Kartu ringkasan Laporan. Warna navy sama dengan hero Anggaran agar kedua
// segmen terasa satu keluarga; ukuran nominal mengikuti BalanceCard Beranda
// dan BudgetHeroCard (25/30, tracking -0.8).
export function ReportOverviewCard({
  report,
  periodLabel,
}: ReportOverviewCardProps) {
  const health = reportHealth(report);
  const badge = BADGE_THEME[health.key];
  const netColor =
    report.net < 0 ? "#ffb4a2" : report.net > 0 ? "#7ff9cc" : "#ffffff";
  const parts = balanceParts(report.net);
  // balanceParts sengaja tanpa "+" untuk saldo; laporan memakai tanda eksplisit.
  const sign = report.net > 0 ? "+" : parts.sign;

  return (
    <View className="overflow-hidden rounded-3xl bg-[#19324d] p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-sans text-sm font-semibold leading-5 text-[#dbe7f3]">
            Total Bersih
          </Text>
          {periodLabel ? (
            <Text className="font-sans mt-[2px] text-xs font-medium leading-4 text-[#8fa6bd]">
              {periodLabel}
            </Text>
          ) : null}
        </View>

        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: badge.backgroundColor }}
        >
          <Text
            className="font-sans text-[11px] font-bold leading-4 tracking-[0.2px]"
            style={{ color: badge.color }}
          >
            {reportHealthLabel(report)}
          </Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-center">
        <Text
          className="font-sans text-[25px] font-semibold leading-[30px]"
          style={{ color: netColor, marginRight: 10 }}
        >
          {`${sign}Rp`}
        </Text>
        <Text
          className="font-sans text-[25px] font-bold leading-[30px] tracking-[-0.8px]"
          style={{ color: netColor, flexShrink: 1 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {parts.digits}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-[10px]">
        <SummaryTile
          label="Pemasukan"
          value={formatIncome(report.income_total)}
          color="#7ff9cc"
          icon="arrow-down-circle-outline"
        />
        <SummaryTile
          label="Pengeluaran"
          value={formatExpense(report.expense_total)}
          color="#ffb4a2"
          icon="arrow-up-circle-outline"
        />
      </View>
    </View>
  );
}

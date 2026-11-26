import { ComingSoon } from "@/components/ui/ComingSoon";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { NotificationButton } from "@/components/ui/NotificationButton";
import {
  SegmentedControl,
  type SegmentOption,
} from "@/components/ui/SegmentedControl";
import { BudgetSection } from "@/features/budgets/BudgetSection";
import { useBudgetMonthSelection } from "@/features/budgets/useBudgetMonthSelection";
import { currentMonth, formatMonthLabel } from "@/utils/jakartaDates";
import { toRecentMonthOptions } from "@/utils/monthOptions";
import { useMemo, useState } from "react";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AnalysisTab = "budget" | "report";

const LOGO_ICON = require("@/assets/images/logo-icon-cashify.png");

const TABS: readonly SegmentOption<AnalysisTab>[] = [
  { value: "budget", label: "Anggaran", icon: "pie-chart" },
  { value: "report", label: "Laporan", icon: "bar-chart-outline" },
];

// Laporan belum punya endpoint di backend, jadi segmennya masih placeholder.
const REPORT_COPY = {
  icon: "bar-chart-outline",
  title: "Laporan",
  description: "Laporan keuangan segera hadir.",
} as const;

// Shell tab Analisis: header + pemilih segmen + pemilih bulan. Isi segmen tinggal
// di features/ supaya file ini tidak menjadi tempat logika anggaran.
export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AnalysisTab>("budget");
  const budgetMonth = useBudgetMonthSelection();
  // Pilihan bulan laporan berdiri sendiri; belum dipakai request karena isi
  // segmennya masih placeholder.
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const reportMonths = useMemo(() => toRecentMonthOptions(12), []);

  // Tombol bulan menampilkan bulan + tahun saja; tanggal lengkap ada di sheet.
  // Saat segmen Anggaran belum punya data, label bulan berjalan tampil nonaktif
  // agar SegmentedControl di bawahnya tidak bergeser.
  const monthPicker =
    tab === "budget"
      ? {
          months: budgetMonth.months,
          selectedId: budgetMonth.resolvedId,
          onSelect: budgetMonth.selectMonth,
          disabled: budgetMonth.months.length === 0,
          fallbackLabel:
            budgetMonth.selected?.monthLabel ??
            formatMonthLabel(currentMonth()),
        }
      : {
          months: reportMonths,
          selectedId: reportMonth,
          onSelect: setReportMonth,
          disabled: false,
          fallbackLabel: undefined,
        };

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <View
        className="gap-4 border-b border-[rgba(196,198,206,0.25)] px-5 pb-[13px]"
        style={{ paddingTop: insets.top + 14 }}
      >
        <View className="flex-row items-start justify-between">
          {/* Logo aset proyek menggantikan bulatan inisial pada desain Figma.
              Bulan diletakkan di kolom yang sama dengan judul, bukan di bawah logo. */}
          <View className="flex-row items-start gap-3">
            <Image
              source={LOGO_ICON}
              className="h-[45px] w-[49px]"
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View>
              <Text className="font-sans text-xl font-bold tracking-[-0.45px] text-[#0f172a]">
                Analisis Keuangan
              </Text>
              <View className="mt-1">
                <MonthPicker {...monthPicker} />
              </View>
            </View>
          </View>

          {/* Belum ada halaman notifikasi: tombol tampil tanpa aksi, sama seperti Beranda */}
          <NotificationButton />
        </View>

        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>

      {tab === "budget" ? (
        <BudgetSection selection={budgetMonth} />
      ) : (
        <ComingSoon
          icon={REPORT_COPY.icon}
          title={REPORT_COPY.title}
          description={REPORT_COPY.description}
        />
      )}
    </View>
  );
}

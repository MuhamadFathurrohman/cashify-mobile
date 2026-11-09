import { ComingSoon } from "@/components/ui/ComingSoon";
import {
    SegmentedControl,
    type SegmentOption,
} from "@/components/ui/SegmentedControl";
import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AnalysisTab = "budget" | "report";

const TABS: readonly SegmentOption<AnalysisTab>[] = [
  { value: "budget", label: "Anggaran", icon: "pie-chart" },
  { value: "report", label: "Laporan", icon: "bar-chart-outline" },
];

// Backend belum punya endpoint budgets maupun reports, jadi kedua segmen masih placeholder
const COPY = {
  budget: {
    icon: "pie-chart-outline",
    title: "Anggaran",
    description: "Fitur anggaran bulanan segera hadir.",
  },
  report: {
    icon: "bar-chart-outline",
    title: "Laporan",
    description: "Laporan keuangan segera hadir.",
  },
} as const;

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AnalysisTab>("budget");
  const copy = COPY[tab];

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      {/* Header sederhana; avatar, lonceng, dan pemilih bulan menunggu data backend */}
      <View
        className="gap-4 border-b border-[#f1f5f9] px-5 pb-[13px]"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text className="font-sans text-[18px] font-bold leading-[25px] tracking-[-0.45px] text-[#0f172a]">
          Analisis Keuangan
        </Text>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>

      <ComingSoon
        icon={copy.icon}
        title={copy.title}
        description={copy.description}
      />
    </View>
  );
}

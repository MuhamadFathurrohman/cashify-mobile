import type { ReportInsight, InsightTone } from "./reportInsights";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";

interface ReportInsightCardProps {
  insights: ReportInsight[];
}

const TONE_COLOR: Record<InsightTone, string> = {
  positive: "#7ff9cc",
  warning: "#ffb4a2",
  neutral: "#8fa6bd",
};

// Insight dihitung di klien dari angka laporan; kartu ini hanya menampilkan
// kalimat yang sudah jadi agar aturan bisnis tetap di reportInsights.ts.
export function ReportInsightCard({ insights }: ReportInsightCardProps) {
  if (insights.length === 0) return null;

  return (
    <View className="rounded-3xl bg-[#19324d] p-5">
      <View className="flex-row items-center gap-[10px]">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)]">
          <Ionicons name="bulb-outline" size={17} color="#7ff9cc" />
        </View>
        <Text className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-white">
          Insight Keuangan
        </Text>
      </View>

      <View className="mt-4 gap-3">
        {insights.map((insight) => (
          <View key={insight.text} className="flex-row">
            <View
              className="mt-[6px] h-[6px] w-[6px] rounded-full"
              style={{ backgroundColor: TONE_COLOR[insight.tone] }}
            />
            <Text className="font-sans ml-3 flex-1 text-[13px] leading-5 text-[#dbe7f3]">
              {insight.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

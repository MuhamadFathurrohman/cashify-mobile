import type { BudgetStatus } from "@/types/api";
import { categoryIconName, TYPE_THEME } from "@/utils/categoryIconTheme";
import { formatBalance, formatPlainRupiah } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import { formatPercent } from "./budgetPeriods";

interface BudgetCategoryCardProps {
  name: string;
  icon: string | null;
  // Warna dari GET /categories; bubble ikon mengikuti identitas kategori.
  color: string | null;
  amount: number;
  spent?: number;
  remaining?: number;
  percent?: number;
  status?: BudgetStatus;
  // "preview" dipakai form sebelum disimpan: hanya nama + alokasi, tanpa progres.
  variant?: "list" | "preview";
  // Keterangan kecil di bawah nama pada varian preview.
  caption?: string;
  // Hanya periode aktif: kartu dapat diketuk untuk membuka edit alokasi.
  onPress?: () => void;
}

const AMOUNT_TEXT = "font-sans text-base font-semibold leading-[22px] tracking-[-0.16px]";
const TRACK = "h-2 overflow-hidden rounded-full bg-[#e6eeff]";
const CARD = "rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]";

// status ok = hijau primary; warning & over = coral yang sama (keputusan B-3).
function statusColor(status: BudgetStatus): string {
  return status === "ok" ? "#006c50" : "#ed7658";
}

function statusBadgeClass(status: BudgetStatus): string {
  return status === "ok" ? "bg-[rgba(0,108,80,0.1)]" : "bg-[rgba(237,118,88,0.1)]";
}

// Warna kategori dari backend berupa hex 6 digit; bubble memakai alpha 10%.
// Nilai tak dikenal jatuh ke palet pengeluaran proyek.
function bubbleColor(color: string | null): string {
  return color && /^#[0-9a-f]{6}$/i.test(color)
    ? `${color}1A`
    : TYPE_THEME.expense.bubble;
}

export function BudgetCategoryCard({
  name,
  icon,
  color,
  amount,
  spent = 0,
  remaining = amount,
  percent = 0,
  status = "ok",
  variant = "list",
  caption = "Alokasi baru",
  onPress,
}: BudgetCategoryCardProps) {
  const accent = statusColor(status);
  const iconColor = color ?? TYPE_THEME.expense.text;

  if (variant === "preview") {
    return (
      <View className="flex-row items-center justify-between rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-4">
        <View className="flex-1 flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: bubbleColor(color) }}
          >
            <Ionicons
              name={categoryIconName(icon ?? "", "expense")}
              size={20}
              color={iconColor}
            />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="font-sans text-sm font-semibold leading-5 text-[#121c2a]"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text className="font-sans text-xs leading-4 text-[#43474d]">
              {caption}
            </Text>
          </View>
        </View>
        <Text className={AMOUNT_TEXT} style={{ color: accent }}>
          {formatPlainRupiah(amount)}
        </Text>
      </View>
    );
  }

  const accessibilityLabel = `${name}, terpakai ${formatPlainRupiah(spent)} dari ${formatPlainRupiah(amount)}, sisa ${formatBalance(remaining)}`;

  const content = (
    <>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: bubbleColor(color) }}
          >
            <Ionicons
              name={categoryIconName(icon ?? "", "expense")}
              size={20}
              color={iconColor}
            />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className="font-sans text-xs leading-4 text-[#43474d]"
              numberOfLines={1}
            >
              {`Terpakai ${formatPlainRupiah(spent)} / ${formatPlainRupiah(amount)}`}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1">
          <View className={`rounded-full px-[10px] py-1 ${statusBadgeClass(status)}`}>
            <Text
              className="font-sans text-xs font-bold leading-4"
              style={{ color: accent }}
            >
              {`${formatPercent(percent)}%`}
            </Text>
          </View>
          {onPress ? (
            <Ionicons name="chevron-forward" size={16} color="#74777e" />
          ) : null}
        </View>
      </View>

      <View className={`mt-3 ${TRACK}`}>
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.min(Math.max(percent, 0), 100)}%`,
            backgroundColor: accent,
          }}
        />
      </View>

      <View className="mt-[10px] flex-row items-center justify-between">
        <Text className="font-sans text-xs leading-4 text-[#43474d]">
          Sisa Kuota
        </Text>
        <Text className={AMOUNT_TEXT} style={{ color: accent }}>
          {formatBalance(remaining)}
        </Text>
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel} className={CARD}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}. Ketuk untuk mengubah alokasi`}
      android_ripple={{ color: "rgba(0,0,0,0.05)", borderless: false }}
      className={`${CARD} active:opacity-80`}
    >
      {content}
    </Pressable>
  );
}

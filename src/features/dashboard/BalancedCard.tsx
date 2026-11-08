import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import {
    HIDDEN_AMOUNT,
    formatBalance,
    formatExpense,
    formatIncome,
} from "./money";

interface BalanceCardProps {
  balance: number;
  income: number;
  expense: number;
}

const INCOME_COLOR = "#7ff9cc";
const EXPENSE_COLOR = "#ed7658";

// Lingkaran sinar dekoratif (Figma: lingkaran blur). Blur tidak tersedia di RN,
// jadi tepinya dibuat lembut dengan gradien radial yang memudar ke transparan.
function Sheen({
  id,
  size,
  color,
  opacity,
  position,
}: {
  id: string;
  size: number;
  color: string;
  opacity: number;
  position: { top?: number; right?: number; bottom?: number; left?: number };
}) {
  const r = size / 2;
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", width: size, height: size, ...position }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function SummaryTile({
  label,
  amount,
  color,
  iconBackground,
  icon,
}: {
  label: string;
  amount: string;
  color: string;
  iconBackground: string;
  icon: "arrow-down" | "arrow-up";
}) {
  return (
    <View className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.1)] p-[13px]">
      <View className="flex-row items-center">
        <View
          className="h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBackground }}
        >
          <Ionicons name={icon} size={12} color={color} />
        </View>
        <Text className="ml-[6px] text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#e2e8f0]">
          {label}
        </Text>
      </View>
      <Text
        className="mt-[6px] text-base font-semibold leading-[22px] tracking-[-0.4px]"
        style={{ color }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {amount}
      </Text>
      <Text className="mt-[2px] text-[10px] leading-[14px] text-[#829aba]">
        Bulan ini
      </Text>
    </View>
  );
}

// Kartu ringkasan: saldo total (seluruh waktu) dan pemasukan/pengeluaran bulan ini.
// Badge "Utama" dari desain tidak dipakai (keputusan 6: saldo agregat, bukan per dompet).
export function BalanceCard({ balance, income, expense }: BalanceCardProps) {
  // Hanya state lokal, tidak disimpan (keputusan 10)
  const [hidden, setHidden] = useState(false);

  return (
    <View
      className="overflow-hidden rounded-3xl bg-[#19324d] p-5"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 6,
      }}
    >
      <Sheen
        id="sheenTop"
        size={192}
        color="#d2e4ff"
        opacity={0.2}
        position={{ top: -48, right: -48 }}
      />
      <Sheen
        id="sheenBottom"
        size={160}
        color="#006c50"
        opacity={0.35}
        position={{ bottom: -32, left: -32 }}
      />

      <Text className="text-xs leading-4 tracking-[0.3px] text-[#829aba]">
        Total Saldo Akun
      </Text>
      <View className="mt-2 flex-row items-center">
        <Text
          className="text-[32px] font-bold leading-[38px] tracking-[-0.8px]"
          style={{
            color: balance < 0 && !hidden ? EXPENSE_COLOR : "#ffffff",
            flexShrink: 1,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {hidden ? HIDDEN_AMOUNT : formatBalance(balance)}
        </Text>
        <Pressable
          onPress={() => setHidden((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
          hitSlop={12}
          className="ml-[10px]"
        >
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#829aba"
          />
        </Pressable>
      </View>

      <View className="mt-5 flex-row gap-[10px]">
        <SummaryTile
          label="Pemasukan"
          amount={formatIncome(income)}
          color={INCOME_COLOR}
          iconBackground="rgba(127,249,204,0.2)"
          icon="arrow-down"
        />
        <SummaryTile
          label="Pengeluaran"
          amount={formatExpense(expense)}
          color={EXPENSE_COLOR}
          iconBackground="rgba(237,118,88,0.2)"
          icon="arrow-up"
        />
      </View>
    </View>
  );
}

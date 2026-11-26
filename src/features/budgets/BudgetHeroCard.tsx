import type { BudgetStatus } from "@/types/api";
import { formatBalance, formatPlainRupiah } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import { formatPercent } from "./budgetPeriods";

interface BudgetHeroCardProps {
  total: number;
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
  // 0 = hari terakhir, negatif = periode sudah lewat
  daysLeft: number;
  // Bulan lampau dibuka baca-saja: badge hari tersisa diganti keterangan periode.
  isActive: boolean;
  // Bulan lampau memakai label periodenya sendiri, bukan "Bulan Ini".
  label?: string;
  // Hanya dikirim untuk periode aktif; bulan lampau bersifat baca-saja.
  onEditTotal?: () => void;
}

// Sisa/terpakai memakai palet proyek, bukan warna Figma: hijau untuk aman,
// coral untuk warning maupun over (keputusan B-3: keduanya disamakan).
const STATUS_FILL: Record<BudgetStatus, string> = {
  ok: "#7ff9cc",
  warning: "#ed7658",
  over: "#ed7658",
};

function daysBadge(daysLeft: number, isActive: boolean): string {
  if (!isActive) return "Periode selesai";
  if (daysLeft === 0) return "Hari terakhir";
  return `${daysLeft} hari tersisa`;
}

function MetaTile({
  label,
  amount,
  hint,
  color,
}: {
  label: string;
  amount: string;
  hint: string;
  color: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.1)] p-[13px]">
      <Text className="font-sans text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#e2e8f0]">
        {label}
      </Text>
      <Text
        className="font-sans mt-[6px] text-base font-semibold leading-[22px] tracking-[-0.4px]"
        style={{ color }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {amount}
      </Text>
      <Text className="font-sans mt-[2px] text-[10px] leading-[14px] text-[#829aba]">
        {hint}
      </Text>
    </View>
  );
}

// Kartu ringkasan anggaran bulan terpilih. Nominal memakai ukuran yang sama dengan
// kartu saldo Beranda (25/30, tracking -0.8) supaya kedua layar tidak berbeda.
export function BudgetHeroCard({
  total,
  spent,
  remaining,
  percent,
  status,
  daysLeft,
  isActive,
  label = "Total Anggaran Bulan Ini",
  onEditTotal,
}: BudgetHeroCardProps) {
  const fill = STATUS_FILL[status];
  const remainingColor = status === "ok" ? "#7ff9cc" : "#ed7658";
  const remainingPercent = 100 - percent;
  const remainingHint =
    remainingPercent >= 0
      ? `Sisa ${formatPercent(remainingPercent)}%`
      : `Lewat ${formatPercent(Math.abs(remainingPercent))}%`;

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
      {/* Dekorasi lingkaran lembut; blur Figma tidak dipakai (proyek menghindari expo-blur) */}
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          width: 192,
          height: 192,
          top: -48,
          right: -48,
          backgroundColor: "rgba(210,228,255,0.12)",
        }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          width: 160,
          height: 160,
          bottom: -32,
          left: -32,
          backgroundColor: "rgba(0,108,80,0.28)",
        }}
      />

      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-xs leading-4 tracking-[0.3px] text-[#829aba]">
          {label}
        </Text>
        <View className="rounded-full bg-[rgba(255,255,255,0.12)] px-[10px] py-1">
          <Text className="font-sans text-[10px] font-semibold leading-[14px] text-[#e2e8f0]">
            {daysBadge(daysLeft, isActive)}
          </Text>
        </View>
      </View>

      <View className="mt-2 flex-row items-center">
        <Text className="font-sans text-[25px] font-semibold leading-[30px] text-white">
          Rp
        </Text>
        <Text
          className="font-sans ml-[10px] text-[25px] font-bold leading-[30px] tracking-[-0.8px] text-white"
          style={{ flexShrink: 1 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatPlainRupiah(total).replace("Rp ", "")}
        </Text>
        {onEditTotal ? (
          <Pressable
            onPress={onEditTotal}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Ubah total anggaran"
            className="ml-auto h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)] active:opacity-80"
          >
            <Ionicons name="pencil" size={16} color="#e2e8f0" />
          </Pressable>
        ) : null}
      </View>

      <View className="mt-4">
        <View className="h-[10px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.15)]">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(Math.max(percent, 0), 100)}%`,
              backgroundColor: fill,
            }}
          />
        </View>
        <View className="mt-[6px] flex-row items-center justify-between">
          <Text className="font-sans text-[10px] leading-[14px] text-[#829aba]">
            {`Terpakai ${formatPlainRupiah(spent)}`}
          </Text>
          <Text className="font-sans text-[10px] font-semibold leading-[14px] text-[#e2e8f0]">
            {`${formatPercent(percent)}% digunakan`}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-[10px]">
        <MetaTile
          label="Terpakai"
          amount={formatPlainRupiah(spent)}
          hint={`${formatPercent(percent)}% dari batas`}
          color="#ffffff"
        />
        <MetaTile
          label="Sisa Anggaran"
          amount={formatBalance(remaining)}
          hint={remainingHint}
          color={remainingColor}
        />
      </View>
    </View>
  );
}

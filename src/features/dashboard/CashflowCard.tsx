import { formatPlainRupiah, formatSigned } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import type { CashflowBucket } from "./cashflow";

interface CashflowCardProps {
  buckets: CashflowBucket[];
  monthLabel: string; // mis. "November 2026"
  today: number; // tanggal hari ini (zona Jakarta); rentang yang memuatnya dicetak tebal
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
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

// Grafik batang 4 rentang tanggal bulan berjalan (keputusan 4), dibuat dari View
// tanpa dependensi grafik. Warna batang tidak berubah; kolom yang dipilih diberi
// latar dan label tebal. Detail nominal tampil di panel inline, bukan modal.
export function CashflowCard({
  buckets,
  monthLabel,
  today,
  selectedIndex,
  onSelect,
}: CashflowCardProps) {
  const max = Math.max(0, ...buckets.flatMap((b) => [b.income, b.expense]));
  const isEmpty = max === 0;
  const active = selectedIndex === null ? null : buckets[selectedIndex];
  const shortMonth = monthLabel.split(" ")[0]?.slice(0, 3) ?? "";

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
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]">
            Arus Kas Bulan Ini
          </Text>
          <Text className="font-sans text-xs leading-4 text-[#43474d]">
            {monthLabel}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <LegendDot color={INCOME_COLOR} label="Masuk" />
          <LegendDot color={EXPENSE_COLOR} label="Keluar" />
        </View>
      </View>

      {isEmpty ? (
        <View className="h-[144px] items-center justify-center px-4">
          <Ionicons name="bar-chart-outline" size={28} color="#c4c6ce" />
          <Text className="font-sans mt-2 text-sm font-semibold text-[#43474d]">
            Belum ada arus kas
          </Text>
          <Text className="font-sans mt-1 text-center text-xs leading-4 text-[#74777e]">
            Transaksi bulan ini akan tampil di sini.
          </Text>
        </View>
      ) : (
        <View
          className="h-[136px] flex-row items-end px-2 pt-4"
          accessibilityLabel={`Grafik arus kas ${monthLabel}`}
          // Pemisah jadi milik chart, bukan panel. Padding bawah memberi jarak
          // antara label batang dan garis; total tinggi tetap 136 + 8 = 144.
          style={{
            paddingBottom: 4,
            borderBottomWidth: 1,
            borderBottomColor: "#eef2f7",
          }}
        >
          {buckets.map((bucket, index) => {
            const isCurrent =
              today >= bucket.startDay && today <= bucket.endDay;
            const isSelected = selectedIndex === index;
            return (
              <Pressable
                key={bucket.label}
                onPress={() => onSelect(isSelected ? null : index)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${bucket.label}: masuk ${formatPlainRupiah(bucket.income)}, keluar ${formatPlainRupiah(bucket.expense)}`}
                android_ripple={{
                  color: "rgba(0,0,0,0.05)",
                  borderless: false,
                }}
                className="flex-1 items-center rounded-xl pb-1 pt-1"
                style={{
                  backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                }}
              >
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
                    isSelected || isCurrent
                      ? "font-sans pt-2 text-[10px] font-bold leading-[14px] tracking-[0.4px] text-[#001d37]"
                      : "font-sans pt-2 text-[10px] font-semibold leading-[14px] tracking-[0.4px] text-[#74777e]"
                  }
                >
                  {bucket.label}
                </Text>
                {/* Wrapper tetap dirender agar tinggi kolom tidak berubah,
                    tetapi titik hanya tampil saat batang dipilih */}
                <View className="mt-[2px] h-[8px] items-center justify-center">
                  {isSelected ? (
                    <Ionicons name="ellipse" size={8} color={INCOME_COLOR} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Ruang detail disiapkan dari awal agar kartu tidak meloncat saat batang dipilih */}
      <View
        style={{
          // Tinggi tetap agar kartu tidak bergerak saat teks berganti ke detail.
          // Pemisah ada di borderBottom chart, jadi panel cukup menengahkan isi.
          height: 50,
          justifyContent: "center",
        }}
      >
        {active ? (
          <View className="flex-row items-center">
            <Text
              className="font-sans w-[88px] text-[11px] font-semibold leading-4 text-[#001d37]"
              numberOfLines={1}
            >
              {active.label} {shortMonth}
            </Text>
            <View
              style={{
                width: 1,
                height: 35,
                marginHorizontal: 10,
                backgroundColor: "#e2e8f0",
              }}
            />
            <View className="flex-1 gap-[3px]">
              <DetailRow
                label="Uang masuk"
                value={formatPlainRupiah(active.income)}
                color={INCOME_COLOR}
              />
              <DetailRow
                label="Uang keluar"
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
            {isEmpty
              ? "Belum ada detail arus kas bulan ini."
              : "Setiap batang grafik mewakili periode 7 hari. Ketuk untuk melihat rincian pemasukan dan pengeluaran."}
          </Text>
        )}
      </View>
    </View>
  );
}

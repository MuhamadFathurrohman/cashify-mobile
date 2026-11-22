import { SkeletonBlock, SkeletonPulse } from "@/components/ui/Skeleton";
import { View } from "react-native";

// Placeholder saat data Beranda pertama dimuat. Satu pulse untuk seluruh
// kerangka (aturan 42); balok memakai primitive bersama agar ritme denyutnya
// identik dengan skeleton form transaksi dan status WhatsApp.
export function DashboardSkeleton() {
  return (
    <SkeletonPulse accessibilityLabel="Memuat ringkasan keuangan">
      <View className="gap-5">
        {/* Kartu Total Saldo Akun */}
        {/* Warna kartu mengikuti BalancedCard (#19324d) agar tidak ada
            lompatan warna saat skeleton berganti ke konten asli */}
        <View className="rounded-3xl bg-[#19324d] p-5">
          <SkeletonBlock className="h-4 w-[110px] rounded-md" />
          <View className="mt-2 flex-row items-center">
            <SkeletonBlock className="h-[30px] w-[170px] rounded-md" />
            <SkeletonBlock className="ml-[10px] h-4 w-4 rounded-full" />
          </View>
          <View className="mt-5 flex-row gap-[10px]">
            <View className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.1)] p-[13px]">
              <View className="flex-row items-center">
                <SkeletonBlock className="h-6 w-6 rounded-full" />
                <SkeletonBlock className="ml-[6px] h-[14px] w-[64px] rounded-md" />
              </View>
              <SkeletonBlock className="mt-[6px] h-[22px] w-[90px] rounded-md" />
              <SkeletonBlock className="mt-[2px] h-[14px] w-[50px] rounded-md" />
            </View>
            <View className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.1)] p-[13px]">
              <View className="flex-row items-center">
                <SkeletonBlock className="h-6 w-6 rounded-full" />
                <SkeletonBlock className="ml-[6px] h-[14px] w-[70px] rounded-md" />
              </View>
              <SkeletonBlock className="mt-[6px] h-[22px] w-[92px] rounded-md" />
              <SkeletonBlock className="mt-[2px] h-[14px] w-[50px] rounded-md" />
            </View>
          </View>
        </View>

        {/* Kartu Arus Kas: judul, grafik 4 rentang, pemisah, panel hint 2 baris */}
        <View className="rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-[21px]">
          <View className="flex-row items-center justify-between">
            <View>
              <SkeletonBlock className="h-[22px] w-[130px] rounded-md" />
              <SkeletonBlock className="h-4 w-[80px] rounded-md" />
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <SkeletonBlock className="h-[10px] w-[10px] rounded-full" />
                <SkeletonBlock className="ml-1 h-3 w-[30px] rounded-md" />
              </View>
              <View className="flex-row items-center">
                <SkeletonBlock className="h-[10px] w-[10px] rounded-full" />
                <SkeletonBlock className="ml-1 h-3 w-[34px] rounded-md" />
              </View>
            </View>
          </View>

          <View className="mt-3 h-[136px] flex-row items-end border-b border-[#eef2f7] px-2 pb-1">
            {/* Tinggi ditulis eksplisit agar class Tailwind selalu ter-generate */}
            <View className="flex-1 items-center">
              <View className="flex-row items-end" style={{ gap: 6 }}>
                <SkeletonBlock className="h-[62px] w-3 rounded-t-lg" />
                <SkeletonBlock className="h-[34px] w-3 rounded-t-lg" />
              </View>
              <SkeletonBlock className="mt-2 h-3 w-[34px] rounded-md" />
            </View>
            <View className="flex-1 items-center">
              <View className="flex-row items-end" style={{ gap: 6 }}>
                <SkeletonBlock className="h-[82px] w-3 rounded-t-lg" />
                <SkeletonBlock className="h-[48px] w-3 rounded-t-lg" />
              </View>
              <SkeletonBlock className="mt-2 h-3 w-[34px] rounded-md" />
            </View>
            <View className="flex-1 items-center">
              <View className="flex-row items-end" style={{ gap: 6 }}>
                <SkeletonBlock className="h-[43px] w-3 rounded-t-lg" />
                <SkeletonBlock className="h-[67px] w-3 rounded-t-lg" />
              </View>
              <SkeletonBlock className="mt-2 h-3 w-[34px] rounded-md" />
            </View>
            <View className="flex-1 items-center">
              <View className="flex-row items-end" style={{ gap: 6 }}>
                <SkeletonBlock className="h-[91px] w-3 rounded-t-lg" />
                <SkeletonBlock className="h-[38px] w-3 rounded-t-lg" />
              </View>
              <SkeletonBlock className="mt-2 h-3 w-[34px] rounded-md" />
            </View>
          </View>

          {/* Panel hint dua baris mengikuti teks panjang "Setiap batang...".
              Jarak 12 px setelah border mengikuti gap-3 pada CashflowCard. */}
          <View className="mt-3 h-[50px] justify-center gap-[6px]">
            <SkeletonBlock className="h-[14px] w-full rounded-md" />
            <SkeletonBlock className="h-[14px] w-[70%] rounded-md" />
          </View>
        </View>

        {/* Transaksi Terbaru: judul + 5 baris placeholder */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <SkeletonBlock className="h-5 w-[120px] rounded-md" />
            <SkeletonBlock className="h-4 w-[70px] rounded-md" />
          </View>
          <View className="gap-[10px]">
            {[0, 1, 2, 3, 4].map((row) => (
              <View
                key={row}
                className="flex-row items-center justify-between rounded-xl border border-[rgba(196,198,206,0.3)] bg-white p-[15px]"
              >
                <View className="flex-1 flex-row items-center">
                  <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                  <View className="ml-3 flex-1 gap-[6px]">
                    <SkeletonBlock className="h-4 w-[140px] rounded-md" />
                    <SkeletonBlock className="h-3 w-[100px] rounded-md" />
                  </View>
                </View>
                <View className="items-end pl-3">
                  <SkeletonBlock className="h-4 w-[96px] rounded-md" />
                  <SkeletonBlock className="mt-[6px] h-[18px] w-[46px] rounded-full" />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SkeletonPulse>
  );
}

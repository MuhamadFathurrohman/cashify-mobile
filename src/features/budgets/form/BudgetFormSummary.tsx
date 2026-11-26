import { formatPlainRupiah } from "@/utils/money";
import { Pressable, Text, View } from "react-native";

export interface SummaryRow {
  label: string;
  value: number;
}

// Penanda posisi pada mode buat: total dulu, baru alokasi.
export function BudgetStepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-6 rounded-full bg-[#006c50]" />
        <View
          className={`h-2 rounded-full ${
            step === 2 ? "w-6 bg-[#006c50]" : "w-2 bg-[#c4c6ce]"
          }`}
        />
      </View>
      <Text className="font-sans text-xs font-medium leading-4 text-[#43474d]">
        {`Langkah ${step} dari 2`}
      </Text>
    </View>
  );
}

// Ringkasan plafon: satu tempat untuk melihat total dan sisanya, dengan tautan
// ke tampilan ubah total. Nilai nominal tidak diinput di sini.
export function TotalSummaryCard({
  total,
  rows,
  editLabel,
  onEdit,
}: {
  total: number;
  rows: SummaryRow[];
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <View className="rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-sans text-xs font-semibold leading-4 tracking-[0.24px] text-[#43474d]">
            Total anggaran
          </Text>
          <Text className="font-sans mt-1 text-lg font-bold leading-6 text-[#001d37]">
            {formatPlainRupiah(total)}
          </Text>
        </View>
        <Pressable
          onPress={onEdit}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={editLabel}
        >
          <Text className="font-sans text-xs font-semibold leading-4 text-[#006c50]">
            {editLabel}
          </Text>
        </Pressable>
      </View>

      <View className="mt-3 gap-1">
        {rows.map((row) => (
          <View
            key={row.label}
            className="flex-row items-center justify-between gap-3"
          >
            <Text className="font-sans flex-1 text-xs leading-4 text-[#43474d]">
              {row.label}
            </Text>
            <Text className="font-sans text-xs font-semibold leading-4 text-[#121c2a]">
              {formatPlainRupiah(row.value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

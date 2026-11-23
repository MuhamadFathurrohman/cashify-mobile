import type { Transaction } from "@/types/api";
import { formatDateLong, formatRelativeDate } from "@/utils/jakartaDates";
import { memo } from "react";
import { Text, View } from "react-native";
import { TransactionListItem } from "./TransactionListItem";

export interface DateGroup {
  date: string;
  items: Transaction[];
}

// Mengelompokkan menurut `date` TANPA sorting ulang: urutan grup dan item mengikuti backend
// (date DESC, id DESC). Item dengan id yang sama (mis. data bergeser saat paginasi) dibuang.
export function groupByDate(items: Transaction[]): DateGroup[] {
  const groups: DateGroup[] = [];
  const indexByDate = new Map<string, number>();
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);

    const index = indexByDate.get(item.date);
    if (index === undefined) {
      indexByDate.set(item.date, groups.length);
      groups.push({ date: item.date, items: [item] });
    } else {
      groups[index].items.push(item);
    }
  }
  return groups;
}

// "Hari ini — 26 Oktober 2026", "Kemarin — ...", selain itu "12 Oktober 2026"
function groupLabel(date: string): string {
  const long = formatDateLong(date);
  const relative = formatRelativeDate(date);
  return relative === "Hari ini" || relative === "Kemarin"
    ? `${relative} — ${long}`
    : long;
}

// Satu kelompok tanggal: label di atas, item dalam satu kartu dengan pemisah antar item.
export const TransactionDateGroup = memo(function TransactionDateGroup({
  group,
  onPressItem,
}: {
  group: DateGroup;
  onPressItem: (id: string) => void;
}) {
  return (
    <View className="gap-[10px]">
      <Text className="font-sans px-1 text-xs font-semibold leading-4 tracking-[0.3px] text-[#43474d]">
        {groupLabel(group.date)}
      </Text>
      <View
        className="rounded-3xl border border-[rgba(196,198,206,0.3)] bg-white px-[13px]"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        {group.items.map((item) => (
          <TransactionListItem
            key={item.id}
            item={item}
            onPress={() => onPressItem(item.id)}
          />
        ))}
      </View>
    </View>
  );
});

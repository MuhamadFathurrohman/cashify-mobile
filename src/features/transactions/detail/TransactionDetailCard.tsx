import type { TransactionDetail } from "@/types/api";
import { categoryIconName, TYPE_THEME } from "@/utils/categoryIconTheme";
import {
  formatDateLong,
  formatJakartaTime,
  formatRelativeDate,
} from "@/utils/jakartaDates";
import { formatExpense, formatIncome } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";
import { SOURCE_LABELS } from "../sourceLabels";

const CARD =
  "rounded-3xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]";
const LABEL =
  "font-sans text-xs font-semibold leading-4 tracking-[0.24px] text-[#43474d]";
const VALUE = "font-sans text-sm font-semibold leading-5 text-[#121c2a]";
const BUBBLE = "h-10 w-10 items-center justify-center rounded-2xl";

// "26 November 2026" + "Hari ini"/"Kemarin" bila berlaku, lalu jam Jakarta
function dateValue(item: TransactionDetail): string {
  const long = formatDateLong(item.date);
  const relative = formatRelativeDate(item.date);
  const date =
    relative === "Hari ini" || relative === "Kemarin"
      ? `${relative}, ${long}`
      : long;
  const time = item.occured_at ? formatJakartaTime(item.occured_at) : "";
  return time ? `${date} • ${time}` : date;
}

interface DetailRowProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  bubbleClassName?: string;
  // Warna dari TYPE_THEME dipasang lewat style karena berupa string rgba, bukan kelas
  bubbleColor?: string;
  iconColor: string;
  label: string;
  value: string;
  last?: boolean;
}

function DetailRow({
  icon,
  bubbleClassName = "",
  bubbleColor,
  iconColor,
  label,
  value,
  last = false,
}: DetailRowProps) {
  return (
    <View
      className={`flex-row items-center gap-3 ${
        last ? "" : "border-b border-[rgba(196,198,206,0.2)] pb-[13px]"
      }`}
    >
      <View
        className={`${BUBBLE} ${bubbleClassName}`}
        style={bubbleColor ? { backgroundColor: bubbleColor } : undefined}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={LABEL}>{label}</Text>
        <Text className={VALUE} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// Isi utama layar detail: nominal, jenis, lalu rincian kategori/dompet/tanggal/sumber
// dan catatan. Pesan WhatsApp asal dirender terpisah oleh TransactionSourceMessage.
export function TransactionDetailCard({
  item,
}: {
  item: TransactionDetail;
}) {
  const isIncome = item.type === "income";
  const theme = TYPE_THEME[item.type];
  const description = item.description?.trim();

  return (
    <View className="gap-4">
      {/* Nominal dan jenis */}
      <View className={`${CARD} items-center gap-1`}>
        <View
          className="rounded-full px-[10px] py-[2px]"
          style={{ backgroundColor: theme.badge }}
        >
          <Text
            className="font-sans text-[10px] font-semibold leading-[14px] tracking-[0.4px]"
            style={{ color: theme.text }}
          >
            {isIncome ? "PEMASUKAN" : "PENGELUARAN"}
          </Text>
        </View>
        <Text
          className="mt-1 font-sans text-[28px] font-bold leading-9 tracking-[-0.32px]"
          style={{ color: theme.text }}
        >
          {isIncome ? formatIncome(item.amount) : formatExpense(item.amount)}
        </Text>
        <Text className="font-sans text-xs leading-4 text-[#43474d]">
          {item.category.name}
        </Text>
      </View>

      {/* Rincian */}
      <View className={`${CARD} gap-3`}>
        <DetailRow
          icon={categoryIconName(item.category.icon, item.type)}
          bubbleColor={theme.bubble}
          iconColor={theme.text}
          label="Kategori"
          value={item.category.name}
        />
        <DetailRow
          icon="wallet-outline"
          bubbleClassName="bg-[rgba(127,249,204,0.4)]"
          iconColor={TYPE_THEME.income.text}
          label="Dompet / Sumber Dana"
          value={item.account.name}
        />
        <DetailRow
          icon="calendar-outline"
          bubbleClassName="bg-[#dee9fc]"
          iconColor="#121c2a"
          label="Tanggal"
          value={dateValue(item)}
        />
        <DetailRow
          icon={
            item.source === "whatsapp"
              ? "chatbubble-ellipses-outline"
              : "create-outline"
          }
          bubbleClassName="bg-[rgba(196,198,206,0.25)]"
          iconColor="#43474d"
          label="Dicatat melalui"
          value={SOURCE_LABELS[item.source]}
          last
        />
      </View>

      {/* Catatan hanya ditampilkan bila ada isinya */}
      {description ? (
        <View className={CARD}>
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="reorder-three-outline" size={18} color="#43474d" />
            <Text className={LABEL}>Catatan</Text>
          </View>
          <View className="rounded-xl border border-[rgba(196,198,206,0.3)] bg-[#f8f9ff] p-[13px]">
            <Text className="font-sans text-sm leading-5 text-[#121c2a]">
              {description}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

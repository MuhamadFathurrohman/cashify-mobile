import type { TransactionDetail } from "@/types/api";
import { formatJakartaDateTime } from "@/utils/jakartaDates";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";

const CARD =
  "rounded-3xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]";

// Pesan WhatsApp asal transaksi (GET /transactions/{id}.source_message).
// Hanya dirender pemanggil bila source_message tidak null.
export function TransactionSourceMessage({
  message,
}: {
  message: NonNullable<TransactionDetail["source_message"]>;
}) {
  const body = message.body?.trim();
  const received = formatJakartaDateTime(message.received_at);

  return (
    <View className={`${CARD} gap-2`}>
      <View className="flex-row items-center gap-2">
        <Ionicons name="logo-whatsapp" size={18} color="#006c50" />
        <Text className="font-sans text-xs font-semibold leading-4 tracking-[0.24px] text-[#43474d]">
          Pesan WhatsApp
        </Text>
      </View>

      <View className="rounded-xl border border-[rgba(196,198,206,0.3)] bg-[rgba(127,249,204,0.15)] p-[13px]">
        <Text className="font-sans text-sm leading-5 text-[#121c2a]">
          {body || "Pesan tidak menyertakan teks."}
        </Text>
      </View>

      {received ? (
        <Text className="font-sans text-xs leading-4 text-[#74777e]">
          Diterima {received}
        </Text>
      ) : null}
    </View>
  );
}

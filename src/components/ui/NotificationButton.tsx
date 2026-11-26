import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, View } from "react-native";

interface NotificationButtonProps {
  // Badge titik hanya muncul bila Notification Center sudah memberi status unread.
  hasUnread?: boolean;
  // Belum ada halaman notifikasi; prop disediakan agar pemanggil bisa memasangnya
  // saat layar notifikasi dibangun (milestone terpisah).
  onPress?: () => void;
}

// Tombol lonceng header (Figma 69:1814): 40×40 putih, border tipis, badge titik.
// Dipakai Beranda dan tab Analisis agar ukuran serta bayangannya tidak berbeda.
export function NotificationButton({
  hasUnread = false,
  onPress,
}: NotificationButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        hasUnread ? "Notifikasi, ada yang belum dibaca" : "Notifikasi"
      }
      hitSlop={8}
      android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}
      className="items-center justify-center rounded-[16px]"
      style={{
        width: 40,
        height: 40,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "rgba(196,198,206,0.3)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
      }}
    >
      <Ionicons name="notifications-outline" size={18} color="#0f172a" />
      {hasUnread ? (
        <View
          className="absolute right-[5px] top-[5px] rounded-full"
          style={{
            width: 14,
            height: 14,
            backgroundColor: "#ed7658",
            borderWidth: 2,
            borderColor: "#ffffff",
          }}
        />
      ) : null}
    </Pressable>
  );
}

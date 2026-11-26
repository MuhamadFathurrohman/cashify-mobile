import { NotificationButton } from "@/components/ui/NotificationButton";
import { Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOGO_ICON = require("@/assets/images/logo-icon-cashify.png");
const LOGO_TEXT = require("@/assets/images/logo-text-cashify.png");

interface HomeHeaderProps {
  // Badge titik hanya muncul bila Notification Center sudah memberi status unread.
  hasUnread?: boolean;
  // Belum ada tujuan navigasi; disediakan agar tombol langsung bisa dipasang saat
  // halaman notifikasi dibangun (milestone terpisah).
  onNotificationPress?: () => void;
}

// Header tetap. Logo aset proyek dipakai berdampingan secara horizontal, dengan
// tombol notifikasi di kanan mengikuti node Figma 69:1814 (40×40, badge titik).
export function HomeHeader({
  hasUnread = false,
  onNotificationPress,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-b border-[rgba(196,198,206,0.25)] bg-[#f8f9ff] px-5 pb-[14px]"
      style={{ paddingTop: insets.top + 14 }}
    >
      <View
        className="flex-row items-center justify-between"
        style={{ height: 41 }}
      >
        <View className="flex-row items-center">
          <Image
            source={LOGO_ICON}
            className="h-[45px] w-[49px]"
            resizeMode="contain"
          />
          <Image
            source={LOGO_TEXT}
            className="ml-[6px] h-[22px] w-[64px] mt-2"
            resizeMode="contain"
          />
        </View>

        <NotificationButton
          hasUnread={hasUnread}
          onPress={onNotificationPress}
        />
      </View>
    </View>
  );
}

import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter, type Href, type Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Tipe props diambil dari <Tabs> agar tidak mengimpor paket transitif.
// Hanya `state` yang dipakai: props bar di SDK ini tidak menyertakan `navigation`
type TabsProps = ComponentProps<typeof Tabs>;
type TabBarProps = Parameters<NonNullable<TabsProps["tabBar"]>>[0];
type IconName = ComponentProps<typeof Ionicons>["name"];

interface BottomTabBarProps extends TabBarProps {
  onAddPress: () => void;
}

interface TabConfig {
  label: string;
  icon: IconName;
  iconActive: IconName;
  href: Href;
}

interface TabItem {
  route: TabBarProps["state"]["routes"][number];
  config: TabConfig;
  focused: boolean;
}

// Urutan tab mengikuti urutan <Tabs.Screen> di layout; dua pertama di kiri, sisanya di kanan
const TAB_CONFIG: Record<string, TabConfig> = {
  index: {
    label: "Beranda",
    icon: "home-outline",
    iconActive: "home",
    href: "/(tabs)",
  },
  history: {
    label: "Transaksi",
    icon: "receipt-outline",
    iconActive: "receipt",
    href: "/(tabs)/history",
  },
  analysis: {
    label: "Analisis",
    icon: "stats-chart-outline",
    iconActive: "stats-chart",
    href: "/(tabs)/analysis",
  },
  profile: {
    label: "Profil",
    icon: "person-outline",
    iconActive: "person",
    href: "/(tabs)/profile",
  },
};

// Bar berupa capsule; radius selalu setengah tinggi, jadi tidak perlu konstanta terpisah
const BAR = {
  height: 80,
  inset: 12, // jarak capsule ke tepi layar
  minBottom: 20, // jarak minimal ke tepi bawah
  fab: 70,
} as const;

// ⚠️ `accent` adalah tint lebih terang dari primary brand #006c50: brand asli hanya
// berkontras ±2,8:1 di atas bar gelap (hitungan manual), tint ini ±9:1.
const COLORS = {
  bar: "#0f172a",
  accent: "#34d399",
  inactive: "#94a3b8",
  fab: "#006c50",
  fabRing: "#7ff9cc",
} as const;

const ICON_SIZE = 20;

// +8 ruang napas: pada navigasi 2/3 tombol, inset yang dilaporkan sistem kadang
// lebih kecil dari tinggi tombol sehingga bar terlihat mepet ke tombol sistem.
function barBottomGap(bottom: number) {
  return Math.max(bottom, BAR.minBottom) + 8;
}

// Ruang yang harus disisakan layar tab di bawah kontennya supaya item terakhir
// tidak tertutup capsule. Bar bersifat overlay, jadi tidak memakan layout.
export function useTabBarClearance() {
  const insets = useSafeAreaInsets();
  return BAR.height + barBottomGap(insets.bottom) + 8;
}

export function BottomTabBar({ state, onAddPress }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const activeKey = state.routes[state.index]?.key;
  const tabs: TabItem[] = state.routes.flatMap((route) => {
    const config = TAB_CONFIG[route.name];
    return config ? [{ route, config, focused: route.key === activeKey }] : [];
  });
  const half = Math.ceil(tabs.length / 2);

  const handlePress = (item: TabItem) => {
    if (!item.focused) router.navigate(item.config.href);
  };

  const renderTab = (item: TabItem) => {
    const { route, config, focused } = item;
    return (
      // Tanpa fungsi pada `style` Pressable dan tanpa class warna pada Pressable:
      // keduanya tidak diterapkan di proyek ini. Layout lewat className, efek tekan lewat ripple
      <Pressable
        key={route.key}
        onPress={() => handlePress(item)}
        accessibilityRole="tab"
        accessibilityLabel={config.label}
        accessibilityState={{ selected: focused }}
        android_ripple={{ color: "rgba(255,255,255,0.12)", borderless: false }}
        className="flex-1 items-center justify-center py-1"
      >
        <Ionicons
          name={focused ? config.iconActive : config.icon}
          size={ICON_SIZE}
          color={focused ? COLORS.accent : COLORS.inactive}
        />
        <Text
          className={
            focused
              ? "font-sans mt-1 text-center text-[10px] font-bold leading-[15px] text-[#34d399]"
              : "font-sans mt-1 text-center text-[10px] font-normal leading-[15px] text-[#94a3b8]"
          }
        >
          {config.label}
        </Text>
      </Pressable>
    );
  };

  return (
    // Overlay transparan: latar layar tab terlihat di sekitar capsule dan konten
    // bisa menggulir di belakangnya. `box-none` agar area kosong tidak menelan sentuhan.
    <View
      style={{
        pointerEvents: "box-none",
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: BAR.inset,
        paddingBottom: barBottomGap(insets.bottom),
      }}
    >
      <View
        className="flex-row items-center"
        style={{
          height: BAR.height,
          borderRadius: BAR.height / 2,
          paddingHorizontal: 6,
          overflow: "hidden", // ripple tab mengikuti bentuk capsule
          backgroundColor: COLORS.bar,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {tabs.slice(0, half).map(renderTab)}

        <View className="flex-1 items-center">
          <Pressable
            onPress={onAddPress}
            accessibilityRole="button"
            accessibilityLabel="Catat transaksi"
            android_ripple={{
              color: "rgba(255,255,255,0.2)",
              borderless: false,
            }}
            className="items-center justify-center overflow-hidden rounded-full"
            style={{
              width: BAR.fab,
              height: BAR.fab,
              // Warna lewat style: class bg pada Pressable tidak diterapkan di proyek ini
              backgroundColor: COLORS.fab,
              borderWidth: 2,
              borderColor: COLORS.fabRing,
            }}
          >
            <Ionicons name="add" size={30} color="#ffffff" />
          </Pressable>
        </View>

        {tabs.slice(half).map(renderTab)}
      </View>
    </View>
  );
}

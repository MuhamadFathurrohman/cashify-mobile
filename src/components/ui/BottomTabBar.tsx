import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter, type Href, type Tabs } from "expo-router";
import type { ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

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

// Bar gelap agar kontras. Warna untuk prop non-className (ikon, SVG, style Pressable).
// Class pada <Text>/<View> memakai nilai hex yang sama.
// ⚠️ `accent` adalah tint lebih terang dari primary brand #006c50: brand asli hanya
// berkontras ±2,8:1 di atas bar gelap (hitungan manual), tint ini ±9:1.
const COLORS = {
  bar: "#0f172a",
  accent: "#34d399",
  inactive: "#94a3b8",
  page: "#f8f9ff",
} as const;

const ICON_SIZE = 20;
const BAR_HEIGHT = 80;
const H_MARGIN = 12; // bar melayang: jarak ke tepi layar kiri dan kanan
const MIN_BOTTOM_MARGIN = 20; // jarak terkecil bar ke tepi bawah layar
// Bar boleh masuk sedikit ke area inset sistem supaya jaraknya tidak terlalu lebar
const INSET_OVERLAP = 8;
const TOP_RADIUS = 16; // sudut kiri dan kanan atas
const BOTTOM_RADIUS = 28; // sudut kiri dan kanan bawah
const FAB_SIZE = 60;
const FAB_INNER = 40;
// Pusat tombol tepat di garis atas bar, jadi separuhnya menonjol ke atas
const FAB_OVERHANG = FAB_SIZE / 2;
const NOTCH_GAP = 6; // celah antara tombol dan lengkungan bar
const NOTCH_R = FAB_SIZE / 2 + NOTCH_GAP;
const NOTCH_SHOULDER = 20; // panjang peralihan halus dari sisi datar ke lengkungan
const NOTCH_ANGLE = (40 * Math.PI) / 180; // titik sambung lengkungan di lingkaran takik
const CENTER_GAP = 80; // ruang kosong di antara dua grup tab

// Latar bar: pil dengan sudut membulat dan lengkungan halus (kurva S) di sekitar tombol
function buildBarPath(width: number, height: number): string {
  const cx = width / 2;
  const sin = Math.sin(NOTCH_ANGLE);
  const cos = Math.cos(NOTCH_ANGLE);
  const px = NOTCH_R * cos;
  const py = NOTCH_R * sin;
  const x1 = cx - NOTCH_R - NOTCH_SHOULDER;
  const x2 = cx + NOTCH_R + NOTCH_SHOULDER;
  const k = NOTCH_SHOULDER * 0.7;
  const t = 11;
  const n = (v: number) => v.toFixed(2);
  const rt = TOP_RADIUS;
  const rb = BOTTOM_RADIUS;
  return [
    `M0 ${rt}`,
    `A${rt} ${rt} 0 0 1 ${rt} 0`,
    `H${n(x1)}`,
    `C${n(x1 + k)} 0 ${n(cx - px - t * sin)} ${n(py - t * cos)} ${n(cx - px)} ${n(py)}`,
    `A${NOTCH_R} ${NOTCH_R} 0 0 0 ${n(cx + px)} ${n(py)}`,
    `C${n(cx + px + t * sin)} ${n(py - t * cos)} ${n(x2 - k)} 0 ${n(x2)} 0`,
    `H${n(width - rt)}`,
    `A${rt} ${rt} 0 0 1 ${width} ${rt}`,
    `V${n(height - rb)}`,
    `A${rb} ${rb} 0 0 1 ${n(width - rb)} ${height}`,
    `H${rb}`,
    `A${rb} ${rb} 0 0 1 0 ${n(height - rb)}`,
    "Z",
  ].join(" ");
}

export function BottomTabBar({ state, onAddPress }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bottomMargin = Math.max(
    insets.bottom - INSET_OVERLAP,
    MIN_BOTTOM_MARGIN,
  );
  const barWidth = width - H_MARGIN * 2;

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
    // Latar wrapper terlihat di sekeliling bar dan di celah lengkungan: samakan dengan latar layar
    <View
      className="bg-[#f8f9ff]"
      style={{ height: FAB_OVERHANG + BAR_HEIGHT + bottomMargin }}
    >
      <View
        className="absolute"
        style={{
          top: FAB_OVERHANG,
          left: H_MARGIN,
          width: barWidth,
          height: BAR_HEIGHT,
        }}
      >
        <Svg
          width={barWidth}
          height={BAR_HEIGHT}
          style={StyleSheet.absoluteFill}
        >
          <Path d={buildBarPath(barWidth, BAR_HEIGHT)} fill={COLORS.bar} />
        </Svg>

        <View className="flex-1 flex-row items-center px-3 pt-1">
          <View className="flex-1 flex-row">
            {tabs.slice(0, half).map(renderTab)}
          </View>
          <View style={{ width: CENTER_GAP }} />
          <View className="flex-1 flex-row">
            {tabs.slice(half).map(renderTab)}
          </View>
        </View>
      </View>

      <Pressable
        onPress={onAddPress}
        accessibilityRole="button"
        accessibilityLabel="Catat transaksi"
        android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: false }}
        className="absolute top-0 items-center justify-center rounded-full"
        style={{
          left: (width - FAB_SIZE) / 2,
          width: FAB_SIZE,
          height: FAB_SIZE,
          // Warna lewat style: class bg pada Pressable tidak diterapkan di proyek ini
          backgroundColor: COLORS.bar,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View
          className="items-center justify-center rounded-full bg-[#34d399]"
          style={{ width: FAB_INNER, height: FAB_INNER }}
        >
          <Ionicons name="add" size={24} color={COLORS.bar} />
        </View>
      </Pressable>
    </View>
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { Animated, View } from "react-native";

interface SkeletonPulseProps {
  accessibilityLabel: string;
  children: ReactNode;
  // Penampung mengisi tinggi induk (flex: 1). Wajib bila anaknya memakai posisi absolute.
  fill?: boolean;
}

// Satu animasi denyut untuk seluruh kerangka di dalamnya. Pola dan ritme sama dengan
// DashboardSkeleton (Animated bawaan RN, opacity 0.55 ↔ 1, 800 ms). Animated.View hanya
// menerima `style` berupa objek (className tidak dijamin), jadi balok di dalamnya
// memakai SkeletonBlock biasa dan denyutnya diatur di penampung ini.
// Jangan menumpuk SkeletonPulse di dalam SkeletonPulse: opacity akan saling mengalikan.
export function SkeletonPulse({
  accessibilityLabel,
  children,
  fill = false,
}: SkeletonPulseProps) {
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      importantForAccessibility="no-hide-descendants"
      style={fill ? { flex: 1, opacity } : { opacity }}
    >
      {children}
    </Animated.View>
  );
}

// Balok abu-abu (warna sama dengan DashboardSkeleton). Kelas ukuran dan radius ditulis
// utuh oleh pemanggil agar terbaca Tailwind; kelasnya harus statis (lihat catatan radius
// di SegmentedControl).
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <View className={`bg-[#e2e8f0] ${className}`} />;
}

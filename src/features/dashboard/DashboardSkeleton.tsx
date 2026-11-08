import { useEffect, useState } from "react";
import { Animated, View } from "react-native";

// Placeholder saat data pertama dimuat. Pakai Animated bawaan RN (tanpa dependensi);
// style lewat objek karena Animated.View tidak dijamin menerima className.
export function DashboardSkeleton() {
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

  const block = (height: number, radius: number) => (
    <Animated.View
      style={{
        height,
        borderRadius: radius,
        backgroundColor: "#e2e8f0",
        opacity,
      }}
    />
  );

  return (
    <View style={{ gap: 20 }} accessibilityLabel="Memuat ringkasan keuangan">
      {block(194, 24)}
      {block(216, 16)}
      <View style={{ gap: 10 }}>
        {block(20, 6)}
        {block(72, 12)}
        {block(72, 12)}
        {block(72, 12)}
      </View>
    </View>
  );
}

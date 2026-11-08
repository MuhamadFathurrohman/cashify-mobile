import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { Tabs, useRouter } from "expo-router";

// Urutan <Tabs.Screen> menentukan urutan tab; label dan ikon ada di BottomTabBar
export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <BottomTabBar
          {...props}
          onAddPress={() => router.push({ pathname: "/transaction/add" })}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="analysis" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

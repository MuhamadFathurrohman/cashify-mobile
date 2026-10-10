import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, View } from "react-native";

function FABAddButton() {
  const router = useRouter();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 h-20 items-center justify-start pt-3"
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => router.push({ pathname: "/transaction/add" })}
        className="w-14 h-14 rounded-full bg-teal-500 items-center justify-center"
        style={{ elevation: 4 }}
        android_ripple={{ color: "rgba(255,255,255,0.2)", radius: 28 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          // TODO: sesuaikan dengan design token Figma
          tabBarActiveTintColor: "#14B8A6",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
            borderTopColor: "#F3F4F6",
            paddingBottom: 8,
            paddingTop: 8,
            height: 64,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Beranda",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Riwayat",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: "Anggaran",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/*
        FAB dirender di luar <Tabs> sebagai overlay absolut.
        pointerEvents="box-none" memastikan area di luar tombol FAB
        tetap bisa menerima sentuhan dari tab bar di bawahnya.
        TODO: posisi, ukuran, warna disesuaikan dari Figma.
      */}
      <FABAddButton />
    </View>
  );
}

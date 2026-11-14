import { Stack } from "expo-router";

export default function TransactionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "",
        headerTintColor: "#111827",
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="[id]" options={{ title: "Detail Transaksi" }} />
      {/* Header kustom (TransactionHeader) sesuai Figma 69:2506, jadi header bawaan dimatikan */}
      <Stack.Screen
        name="add"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="edit/[id]" options={{ title: "Ubah Transaksi" }} />
    </Stack>
  );
}

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
      {/* Header kustom (TransactionHeader) dipakai ketiga layar transaksi, jadi header
          bawaan Stack dimatikan agar tidak ada judul ganda */}
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

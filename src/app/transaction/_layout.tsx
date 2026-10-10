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
      <Stack.Screen name="add" options={{ title: "Tambah Transaksi" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Ubah Transaksi" }} />
    </Stack>
  );
}

import { Stack } from "expo-router";

// Grup rute anggaran. Header bawaan Stack dimatikan karena layar memakai
// TransactionHeader (judul + subjudul + tombol tutup sendiri).
export default function BudgetLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="add"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

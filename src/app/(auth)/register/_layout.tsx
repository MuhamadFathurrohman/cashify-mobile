import { Stack } from "expo-router";

import { RegisterProvider } from "@/features/auth/RegisterContext";

// Provider di sini: state alur register hilang otomatis saat grup rute ditinggalkan
export default function RegisterLayout() {
  return (
    <RegisterProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Akun sudah dibuat; swipe-back ke langkah sebelumnya dimatikan */}
        <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      </Stack>
    </RegisterProvider>
  );
}

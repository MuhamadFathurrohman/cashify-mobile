import { SplashScreen as CashifySplashScreen } from "@/components/ui/SplashScreen";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "../../global.css";

// Tahan native splash screen agar tidak hilang otomatis
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 menit
      gcTime: 1000 * 60 * 10, // 10 menit
    },
    mutations: {
      retry: 0,
    },
  },
});

function RootLayoutNav() {
  const { isReady } = useSessionGuard();

  useEffect(() => {
    if (isReady) {
      // Sembunyikan native splash screen setelah komponen kita siap ditampilkan
      SplashScreen.hide();
    }
  }, [isReady]);

  // Selama guard mengecek session, tampilkan komponen SplashScreen kita.
  // Transisi dari native splash ke komponen ini tidak terlihat karena
  // backgroundColor keduanya identik (#f8f9ff).
  if (!isReady) {
    return <CashifySplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transaction" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

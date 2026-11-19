import { SplashScreen as CashifySplashScreen } from "@/components/ui/SplashScreen";
import { startLinkCapture } from "@/features/auth/recoveryLinkStore";
import { useAuthStore } from "@/features/auth/authStore";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { APP_FONTS } from "@/lib/fonts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import "../../global.css";

// Tahan native splash screen agar tidak hilang otomatis
SplashScreen.preventAutoHideAsync();
startLinkCapture();

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
  const { isReady, redirectTo } = useSessionGuard();
  const status = useAuthStore((state) => state.status);
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);

  // Gagal memuat font tidak boleh memblokir aplikasi: lanjut dengan font sistem
  const appReady = isReady && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hide();
    }
  }, [appReady]);

  if (!appReady) {
    return <CashifySplashScreen />;
  }

  // Rute yang tidak lolos guard TIDAK terdaftar di navigator, sehingga layar pertama
  // yang tampil selalu layar yang sah untuk status saat ini. Ini menggantikan
  // router.replace berbasis effect yang sempat menampilkan login sekejap sebelum
  // Beranda (kilatan halaman login).
  //
  // redirectTo WAJIB diisi rute konkret: tanpa itu expo-router memakai path grup
  // sebagai fallback, dan grup (auth)/(onboarding) tidak punya index sehingga
  // hasilnya layar "Unmatched Route" saat logout atau cold start tanpa sesi.
  // Nilainya dihitung dari status terkini di useSessionGuard.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === "ready"} redirectTo={redirectTo}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="transaction" />
      </Stack.Protected>

      <Stack.Protected guard={status === "signedOut"} redirectTo={redirectTo}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected
        guard={status === "needsOnboarding"}
        redirectTo={redirectTo}
      >
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={status === "unavailable"} redirectTo={redirectTo}>
        <Stack.Screen name="unavailable" />
      </Stack.Protected>

      {/* Tautan pemulihan password dari email bisa dibuka pada status apa pun yang
          sudah resolve, termasuk saat sudah login. Tidak boleh diproteksi. */}
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
        <Toaster position="top-center" offset={45} visibleToasts={1} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

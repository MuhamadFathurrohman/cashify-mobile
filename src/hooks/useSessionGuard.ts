import { clearTokens, getTokens, saveTokens } from "@/lib/storage/keychain";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

/**
 * Cek apakah segment aktif sudah berada di grup yang benar.
 * Mencegah redirect loop saat user sudah di halaman yang tepat.
 */

function getActiveGroup(segments: string[]): "(auth)" | "(onboarding)" | "(tabs)" | null {
    if (segments[0] === "(auth)") return "(auth)";
    if (segments[0] === "(onboarding)") return "(onboarding)";
    if (segments[0] === "(tabs)") return "(tabs)";
    return null
}

export function useSessionGuard() {
    const [isReady, setIsReady] = useState(false);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        let isMounted = true;

        async function checkSession() {
            try {
                // mengambil token dari keychain
                const stored = await getTokens();

                if (!stored) {
                    // tidak ada token yang tersimpan, di arahkan ke login
                    if (isMounted) {
                        if (getActiveGroup(segments) !== "(auth)") {
                            router.replace("/(auth)/login")
                        }
                        setIsReady(true);
                    }
                    return;
                }

                // set session ke supabase dari token yang tersimpan di keychain
                const { data: sessionData, error: sessionError } =
                    await supabase.auth.setSession({
                        access_token: stored.accessToken,
                        refresh_token: stored.refreshToken,
                    });

                if (sessionError || !sessionData.session) {
                    // token tidak valid atau expired dan tidak bisa di referesh
                    await clearTokens();
                    if (isMounted) {
                        if (getActiveGroup(segments) !== "(auth)") {
                            router.replace("/(auth)/login")
                        }
                        setIsReady(true);
                    }
                    return;
                }

                // simpan token baru jika supabase melakukan referesh otomatis
                const { access_token, refresh_token } = sessionData.session;
                if (
                    access_token !== stored.accessToken ||
                    refresh_token !== stored.refreshToken
                ) {
                    await saveTokens({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                    });
                }

                // cek status onboarding dari endpoint GET /me
                const response = await fetch(
                    `${process.env.EXPO_PUBLIC_API_URL}/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            "Content-type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    // gagal ambil profil (kembali ke login sebagai fallback aman)
                    await clearTokens();
                    if (isMounted) {
                        if (getActiveGroup(segments) !== "(auth)") {
                            router.replace("/(auth)/login");
                        }
                        setIsReady(true);
                    }
                    return;
                }

                const { onboarding_completed_at } = await response.json();

                if (!isMounted) return;

                // diarahkan berdasarkan status onboarding
                if (!onboarding_completed_at) {
                    if (getActiveGroup(segments) !== "(onboarding)") {
                        router.replace("/(onboarding)/welcome");
                    }
                } else {
                    if (getActiveGroup(segments) !== "(tabs)") {
                        router.replace("/(tabs)");
                    }
                }

                setIsReady(true);
            } catch {
                // error tak terduga diarahkan ke login sebagai fallback aman
                await clearTokens();
                if (isMounted) {
                    if (getActiveGroup(segments) !== "(auth)") {
                        router.replace("/(auth)/login");
                    }
                    setIsReady(true);
                }
            }
        }

        checkSession();

        // subscribe ke peruban auth state dari supabase
        // Menangkap logout dari sisi lain (mis. sesi expired di background)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event) => {
                if (!isMounted) return;

                if (event === "SIGNED_OUT") {
                    await clearTokens();
                    router.replace("/(auth)/login");
                }
            }
        );

        return () => {
            isMounted = false;
            authListener.subscription.unsubscribe();
        };

        // segments sengaja tidak dimasukkan ke dependency array —
        // guard hanya perlu jalan sekali saat mount, bukan setiap navigasi
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { isReady };
}
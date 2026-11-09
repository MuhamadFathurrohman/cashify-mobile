import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import type { FontFamilyDefinition } from "expo-font";

// Harus sama dengan fontFamily.sans di tailwind.config.js: class font-sans memakai nama ini
const FONT_FAMILY = "Inter";

// Satu keluarga dengan tiga bobot (SDK 58+). Class NativeWind font-normal, font-semibold,
// dan font-bold memilih bobotnya lewat fontWeight (400, 600, 700), jadi class yang
// sudah ada tidak perlu diganti. Bobot baru = tambah satu baris di sini.
// Catatan: lewat useFonts, Android di bawah 10 (API 29) hanya memuat satu face.
export const APP_FONTS: FontFamilyDefinition[] = [
    {
        fontFamily: FONT_FAMILY,
        fontDefinitions: [
            { path: Inter_400Regular, weight: 400 },
            { path: Inter_600SemiBold, weight: 600 },
            { path: Inter_700Bold, weight: 700 },
        ],
    },
];
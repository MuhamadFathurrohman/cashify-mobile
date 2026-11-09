/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Harus sama dengan FONT_FAMILY di src/lib/fonts.ts. NativeWind tidak memuat
        // font; pemuatan dilakukan useFonts di root _layout. Bobot (font-normal,
        // font-semibold, font-bold) dipilih lewat fontWeight terhadap keluarga ini.
        sans: ["Inter"],
      },
    },
  },
  plugins: [],
};

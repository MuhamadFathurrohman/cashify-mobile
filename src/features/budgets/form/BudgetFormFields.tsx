import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentRef, Ref } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ViewInstance,
} from "react-native";
import {
  getBudgetErrorMessages,
  presetLabel,
  THRESHOLD_PRESETS,
  type BudgetFormErrors,
} from "./budgetFormRules";

const CARD = "rounded-3xl border bg-white p-[17px]";
const CARD_BORDER_NORMAL = "border-[rgba(196,198,206,0.3)]";
const CARD_BORDER_ERROR = "border-[#ba1a1a]";
const LABEL =
  "font-sans text-xs font-semibold leading-4 tracking-[0.24px] text-[#43474d]";
const HINT = "font-sans mt-2 text-xs leading-4 text-[#74777e]";

export function BudgetFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View
      className="mt-2 flex-row items-start gap-1"
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name="alert-circle-outline"
        size={13}
        color="#ba1a1a"
        style={{ marginTop: 1 }}
      />
      <Text className="font-sans flex-1 text-xs leading-4 text-[#ba1a1a]">
        {message}
      </Text>
    </View>
  );
}

// Ringkasan di atas tombol simpan. Isi dihitung dari error yang masih aktif,
// jadi otomatis menyusut/hilang saat pengguna memperbaiki isian.
export function BudgetValidationSummary({
  errors,
  onPress,
}: {
  errors: BudgetFormErrors;
  onPress: () => void;
}) {
  const messages = getBudgetErrorMessages(errors);
  if (messages.length === 0) return null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Periksa kembali isian anggaran"
      android_ripple={{ color: "rgba(186,26,26,0.08)", borderless: false }}
      className="mb-2 flex-row items-start gap-2 rounded-xl px-3 py-2"
      style={{
        backgroundColor: "#fff1f0",
        borderWidth: 1,
        borderColor: "#ffd6d0",
      }}
    >
      <Ionicons
        name="alert-circle-outline"
        size={15}
        color="#ba1a1a"
        style={{ marginTop: 1 }}
      />
      <View className="flex-1">
        <Text className="font-sans text-xs font-semibold leading-4 text-[#ba1a1a]">
          Periksa kembali isian anggaran
        </Text>
        <Text className="font-sans text-[11px] leading-4 text-[#ba1a1a]">
          {messages
            .map((item) => `${item.label}: ${item.message}`)
            .join(" • ")}
        </Text>
      </View>
    </Pressable>
  );
}

interface AmountInputProps {
  label: string;
  // Teks terformat (mis. "1.500.000"); pemanggil yang memformat & membatasi nilai.
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper: string;
  accessibilityLabel: string;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
}

export function AmountInput({
  label,
  value,
  onChangeText,
  error,
  helper,
  accessibilityLabel,
  inputRef,
}: AmountInputProps) {
  return (
    <View
      className={`${CARD} ${
        error ? CARD_BORDER_ERROR : CARD_BORDER_NORMAL
      }`}
    >
      <Text className={`text-center ${LABEL}`}>{label}</Text>
      <View className="relative mt-3 h-10 w-full items-center justify-center">
        <Text className="absolute left-0 font-sans text-[22px] font-bold leading-7 text-[#006c50]">
          Rp
        </Text>
        <TextInput
          ref={inputRef}
          className="h-10 w-full p-0 text-center font-sans text-[28px] font-bold leading-9 text-[#121c2a]"
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#c4c6ce"
          // "2.147.483.647" = 13 karakter (batas backend)
          maxLength={13}
          accessibilityLabel={accessibilityLabel}
          aria-invalid={Boolean(error)}
        />
        {value ? (
          <Pressable
            onPress={() => onChangeText("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Kosongkan nominal"
            className="absolute right-0 h-8 w-8 items-center justify-center"
          >
            <Ionicons name="backspace-outline" size={18} color="#74777e" />
          </Pressable>
        ) : null}
      </View>
      <BudgetFieldError message={error} />
      {!error ? <Text className={`text-center ${HINT}`}>{helper}</Text> : null}
    </View>
  );
}

// Semua chip menambah nilai yang sedang diisi (pola layar Saldo Awal).
// Daftar nominal diberikan pemanggil karena total anggaran dan batas kategori
// memakai skala yang berbeda.
export function PresetChips({
  presets,
  onAdd,
}: {
  presets: readonly number[];
  onAdd: (amount: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {presets.map((amount) => (
        <Pressable
          key={amount}
          onPress={() => onAdd(amount)}
          accessibilityRole="button"
          accessibilityLabel={`Tambah ${presetLabel(amount)}`}
          android_ripple={{ color: "rgba(0,0,0,0.05)", borderless: false }}
          className="rounded-full border border-[#dee9fc] bg-white px-[13px] py-[5px]"
        >
          <Text className="font-sans text-[11px] font-medium leading-[17px] text-[#43474d]">
            {presetLabel(amount)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

interface ThresholdPickerProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  cardRef?: Ref<ViewInstance>;
}

// Hanya tiga pilihan cepat: input persen manual dihapus karena pilihannya sudah
// jelas dan input tanpa label membingungkan. Bawaan 80%.
export function ThresholdPicker({
  value,
  onChange,
  error,
  cardRef,
}: ThresholdPickerProps) {
  return (
    <View
      ref={cardRef}
      className={`${CARD} ${
        error ? CARD_BORDER_ERROR : CARD_BORDER_NORMAL
      }`}
    >
      <Text className={LABEL}>Batas Peringatan</Text>

      <View className="mt-3 flex-row gap-2">
        {THRESHOLD_PRESETS.map((preset) => {
          const selected = value === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => onChange(preset)}
              accessibilityRole="button"
              accessibilityLabel={`Batas peringatan ${preset} persen`}
              accessibilityState={{ selected }}
              // Key berubah saat status terpilih berubah: elemen bersudut dipasang
              // ulang agar radius tidak hilang (pola yang sama dengan CategoryGrid).
            >
              <View
                key={selected ? "on" : "off"}
                className={`rounded-full border px-4 py-[6px] ${
                  selected
                    ? "border-[#006c50] bg-[rgba(0,108,80,0.1)]"
                    : "border-[rgba(196,198,206,0.6)] bg-white"
                }`}
              >
                <Text
                  className={`font-sans text-xs font-semibold leading-4 ${
                    selected ? "text-[#006c50]" : "text-[#43474d]"
                  }`}
                >
                  {`${preset}%`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <BudgetFieldError message={error} />
      {!error ? (
        <Text className={HINT}>
          Bawaan 80%. Peringatan dikirim via WhatsApp saat pemakaian kategori
          mencapai persentase ini, bila nomor WhatsApp sudah tertaut.
        </Text>
      ) : null}
    </View>
  );
}

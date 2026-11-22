import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";

// Urutan dan label dipakai bersama oleh banner ringkasan dan penentuan field
// pertama yang perlu mendapat fokus/guliran saat pengguna menekan Simpan.
export const FORM_FIELD_ORDER = [
  "amount",
  "categoryId",
  "date",
  "accountId",
  "description",
] as const;

export type TransactionFormField = (typeof FORM_FIELD_ORDER)[number];

const FIELD_LABELS: Record<TransactionFormField, string> = {
  amount: "Nominal",
  categoryId: "Kategori",
  date: "Tanggal",
  accountId: "Dompet",
  description: "Catatan",
};

// Kompatibel dengan FieldErrors<TransactionFormValues> dari react-hook-form.
export type FormFieldErrors = Partial<
  Record<TransactionFormField, { message?: string } | undefined>
>;

export interface FormErrorMessage {
  name: TransactionFormField;
  label: string;
  message: string;
}

export function getErrorMessages(errors: FormFieldErrors): FormErrorMessage[] {
  return FORM_FIELD_ORDER.flatMap((name) => {
    const message = errors[name]?.message;
    return message
      ? [{ name, label: FIELD_LABELS[name], message }]
      : [];
  });
}

export function firstErrorName(
  errors: FormFieldErrors,
): TransactionFormField | null {
  return getErrorMessages(errors)[0]?.name ?? null;
}

// Pesan per kolom. `className` bisa dioverride oleh pemanggil (mis. nominal
// ingin rata tengah).
export function FieldError({
  message,
  className = "mt-1",
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <View
      className={`${className} flex-row items-center gap-1`}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="alert-circle-outline" size={13} color="#ba1a1a" />
      <Text className="font-sans text-xs leading-4 text-[#ba1a1a]">
        {message}
      </Text>
    </View>
  );
}

// Ringkasan di atas tombol Simpan. Isi dihitung dari error yang masih aktif,
// sehingga otomatis menyusut/hilang saat pengguna memperbaiki isian.
export function ValidationSummary({
  errors,
  onPress,
}: {
  errors: FormFieldErrors;
  onPress: () => void;
}) {
  const messages = getErrorMessages(errors);
  if (messages.length === 0) return null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Periksa kembali isian transaksi"
      android_ripple={{ color: "rgba(186,26,26,0.08)", borderless: false }}
      className="mb-2 flex-row items-start gap-2 rounded-xl px-3 py-2"
      style={{
        backgroundColor: "#fff1f0",
        borderWidth: 1,
        borderColor: "#ffd6d0",
      }}
    >
      <Ionicons name="alert-circle-outline" size={15} color="#ba1a1a" />
      <View className="flex-1">
        <Text className="font-sans text-xs font-semibold leading-4 text-[#ba1a1a]">
          Periksa kembali isian transaksi
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

// Dipakai form untuk memberi tanda accessibilityState pada input.
export function hasFieldError(
  errors: FormFieldErrors,
  name: TransactionFormField,
): boolean {
  return Boolean(errors[name]?.message);
}

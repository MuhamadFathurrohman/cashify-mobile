import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // Tindakan merusak (hapus) memakai warna merah; selain itu memakai hijau utama.
  destructive?: boolean;
  // Selama aksi berjalan, dialog tidak bisa ditutup dan tombol menampilkan spinner.
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Dialog konfirmasi bersama. Proyek ini belum memakai Alert bawaan supaya tampilan
// tetap konsisten dengan sheet filter (Modal + token warna aplikasi).
// Warna tombol lewat style: kelas warna pada Pressable tidak diterapkan di proyek ini.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const accent = destructive ? "#ba1a1a" : "#006c50";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!pending) onCancel();
      }}
    >
      <View className="flex-1 justify-center bg-[rgba(18,28,42,0.45)] px-6">
        {/* Latar gelap hanya menutup dialog; sentuhan di luar kartu = batal */}
        <Pressable
          className="absolute inset-0"
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          disabled={pending}
          onPress={onCancel}
        />

        <View className="rounded-3xl bg-white p-5">
          <Text className="font-sans text-base font-semibold leading-[22px] tracking-[-0.16px] text-[#121c2a]">
            {title}
          </Text>
          <Text className="mt-2 font-sans text-sm leading-5 text-[#43474d]">
            {message}
          </Text>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              disabled={pending}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              accessibilityState={{ disabled: pending }}
              className={`h-12 flex-1 items-center justify-center rounded-2xl border border-[rgba(196,198,206,0.6)] ${
                pending ? "opacity-60" : "active:opacity-80"
              }`}
            >
              <Text className="font-sans text-sm font-semibold text-[#121c2a]">
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={pending}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: pending }}
              className={`h-12 flex-1 items-center justify-center rounded-2xl ${
                pending ? "opacity-80" : "active:opacity-90"
              }`}
              // Latar tetap solid saat memuat (aturan 14, sama seperti ErrorState)
              style={{ backgroundColor: pending ? "#9c6b6b" : accent }}
            >
              {pending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-sans text-sm font-semibold text-white">
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

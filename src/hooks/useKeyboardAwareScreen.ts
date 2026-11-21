import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  findNodeHandle,
  Keyboard,
  type HostInstance,
  type LayoutChangeEvent,
  type ScrollViewInstance,
} from "react-native";

interface UseKeyboardAwareScreenOptions {
  // Elemen yang digulir ke area terlihat sebagai jaring pengaman ketika keyboard
  // muncul (mis. tombol aksi di bawah form). Opsional.
  scrollTo?: RefObject<HostInstance | null>;
  // Jarak aman antara elemen target dan tepi atas keyboard (dp).
  offset?: number;
  // Layout sudah final saat animasi keyboard berjalan (animasi hanya transform),
  // jadi jeda singkat cukup sebelum elemen diukur.
  delay?: number;
}

interface KeyboardAwareScreen {
  scrollRef: RefObject<ScrollViewInstance | null>;
  keyboardVisible: boolean;
  // Tinggi viewport saat keyboard tertutup. Dipakai sebagai minHeight konten agar
  // justify-between benar-benar punya ruang sisa untuk mendorong footer ke dasar.
  // Nilainya tidak menyusut saat KeyboardAvoidingView memadatkan ScrollView;
  // kalau ikut menyusut, footer akan terkunci tepat di atas keyboard.
  viewportHeight: number;
  onLayout: (event: LayoutChangeEvent) => void;
}

// Logika bersama layar berisi input: status keyboard, tinggi viewport, dan
// auto-scroll ke elemen target. Pasangan UI-nya adalah components/ui/KeyboardScreen.
export function useKeyboardAwareScreen({
  scrollTo,
  offset = 12,
  delay = 100,
}: UseKeyboardAwareScreenOptions = {}): KeyboardAwareScreen {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Jaring pengaman untuk layar kecil atau ukuran font besar: tombol aksi bisa
  // masih tertutup keyboard meski branding sudah diringkas.
  useEffect(() => {
    if (!keyboardVisible || !scrollTo) return;
    const timeout = setTimeout(() => {
      const handle = scrollTo.current
        ? findNodeHandle(scrollTo.current)
        : null;
      if (handle == null) return;
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        handle,
        offset,
        true,
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [keyboardVisible, scrollTo, offset, delay]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight((prev) => Math.max(prev, event.nativeEvent.layout.height));
  }, []);

  return { scrollRef, keyboardVisible, viewportHeight, onLayout };
}

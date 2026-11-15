import type { ReactNode, Ref } from "react";
import {
    KeyboardAvoidingView,
    ScrollView,
    type ScrollViewInstance,
    type ScrollViewProps,
} from "react-native";

interface KeyboardScreenProps {
  children: ReactNode;
  // Bar aksi tetap di bawah area gulir (mis. tombol Simpan). Harus anak normal-flow,
  // bukan absolute, agar ikut terangkat oleh padding KeyboardAvoidingView.
  footer?: ReactNode;
  scrollRef?: Ref<ScrollViewInstance>;
  className?: string;
  contentContainerClassName?: string;
  onLayout?: ScrollViewProps["onLayout"];
  onContentSizeChange?: ScrollViewProps["onContentSizeChange"];
}

// Pembungkus layar berisi input. Android edge-to-edge tidak lagi meresize window
// saat keyboard muncul, jadi "padding" dipakai di kedua platform (bukan undefined/"height").
// Padding memadatkan ScrollView sehingga footer berada tepat di atas keyboard.
export function KeyboardScreen({
  children,
  footer,
  scrollRef,
  className,
  contentContainerClassName,
  onLayout,
  onContentSizeChange,
}: KeyboardScreenProps) {
  return (
    <KeyboardAvoidingView
      className={`flex-1 ${className ?? ""}`}
      behavior="padding"
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={contentContainerClassName}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
      >
        {children}
      </ScrollView>
      {footer}
    </KeyboardAvoidingView>
  );
}

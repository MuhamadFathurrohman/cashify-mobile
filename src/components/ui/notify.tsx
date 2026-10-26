import {
    CustomToast,
    type CustomToastVariant,
} from "@/components/ui/CustomToast";
import { toast } from "sonner-native";

let seq = 0;

// id dibuat lebih dulu agar tombol tutup di CustomToast bisa toast.dismiss(id)
function show(
  variant: CustomToastVariant,
  title: string,
  description?: string,
  duration?: number,
) {
  const id = `notify-${seq++}`;
  return toast.custom(
    <CustomToast
      id={id}
      variant={variant}
      title={title}
      description={description}
    />,
    duration !== undefined ? { id, duration } : { id },
  );
}

export const notify = {
  success: (title: string, description?: string, duration?: number) =>
    show("success", title, description, duration),
  error: (title: string, description?: string, duration?: number) =>
    show("error", title, description, duration),
  warning: (title: string, description?: string, duration?: number) =>
    show("warning", title, description, duration),
  info: (title: string, description?: string, duration?: number) =>
    show("info", title, description, duration),
};

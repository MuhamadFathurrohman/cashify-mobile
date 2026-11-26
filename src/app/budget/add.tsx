import { ErrorState } from "@/components/ui/ErrorState";
import { budgetLoadErrorMessage } from "@/features/budgets/budgetErrors";
import { useBudgetDetail } from "@/features/budgets/budgetQueries";
import {
  BudgetForm,
  type BudgetFormStep,
} from "@/features/budgets/form/BudgetForm";
import { TransactionHeader } from "@/features/transactions/TransactionHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, View } from "react-native";

const LOAD_FALLBACK =
  "Data anggaran belum bisa dimuat. Coba lagi sebentar lagi.";

// Satu rute untuk empat konteks:
// - tanpa `budgetId`             = buat anggaran bulan ini (2 langkah)
// - `budgetId`                   = tambah anggaran per kategori
// - `budgetId` + `editTotal=1`   = ubah total anggaran
// - `budgetId` + `categoryId`    = ubah satu alokasi kategori
export default function AddBudgetScreen() {
  const router = useRouter();
  const { budgetId, editTotal, categoryId } = useLocalSearchParams<{
    budgetId?: string;
    editTotal?: string;
    categoryId?: string;
  }>();
  const mode = budgetId ? (categoryId ? "edit" : "add") : "create";
  // Dibuka langsung dari ikon pensil di kartu total: tampilan akar = ubah total.
  const totalEditorRoot = mode === "add" && editTotal === "1";
  const detail = useBudgetDetail(budgetId ?? null);

  const [step, setStep] = useState<BudgetFormStep>(
    mode === "create" ? "total" : "category",
  );
  const [editingTotal, setEditingTotal] = useState(totalEditorRoot);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/analysis");
  }, [router]);

  // Saat ubah total dibuka langsung dari kartu hero, menyimpan total berarti
  // selesai: kembali ke tab, bukan lanjut ke form tambah anggaran per kategori.
  const handleEditingTotalChange = useCallback(
    (editing: boolean) => {
      if (!editing && totalEditorRoot) {
        close();
        return;
      }
      setEditingTotal(editing);
    },
    [close, totalEditorRoot],
  );

  // Header dan tombol back Android sama-sama naik satu tampilan di dalam form;
  // hanya tampilan akar yang menutup rute.
  const goBack = useCallback(() => {
    if (editingTotal) {
      if (totalEditorRoot) close();
      else setEditingTotal(false);
      return;
    }
    if (mode === "edit") {
      close();
      return;
    }
    if (mode === "create" && step === "category") {
      setStep("total");
      return;
    }
    close();
  }, [close, editingTotal, mode, step, totalEditorRoot]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        goBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [goBack]);

  const header = editingTotal
    ? {
        title: "Ubah Total Anggaran",
        subtitle: "Sesuaikan plafon bulan ini",
        leadingIcon: "back" as const,
        onClose: goBack,
      }
      : mode === "edit"
        ? {
            title: "Ubah Anggaran Kategori",
            subtitle: "Sesuaikan batas dan peringatan",
            leadingIcon: "back" as const,
            onClose: goBack,
          }
        : mode === "create"
          ? step === "category"
            ? {
                title: "Buat Anggaran",
                subtitle: "Pilih kategori dan batasnya",
                leadingIcon: "back" as const,
                onClose: goBack,
              }
            : {
                title: "Buat Anggaran",
                subtitle: "Rencanakan batas belanja",
                leadingIcon: "close" as const,
                onClose: close,
              }
          : {
              title: "Tambah Anggaran per Kategori",
              subtitle: "Alokasikan ke anggaran bulan ini",
              leadingIcon: "back" as const,
              onClose: goBack,
            };

  const categoryMissing =
    mode === "edit" &&
    !!detail.data &&
    !detail.data.categories.some(
      (category) => category.category_id === categoryId,
    );

  let body;
  if (mode !== "create" && detail.isPending) {
    body = (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#006c50" accessibilityLabel="Memuat anggaran" />
      </View>
    );
  } else if (mode !== "create" && (detail.isError || !detail.data)) {
    body = (
      <View className="flex-1 px-5 pt-4">
        <ErrorState
          title="Gagal memuat anggaran"
          message={budgetLoadErrorMessage(detail.error, LOAD_FALLBACK)}
          onRetry={() => void detail.refetch()}
          retrying={detail.isRefetching}
        />
      </View>
    );
  } else if (categoryMissing) {
    body = (
      <View className="flex-1 px-5 pt-4">
        <ErrorState
          title="Kategori tidak ditemukan"
          message="Kategori ini mungkin sudah dihapus atau diubah di perangkat lain. Muat ulang daftar lalu coba lagi."
          onRetry={() => void detail.refetch()}
          retrying={detail.isRefetching}
        />
      </View>
    );
  } else {
    body = (
      <BudgetForm
        mode={mode}
        budget={mode === "create" ? null : (detail.data ?? null)}
        editCategoryId={categoryId ?? null}
        step={step}
        onStepChange={setStep}
        editingTotal={editingTotal}
        onEditingTotalChange={handleEditingTotalChange}
        onDone={close}
      />
    );
  }

  return (
    <View className="flex-1 bg-[#f8f9ff]">
      <TransactionHeader
        title={header.title}
        subtitle={header.subtitle}
        onClose={header.onClose}
        leadingIcon={header.leadingIcon}
      />
      {body}
    </View>
  );
}

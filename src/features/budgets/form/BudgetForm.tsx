import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { KeyboardScreen } from "@/components/ui/KeyboardScreen";
import { useCategories } from "@/features/transactions/useCategories";
import { useKeyboardAwareScreen } from "@/hooks/useKeyboardAwareScreen";
import type { BudgetDetail } from "@/types/api";
import { formatInputAmount, parseRawAmount } from "@/utils/currency";
import { formatPlainRupiah } from "@/utils/money";
import { useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type ViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { resolveBudgetError, type BudgetFormField } from "../budgetErrors";
import { currentPeriodStart } from "../budgetPeriods";
import {
  useAddBudgetCategory,
  useCreateBudget,
  useRemoveBudgetCategory,
  useUpdateBudgetCategory,
  useUpdateBudgetTotal,
} from "../useBudgetMutations";
import { BudgetCategoryAddPanel } from "./BudgetCategoryAddPanel";
import { BudgetEditCategoryPanel } from "./BudgetEditCategoryPanel";
import { BudgetValidationSummary } from "./BudgetFormFields";
import type { SummaryRow } from "./BudgetFormSummary";
import { BudgetTotalPanel } from "./BudgetTotalPanel";
import {
  DEFAULT_THRESHOLD,
  MAX_AMOUNT,
  createBudgetBody,
  firstBudgetErrorField,
  hasBudgetFormError,
  totalAllocated,
  validateCategoryStep,
  validateTotalStep,
  type BudgetErrorField,
  type BudgetFormErrors,
} from "./budgetFormRules";

export type BudgetFormStep = "total" | "category";

export interface BudgetFormProps {
  // "create" = belum ada anggaran bulan ini (2 langkah: total → kategori);
  // "add" = menambah anggaran per kategori pada anggaran yang sudah ada;
  // "edit" = mengubah nominal/batas peringatan satu alokasi yang sudah ada.
  mode: "create" | "add" | "edit";
  budget: BudgetDetail | null;
  // Hanya dipakai mode "edit": kategori yang sedang diubah.
  editCategoryId?: string | null;
  // State tampilan dipegang route supaya header bisa mengubah judul dan aksi
  // kembali sesuai tampilan yang sedang terbuka.
  step: BudgetFormStep;
  onStepChange: (step: BudgetFormStep) => void;
  editingTotal: boolean;
  onEditingTotalChange: (editing: boolean) => void;
  onDone: () => void;
}

function withoutError(
  errors: BudgetFormErrors,
  field: BudgetFormField,
): BudgetFormErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}

// Satu form, empat tampilan: langkah total (buat), langkah kategori (buat/tambah),
// edit satu kategori, dan tampilan ubah total. Field nominal total dan batas
// kategori tidak pernah tampil bersamaan agar tidak terkesan menumpuk.
export function BudgetForm({
  mode,
  budget,
  editCategoryId,
  step,
  onStepChange,
  editingTotal,
  onEditingTotalChange,
  onDone,
}: BudgetFormProps) {
  const insets = useSafeAreaInsets();
  const { scrollRef, keyboardVisible } = useKeyboardAwareScreen();
  const createBudget = useCreateBudget();
  const addCategory = useAddBudgetCategory();
  const updateTotal = useUpdateBudgetTotal();
  const updateCategory = useUpdateBudgetCategory();
  const removeCategory = useRemoveBudgetCategory();
  // Cache kategori dipakai bersama picker (kunci query sama, tanpa request tambahan)
  const categories = useCategories("expense");

  const editCategory =
    mode === "edit" && budget && editCategoryId
      ? (budget.categories.find(
          (category) => category.category_id === editCategoryId,
        ) ?? null)
      : null;

  const [totalText, setTotalText] = useState(
    budget ? formatInputAmount(String(budget.total_amount)) : "",
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    editCategory?.category_id ?? null,
  );
  const [amountText, setAmountText] = useState(
    editCategory ? formatInputAmount(String(editCategory.amount)) : "",
  );
  const [threshold, setThreshold] = useState<number>(
    editCategory?.alert_threshold ?? DEFAULT_THRESHOLD,
  );
  const [errors, setErrors] = useState<BudgetFormErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  // POST/PATCH tidak idempoten dari sisi UI: cegah ketukan ganda sebelum render ulang
  const submittingRef = useRef(false);
  // Ref field untuk memfokuskan input atau menggulir ke kartu pertama yang error.
  const totalInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const amountInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  // Kartu (bukan hanya input) menjadi target gulir agar label dan helper ikut terlihat.
  const totalCardRef = useRef<ViewInstance>(null);
  const amountCardRef = useRef<ViewInstance>(null);
  const categoryCardRef = useRef<ViewInstance>(null);
  const thresholdCardRef = useRef<ViewInstance>(null);
  // Ref fokus dipakai handler layout: keyboard memadatkan ScrollView setelah fokus,
  // jadi posisi target perlu dihitung ulang saat layout berubah.
  const totalFocusedRef = useRef(false);
  const amountFocusedRef = useRef(false);
  // Menandai target fokus dari validasi agar onFocus tidak menjalankan scroll
  // manual kedua kalinya.
  const validationFocusRef = useRef<BudgetErrorField | null>(null);

  // Hanya aksi simpan yang menampilkan spinner di footer. Saat menghapus,
  // footer ikut nonaktif tetapi spinner hanya muncul di dialog konfirmasi.
  const saving =
    createBudget.isPending ||
    addCategory.isPending ||
    updateTotal.isPending ||
    updateCategory.isPending;
  const deleting = removeCategory.isPending;
  const busy = saving || deleting;

  const total = parseRawAmount(totalText);
  const amount = parseRawAmount(amountText);
  const allocated = budget ? totalAllocated(budget.categories) : 0;
  // Saat mengedit satu kategori, batas atas nominalnya dihitung dari kategori lain.
  const otherAllocated =
    budget && editCategory
      ? totalAllocated(budget.categories, editCategory.category_id)
      : allocated;
  const selectedCategory = categories.data?.find(
    (category) => category.id === categoryId,
  );
  // Ringkasan error hanya untuk kolom yang sedang tampil; error dari langkah lain
  // tidak boleh terbawa setelah pengguna kembali lewat header.
  const visibleErrors: BudgetFormErrors =
    editingTotal || step === "total"
      ? { total: errors.total }
      : {
          category: errors.category,
          amount: errors.amount,
          threshold: errors.threshold,
        };

  const scrollTop = () => {
    totalFocusedRef.current = false;
    amountFocusedRef.current = false;
    validationFocusRef.current = null;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // Kartu nominal berada di dalam pembungkus, jadi measure() biasa mengembalikan
  // koordinat terhadap pembungkus (mendekati 0). measureLayout terhadap isi
  // ScrollView memberi koordinat konten yang benar.
  const scrollFieldIntoView = (field: BudgetErrorField, offset = 12) => {
    const scroll = scrollRef.current;
    // measureLayout di arsitektur baru membutuhkan ref native, bukan node handle
    // dari getInnerViewNode(). getInnerViewRef() mengembalikan ref inner ScrollView.
    const inner = scroll?.getInnerViewRef();
    if (!scroll || inner == null) return;

    const card =
      field === "total"
        ? totalCardRef.current
        : field === "amount"
          ? amountCardRef.current
          : field === "category"
            ? categoryCardRef.current
            : thresholdCardRef.current;
    if (!card) return;

    card.measureLayout(
      inner,
      (_x, y) => {
        scroll.scrollTo({
          y: Math.max(0, y - offset),
          animated: true,
        });
      },
      () => {
        // Kartu bisa sudah dilepas saat layout berubah; tidak ada yang perlu dilakukan.
      },
    );
  };

  const scrollFocusedInputIntoView = () => {
    if (validationFocusRef.current) {
      scrollFieldIntoView(validationFocusRef.current, 16);
      return;
    }
    if (amountFocusedRef.current) {
      scrollFieldIntoView("amount");
    } else if (totalFocusedRef.current) {
      scrollFieldIntoView("total");
    }
  };

  const focusTotalInput = () => {
    totalFocusedRef.current = true;
    // Fokus dari validasi sudah digulir oleh focusFirstError.
    if (validationFocusRef.current === "total") return;
    validationFocusRef.current = null;
    setTimeout(scrollFocusedInputIntoView, 50);
  };

  const blurTotalInput = () => {
    totalFocusedRef.current = false;
    if (validationFocusRef.current === "total") {
      validationFocusRef.current = null;
    }
  };

  const focusAmountInput = () => {
    amountFocusedRef.current = true;
    if (validationFocusRef.current === "amount") return;
    validationFocusRef.current = null;
    setTimeout(scrollFocusedInputIntoView, 50);
  };

  const blurAmountInput = () => {
    amountFocusedRef.current = false;
    if (validationFocusRef.current === "amount") {
      validationFocusRef.current = null;
    }
  };

  const focusFirstError = (nextErrors: BudgetFormErrors) => {
    const field = firstBudgetErrorField(nextErrors);
    if (!field) return;

    validationFocusRef.current = field;

    if (field === "total") {
      totalInputRef.current?.focus();
    } else if (field === "amount") {
      amountInputRef.current?.focus();
    }

    // Input teks membuka keyboard; scroll diulang lewat onLayout ketika layout
    // sudah memadat. Kategori/batas peringatan tidak punya input teks, jadi
    // cukup digulir ke kartunya.
    setTimeout(() => scrollFieldIntoView(field, 16), 50);
  };

  // Terapkan error dan fokus/gulir setelah render, sama seperti Transaction Form.
  const showValidationErrors = (nextErrors: BudgetFormErrors) => {
    setErrors(nextErrors);
    setAttempted(true);
    if (hasBudgetFormError(nextErrors)) {
      setTimeout(() => focusFirstError(nextErrors), 50);
    } else {
      validationFocusRef.current = null;
    }
  };

  const changeTotal = (text: string) => {
    validationFocusRef.current = null;
    const next = formatInputAmount(text);
    if (parseRawAmount(next) > MAX_AMOUNT) {
      setErrors((prev) => ({
        ...prev,
        total: "Nominal melebihi batas maksimum.",
      }));
      return;
    }
    setErrors((prev) => withoutError(prev, "total"));
    setTotalText(next);
  };

  const changeAmount = (text: string) => {
    validationFocusRef.current = null;
    const next = formatInputAmount(text);
    if (parseRawAmount(next) > MAX_AMOUNT) {
      setErrors((prev) => ({
        ...prev,
        amount: "Nominal melebihi batas maksimum.",
      }));
      return;
    }
    setErrors((prev) => withoutError(prev, "amount"));
    setAmountText(next);
  };

  // Chip menambah nilai yang sedang diisi, sama seperti layar Saldo Awal.
  const addTotalPreset = (increment: number) => {
    validationFocusRef.current = null;
    const next = Math.min(total + increment, MAX_AMOUNT);
    setErrors((prev) => withoutError(prev, "total"));
    setTotalText(formatInputAmount(String(next)));
  };

  const addAmountPreset = (increment: number) => {
    validationFocusRef.current = null;
    const next = Math.min(amount + increment, MAX_AMOUNT);
    setErrors((prev) => withoutError(prev, "amount"));
    setAmountText(formatInputAmount(String(next)));
  };

  const changeThreshold = (value: number) => {
    validationFocusRef.current = null;
    setErrors((prev) => withoutError(prev, "threshold"));
    setThreshold(value);
  };

  const showError = (error: unknown, mapAllocationToTotal = false) => {
    const info = resolveBudgetError(error);
    if (info.field === "form") {
      toast.error(info.message);
      return;
    }
    // Saat hanya mengubah total, backend menandai `categories`; pesannya harus
    // muncul di kolom total karena kolom nominal kategori tidak sedang tampil.
    const field =
      mapAllocationToTotal &&
      (info.field === "amount" || info.field === "category")
        ? "total"
        : info.field;
    const nextErrors: BudgetFormErrors = { [field]: info.message };
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    setAttempted(true);
    setTimeout(() => focusFirstError(nextErrors), 50);
  };

  const goToCategory = () => {
    const stepErrors = validateTotalStep({ total, allocated });
    showValidationErrors(stepErrors);
    if (hasBudgetFormError(stepErrors)) return;
    setAttempted(false);
    onStepChange("category");
    scrollTop();
  };

  const backToTotal = () => {
    setErrors({});
    setAttempted(false);
    onStepChange("total");
    scrollTop();
  };

  const openTotalEditor = () => {
    setErrors({});
    setAttempted(false);
    onEditingTotalChange(true);
    scrollTop();
  };

  const saveTotal = async () => {
    if (!budget || submittingRef.current) return;
    const stepErrors = validateTotalStep({ total, allocated });
    showValidationErrors(stepErrors);
    if (hasBudgetFormError(stepErrors)) return;

    submittingRef.current = true;
    try {
      await updateTotal.mutateAsync({ budgetId: budget.id, totalAmount: total });
      toast.success("Total anggaran diperbarui");
      onEditingTotalChange(false);
      setAttempted(false);
      scrollTop();
    } catch (error) {
      showError(error, true);
    } finally {
      submittingRef.current = false;
    }
  };

  const submitCategory = async () => {
    if (submittingRef.current) return;

    const stepErrors = validateCategoryStep({
      categoryId: categoryId ?? "",
      amount,
      threshold,
      total,
      // Saat mengedit, nominal lama kategori ini tidak boleh ikut dihitung.
      allocated: mode === "edit" ? otherAllocated : allocated,
    });
    showValidationErrors(stepErrors);
    if (hasBudgetFormError(stepErrors) || !categoryId) return;

    submittingRef.current = true;
    try {
      if (mode === "create") {
        await createBudget.mutateAsync(
          createBudgetBody({
            total,
            categoryId,
            amount,
            threshold,
            periodStart: currentPeriodStart(),
          }),
        );
        toast.success("Anggaran dibuat");
      } else if (mode === "edit" && budget) {
        await updateCategory.mutateAsync({
          budget,
          categoryId,
          amount,
          threshold,
        });
        toast.success("Anggaran kategori diperbarui");
      } else if (budget) {
        await addCategory.mutateAsync({
          budget,
          categoryId,
          amount,
          threshold,
        });
        toast.success("Anggaran per kategori ditambahkan");
      }
      onDone();
    } catch (error) {
      showError(error);
    } finally {
      submittingRef.current = false;
    }
  };

  // Hapus memakai PATCH dengan daftar kategori lain; total tidak ikut berubah.
  const removeSelectedCategory = async () => {
    if (!budget || !categoryId || submittingRef.current) return;
    submittingRef.current = true;
    try {
      await removeCategory.mutateAsync({ budget, categoryId });
      toast.success("Rincian kategori dihapus");
      setDeleteConfirmVisible(false);
      onDone();
    } catch (error) {
      // Tidak ada kolom form untuk aksi ini; pesan backend ditampilkan sebagai toast.
      toast.error(resolveBudgetError(error).message);
      setDeleteConfirmVisible(false);
    } finally {
      submittingRef.current = false;
    }
  };

  const submitLabel = editingTotal
    ? "Simpan Total"
    : mode === "edit"
      ? "Simpan Perubahan"
      : step === "total"
        ? "Lanjut: Pilih Kategori"
        : mode === "create"
          ? "Simpan Anggaran"
          : "Simpan Anggaran per Kategori";

  const onSubmit = () => {
    if (busy) return;
    if (editingTotal) void saveTotal();
    else if (step === "total") goToCategory();
    else void submitCategory();
  };

  const summaryRows: SummaryRow[] =
    mode === "create"
      ? [
          {
            label: "Sisa setelah alokasi ini",
            value: Math.max(total - amount, 0),
          },
        ]
      : [
          { label: "Terpakai", value: budget?.spent_total ?? 0 },
          {
            label: "Belum dialokasikan",
            value: Math.max(total - allocated, 0),
          },
        ];

  const showEditStep =
    !editingTotal && mode === "edit" && !!budget && !!editCategory;
  const showCategoryStep =
    !editingTotal && mode !== "edit" && step === "category";

  return (
    <>
      <KeyboardScreen
        scrollRef={scrollRef}
        className="bg-[#f8f9ff]"
        contentContainerClassName="gap-4 px-5 pb-6 pt-2"
        onLayout={scrollFocusedInputIntoView}
        onContentSizeChange={scrollFocusedInputIntoView}
        footer={
          <View
            className="border-t border-[rgba(196,198,206,0.3)] bg-[rgba(255,255,255,0.95)] px-5 pt-[21px]"
            style={{
              paddingBottom: keyboardVisible
                ? 12
                : Math.max(insets.bottom, 24) + 8,
            }}
          >
            {attempted ? (
              <BudgetValidationSummary
                errors={visibleErrors}
                onPress={() => focusFirstError(visibleErrors)}
              />
            ) : null}

            {/* Pressable hanya penangkap sentuhan; warna ada pada View di dalamnya */}
            <Pressable
              onPress={onSubmit}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
              accessibilityState={{ disabled: busy, busy: saving }}
              className={busy ? "opacity-80" : "active:opacity-90"}
            >
              <View className="h-[54px] flex-row items-center justify-center rounded-2xl bg-[#006c50]">
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="font-sans text-base font-semibold leading-[22px] text-white">
                    {submitLabel}
                  </Text>
                )}
              </View>
            </Pressable>
          </View>
        }
      >
        {editingTotal ? (
          <BudgetTotalPanel
            editing
            totalText={totalText}
            error={errors.total}
            allocated={allocated}
            totalInputRef={totalInputRef}
            totalCardRef={totalCardRef}
            onChangeText={changeTotal}
            onTotalFocus={focusTotalInput}
            onTotalBlur={blurTotalInput}
            onAddPreset={addTotalPreset}
          />
        ) : showEditStep && budget && editCategory ? (
          <BudgetEditCategoryPanel
            budget={budget}
            editCategory={editCategory}
            selectedCategory={selectedCategory ?? null}
            total={total}
            summaryRows={summaryRows}
            amount={amount}
            amountText={amountText}
            amountError={errors.amount}
            amountHelper={`Maksimal ${formatPlainRupiah(
              Math.max(total - otherAllocated, 0),
            )} untuk kategori ini.`}
            amountInputRef={amountInputRef}
            amountCardRef={amountCardRef}
            onAmountFocus={focusAmountInput}
            onAmountBlur={blurAmountInput}
            threshold={threshold}
            thresholdError={errors.threshold}
            thresholdRef={thresholdCardRef}
            deleteDisabled={busy || budget.categories.length <= 1}
            onEditTotal={openTotalEditor}
            onAmountChange={changeAmount}
            onAddAmountPreset={addAmountPreset}
            onThresholdChange={changeThreshold}
            onRequestDelete={() => setDeleteConfirmVisible(true)}
          />
        ) : step === "total" ? (
          <BudgetTotalPanel
            editing={false}
            totalText={totalText}
            error={errors.total}
            allocated={allocated}
            totalInputRef={totalInputRef}
            totalCardRef={totalCardRef}
            onChangeText={changeTotal}
            onTotalFocus={focusTotalInput}
            onTotalBlur={blurTotalInput}
            onAddPreset={addTotalPreset}
          />
        ) : showCategoryStep ? (
          <BudgetCategoryAddPanel
            mode={mode === "create" ? "create" : "add"}
            budget={budget}
            categoryId={categoryId}
            selectedCategory={selectedCategory ?? null}
            amount={amount}
            amountText={amountText}
            amountError={errors.amount}
            threshold={threshold}
            thresholdError={errors.threshold}
            categoryError={errors.category}
            total={total}
            summaryRows={summaryRows}
            amountInputRef={amountInputRef}
            amountCardRef={amountCardRef}
            categoryRef={categoryCardRef}
            thresholdRef={thresholdCardRef}
            onSelectCategory={(id) => {
              validationFocusRef.current = null;
              setErrors((prev) => withoutError(prev, "category"));
              setCategoryId(id);
            }}
            onAmountChange={changeAmount}
            onAmountFocus={focusAmountInput}
            onAmountBlur={blurAmountInput}
            onAddAmountPreset={addAmountPreset}
            onThresholdChange={changeThreshold}
            onEditTotal={mode === "create" ? backToTotal : openTotalEditor}
          />
        ) : null}
      </KeyboardScreen>

      {showEditStep && editCategory ? (
        <ConfirmDialog
          visible={deleteConfirmVisible}
          title="Hapus rincian kategori?"
          message={`Alokasi ${editCategory.name} akan dihapus. Transaksi yang sudah tercatat tetap tersimpan dan menjadi tidak teralokasi. Total anggaran tidak berubah.`}
          confirmLabel="Ya, hapus"
          destructive
          pending={deleting}
          onConfirm={() => void removeSelectedCategory()}
          onCancel={() => setDeleteConfirmVisible(false)}
        />
      ) : null}
    </>
  );
}

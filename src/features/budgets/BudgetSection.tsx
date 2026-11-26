import { useTabBarClearance } from "@/components/ui/BottomTabBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { RefreshErrorBanner } from "@/components/ui/RefreshErrorBanner";
import { useCategories } from "@/features/transactions/useCategories";
import { currentMonth, formatMonthLabel } from "@/utils/jakartaDates";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { type ReactNode, useCallback, useMemo } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BudgetCategoryCard } from "./BudgetCategoryCard";
import { BudgetHeroCard } from "./BudgetHeroCard";
import { BudgetEmptyState, BudgetSkeleton } from "./BudgetStates";
import { budgetLoadErrorMessage } from "./budgetErrors";
import { daysLeft } from "./budgetPeriods";
import { useBudgetDetail } from "./budgetQueries";
import type { useBudgetMonthSelection } from "./useBudgetMonthSelection";

const LIST_FALLBACK =
  "Daftar anggaran belum bisa dimuat. Coba lagi sebentar lagi.";
const DETAIL_FALLBACK =
  "Rincian anggaran belum bisa dimuat. Coba lagi sebentar lagi.";

interface BudgetSectionProps {
  // Bulan terpilih dipegang tab (header), supaya tombol bulan bisa tampil di
  // luar area gulir. Section hanya merender isi bulan tersebut.
  selection: ReturnType<typeof useBudgetMonthSelection>;
}

// Segmen "Anggaran" pada tab Analisis.
export function BudgetSection({ selection }: BudgetSectionProps) {
  const router = useRouter();
  const tabBarSpace = useTabBarClearance();
  const { budgets, months, selected, resolvedId } = selection;

  // budget_categories tidak menyimpan ikon/warna; keduanya hanya ada di
  // GET /categories, jadi dipetakan lewat category_id.
  const categories = useCategories("expense");
  const categoryLookup = useMemo(
    () =>
      new Map(
        (categories.data ?? []).map((category) => [
          category.id,
          { icon: category.icon, color: category.color },
        ]),
      ),
    [categories.data],
  );

  const hasActiveMonth = months.some((month) => month.isActive);
  const detail = useBudgetDetail(resolvedId);

  const refreshAll = useCallback(() => {
    void budgets.refetch();
    if (resolvedId) void detail.refetch();
  }, [budgets, detail, resolvedId]);

  const openCreate = useCallback(() => {
    router.push({ pathname: "/budget/add" });
  }, [router]);

  const openAddCategory = useCallback(() => {
    if (!resolvedId) {
      openCreate();
      return;
    }
    router.push({ pathname: "/budget/add", params: { budgetId: resolvedId } });
  }, [openCreate, resolvedId, router]);

  const openEditTotal = useCallback(() => {
    if (!resolvedId) return;
    router.push({
      pathname: "/budget/add",
      params: { budgetId: resolvedId, editTotal: "1" },
    });
  }, [resolvedId, router]);

  // Hanya periode aktif yang bisa mengubah alokasi (periode lampau baca-saja).
  const openEditCategory = useCallback(
    (categoryId: string) => {
      if (!resolvedId || !selected?.isActive) return;
      router.push({
        pathname: "/budget/add",
        params: { budgetId: resolvedId, categoryId },
      });
    },
    [resolvedId, router, selected?.isActive],
  );

  let body: ReactNode;
  if (budgets.isPending) {
    body = <BudgetSkeleton />;
  } else if (budgets.isError && !budgets.data) {
    body = (
      <ErrorState
        title="Gagal memuat anggaran"
        message={budgetLoadErrorMessage(budgets.error, LIST_FALLBACK)}
        onRetry={refreshAll}
        retrying={budgets.isRefetching}
      />
    );
  } else if (months.length === 0) {
    body = (
      <BudgetEmptyState
        monthLabel={formatMonthLabel(currentMonth())}
        onCreate={openCreate}
      />
    );
  } else if (!resolvedId || detail.isPending) {
    body = <BudgetSkeleton showAddButton={selected?.isActive ?? false} />;
  } else if (detail.isError || !detail.data) {
    body = (
      <ErrorState
        title="Gagal memuat rincian"
        message={budgetLoadErrorMessage(detail.error, DETAIL_FALLBACK)}
        onRetry={() => void detail.refetch()}
        retrying={detail.isRefetching}
      />
    );
  } else {
    const data = detail.data;
    body = (
      <View className="gap-4">
        <BudgetHeroCard
          total={data.total_amount}
          spent={data.spent_total}
          remaining={data.remaining_total}
          percent={data.percent_total}
          status={data.status_total}
          daysLeft={daysLeft(data.period_end)}
          isActive={selected?.isActive ?? false}
          label={
            selected?.isActive
              ? "Total Anggaran Bulan Ini"
              : `Total Anggaran ${selected?.monthLabel ?? ""}`.trim()
          }
          onEditTotal={selected?.isActive ? openEditTotal : undefined}
        />

        {/* Menambah alokasi hanya masuk akal untuk periode yang sedang berjalan */}
        {selected?.isActive ? (
          <Pressable
            onPress={openAddCategory}
            accessibilityRole="button"
            accessibilityLabel="Tambah anggaran per kategori"
            className="active:opacity-80"
          >
            <View className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-[#006c50] bg-[rgba(0,108,80,0.04)]">
              <Ionicons name="add" size={18} color="#006c50" />
              <Text className="font-sans text-sm font-semibold leading-5 text-[#006c50]">
                Tambah Anggaran per Kategori
              </Text>
            </View>
          </Pressable>
        ) : (
          <Text className="font-sans text-center text-xs leading-4 text-[#74777e]">
            Periode ini sudah berakhir. Anggaran bulan lampau bersifat
            baca-saja.
          </Text>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-[20px] font-bold leading-[25px] tracking-[-0.5px] text-[#001d37]">
            Rincian per Kategori
          </Text>
          <Text className="font-sans text-xs font-semibold leading-4 text-[#43474d]">
            {`${data.categories.length} Kategori Anggaran`}
          </Text>
        </View>

        <View className="gap-3">
          {data.categories.map((category) => {
            const meta = categoryLookup.get(category.category_id);
            return (
              <BudgetCategoryCard
                key={category.category_id}
                name={category.name}
                icon={meta?.icon ?? null}
                color={meta?.color ?? null}
                amount={category.amount}
                spent={category.spent}
                remaining={category.remaining}
                percent={category.percent}
                status={category.status}
                onPress={
                  selected?.isActive
                    ? () => openEditCategory(category.category_id)
                    : undefined
                }
              />
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Banner di luar ScrollView agar tetap terlihat di posisi gulir mana pun */}
      {budgets.isError && budgets.data ? (
        <View className="px-5 pt-3">
          <RefreshErrorBanner
            onRetry={refreshAll}
            retrying={budgets.isRefetching}
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: tabBarSpace,
          gap: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={budgets.isRefetching || detail.isRefetching}
            onRefresh={refreshAll}
            colors={["#006c50"]}
            tintColor="#006c50"
          />
        }
      >
        {/* Ada riwayat, tetapi bulan berjalan belum dianggarkan */}
        {months.length > 0 && !hasActiveMonth ? (
          <View className="rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-4">
            <Text className="font-sans text-sm font-semibold leading-5 text-[#121c2a]">
              {`Belum ada anggaran ${formatMonthLabel(currentMonth())}`}
            </Text>
            <Text className="font-sans mt-1 text-xs leading-4 text-[#43474d]">
              Buat anggaran bulan ini agar pengeluaran tetap terpantau.
            </Text>
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Buat anggaran bulan ini"
              className="mt-3 self-start overflow-hidden rounded-xl active:opacity-80"
              style={{ backgroundColor: "#006c50" }}
            >
              <View className="h-11 flex-row items-center justify-center px-4">
                <Text className="font-sans text-sm font-semibold leading-5 text-white">
                  Buat Anggaran
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {body}
      </ScrollView>
    </View>
  );
}

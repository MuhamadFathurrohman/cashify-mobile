import type { ReportCategory } from "@/types/api";
import { categoryIconName, TYPE_THEME } from "@/utils/categoryIconTheme";
import { formatPlainRupiah } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Text, View } from "react-native";
import { formatReportPercent } from "./reportInsights";

export interface CategoryVisual {
  icon: string;
  color: string;
}

interface ReportCategorySectionProps {
  categories: ReportCategory[];
  visuals: Map<string, CategoryVisual>;
}

function bubbleColor(color: string | null): string {
  return color && /^#[0-9a-f]{6}$/i.test(color)
    ? `${color}1A`
    : TYPE_THEME.expense.bubble;
}

function CategoryRow({
  category,
  visual,
}: {
  category: ReportCategory;
  visual: CategoryVisual | undefined;
}) {
  const icon = categoryIconName(
    visual?.icon ?? category.slug,
    "expense",
  );
  const color = visual?.color ?? TYPE_THEME.expense.text;
  const width = `${Math.min(100, Math.max(0, category.percent))}%` as `${number}%`;

  return (
    <View
      accessible
      accessibilityLabel={`${category.name}, ${formatPlainRupiah(category.total)}, ${formatReportPercent(category.percent)} dari pengeluaran`}
      className="gap-2"
    >
      <View className="flex-row items-center">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: bubbleColor(visual?.color ?? null) }}
        >
          <Ionicons name={icon} size={19} color={color} />
        </View>

        <View className="ml-3 flex-1">
          <Text
            className="font-sans text-sm font-semibold leading-5 text-[#121c2a]"
            numberOfLines={1}
          >
            {category.name}
          </Text>
          <Text className="font-sans mt-[1px] text-[11px] leading-4 text-[#74777e]">
            {`${formatReportPercent(category.percent)} dari pengeluaran`}
          </Text>
        </View>

        <Text
          className="font-sans ml-3 text-sm font-semibold leading-5 tracking-[-0.16px] text-[#121c2a]"
          numberOfLines={1}
        >
          {formatPlainRupiah(category.total)}
        </Text>
      </View>

      <View className="h-[6px] overflow-hidden rounded-full bg-[#eef2f7]">
        <View
          className="h-full rounded-full"
          style={{ width, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

// Kategori pengeluaran sudah terurut total menurun dari backend; bagian ini
// hanya memotong lima teratas dan memetakan ikon dari GET /categories.
export function ReportCategorySection({
  categories,
  visuals,
}: ReportCategorySectionProps) {
  const caption =
    categories.length === 0
      ? "Belum ada"
      : categories.length === 5
        ? "5 teratas"
        : `${categories.length} kategori`;

  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between gap-3">
        <Text className="font-sans text-[20px] font-bold leading-[25px] tracking-[-0.5px] text-[#001d37]">
          Pengeluaran Terbesar
        </Text>
        <Text className="font-sans pb-[2px] text-xs font-semibold leading-4 text-[#43474d]">
          {caption}
        </Text>
      </View>

      <View className="rounded-2xl border border-[rgba(196,198,206,0.3)] bg-white p-[17px]">
        {categories.length === 0 ? (
          <View className="items-center py-6">
            <Ionicons name="pie-chart-outline" size={26} color="#c4c6ce" />
            <Text className="font-sans mt-2 text-sm font-semibold text-[#43474d]">
              Belum ada pengeluaran
            </Text>
            <Text className="font-sans mt-1 text-center text-xs leading-4 text-[#74777e]">
              Pengeluaran per kategori akan muncul di sini.
            </Text>
          </View>
        ) : (
          <View className="gap-[14px]">
            {categories.map((category) => (
              <CategoryRow
                key={category.category_id}
                category={category}
                visual={visuals.get(category.category_id)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

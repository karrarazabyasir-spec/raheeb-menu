"use client";

import React from "react";
import { Category } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import {
  Flame,
  Utensils,
  Salad,
  Crown,
  GlassWater,
  IceCream,
  Grid,
} from "lucide-react";

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  brandColor?: string;
  selectedSubcategory?: string;
  onSelectSubcategory?: (subcat: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Flame: <Flame className="w-4 h-4" />,
  Utensils: <Utensils className="w-4 h-4" />,
  Salad: <Salad className="w-4 h-4" />,
  Crown: <Crown className="w-4 h-4" />,
  GlassWater: <GlassWater className="w-4 h-4" />,
  IceCream: <IceCream className="w-4 h-4" />,
};

export function CategoryBar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  brandColor = "#780000",
  selectedSubcategory = "all",
  onSelectSubcategory,
}: CategoryBarProps) {
  const { isRtl, t } = useLanguage();

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const subcategories = activeCategory?.subcategories && activeCategory.subcategories.length > 0
    ? activeCategory.subcategories
    : null;

  return (
    <div className="sticky top-[95px] z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 py-2.5 px-3 space-y-2">
      {/* Row 1: Main Categories */}
      <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {/* All button */}
        <button
          onClick={() => {
            onSelectCategory("all");
            onSelectSubcategory?.("all");
          }}
          style={{
            backgroundColor: selectedCategoryId === "all" ? brandColor : undefined,
            borderColor: selectedCategoryId === "all" ? brandColor : undefined,
          }}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            selectedCategoryId === "all"
              ? "text-white shadow-md scale-102"
              : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>{t("allCategories")}</span>
        </button>

        {categories
          .filter((cat) => cat.isActive)
          .map((category) => {
            const isSelected = selectedCategoryId === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  onSelectCategory(category.id);
                  onSelectSubcategory?.("all");
                }}
                style={{
                  backgroundColor: isSelected ? brandColor : undefined,
                  borderColor: isSelected ? brandColor : undefined,
                }}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? "text-white shadow-md scale-102"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <span
                  style={{ color: isSelected ? undefined : brandColor }}
                  className={isSelected ? "text-amber-300" : undefined}
                >
                  {iconMap[category.iconName] || <Utensils className="w-4 h-4" />}
                </span>
                <span>{isRtl ? category.nameAr : category.nameEn}</span>
              </button>
            );
          })}
      </div>

      {/* Row 2: Subcategories (Dynamic for selected main category) */}
      {subcategories && (
        <div className="max-w-6xl mx-auto pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-[11px] font-bold text-stone-400 pl-1 shrink-0">
            الأصناف:
          </span>
          <button
            type="button"
            onClick={() => onSelectSubcategory?.("all")}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedSubcategory === "all"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/60"
            }`}
          >
            الكل
          </button>
          {subcategories.map((subcat) => {
            const isSubSelected = selectedSubcategory === subcat;
            return (
              <button
                key={subcat}
                type="button"
                onClick={() => onSelectSubcategory?.(subcat)}
                style={{
                  backgroundColor: isSubSelected ? brandColor : undefined,
                  borderColor: isSubSelected ? brandColor : undefined,
                }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSubSelected
                    ? "text-white shadow-xs"
                    : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
                }`}
              >
                {subcat}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

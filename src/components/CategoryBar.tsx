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
}: CategoryBarProps) {
  const { isRtl, t } = useLanguage();

  return (
    <div className="sticky top-[95px] z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 py-2.5 px-3">
      <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {/* All button */}
        <button
          onClick={() => onSelectCategory("all")}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            selectedCategoryId === "all"
              ? "bg-[#780000] text-white shadow-md shadow-red-900/20 scale-102"
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
                onClick={() => onSelectCategory(category.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? "bg-[#780000] text-white shadow-md shadow-red-900/20 scale-102"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <span className={isSelected ? "text-amber-300" : "text-[#780000]"}>
                  {iconMap[category.iconName] || <Utensils className="w-4 h-4" />}
                </span>
                <span>{isRtl ? category.nameAr : category.nameEn}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

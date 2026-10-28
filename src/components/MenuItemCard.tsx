"use client";

import React from "react";
import Image from "next/image";
import { MenuItem, RestaurantSettings } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { Plus, Flame, Star, Leaf, Sparkles, AlertCircle } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  settings: RestaurantSettings;
  onSelectItem: (item: MenuItem) => void;
}

export function MenuItemCard({ item, settings, onSelectItem }: MenuItemCardProps) {
  const { isRtl, t } = useLanguage();

  const name = isRtl ? item.nameAr : item.nameEn;
  const description = isRtl ? item.descriptionAr : item.descriptionEn;
  const currency = isRtl ? settings.currency : settings.currencyEn;

  const hasCustomizations =
    (item.variants && item.variants.length > 0) ||
    (item.optionGroups && item.optionGroups.length > 0);

  return (
    <div
      onClick={() => item.isAvailable && onSelectItem(item)}
      className={`group relative bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer ${
        !item.isAvailable ? "opacity-60 grayscale-[40%]" : "hover:-translate-y-1"
      }`}
    >
      {/* Top Image & Badges */}
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {/* Tags */}
        <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1.5 z-10">
          {item.tags.includes("popular") && (
            <span className="bg-amber-500 text-stone-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <Star className="w-3 h-3 fill-stone-950" />
              <span>{t("popular")}</span>
            </span>
          )}
          {item.tags.includes("spicy") && (
            <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <Flame className="w-3 h-3 fill-white" />
              <span>{t("spicy")}</span>
            </span>
          )}
          {item.tags.includes("vegetarian") && (
            <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <Leaf className="w-3 h-3 fill-white" />
              <span>{t("vegetarian")}</span>
            </span>
          )}
          {item.tags.includes("new") && (
            <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <Sparkles className="w-3 h-3" />
              <span>{t("new")}</span>
            </span>
          )}
        </div>

        {/* Sold out overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-2 text-center">
            <span className="bg-red-900/90 text-white px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm border border-red-500/40 flex items-center gap-1.5 shadow-lg">
              <AlertCircle className="w-4 h-4 text-red-300" />
              <span>{t("soldOut")}</span>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-base sm:text-lg text-stone-900 group-hover:text-[#780000] transition-colors line-clamp-1">
              {name}
            </h3>
          </div>
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* Price & Add button */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-400 font-medium">
              {item.variants && item.variants.length > 0 ? (isRtl ? "يبدأ من" : "Starts at") : (isRtl ? "السعر" : "Price")}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-[#780000]">{item.basePrice}</span>
              <span className="text-xs font-semibold text-stone-600">{currency}</span>
            </div>
          </div>

          <button
            disabled={!item.isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              if (item.isAvailable) onSelectItem(item);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 ${
              item.isAvailable
                ? "bg-[#780000] hover:bg-[#5c0000] text-white"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{hasCustomizations ? t("selectOptions") : t("addToCart")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { MenuItem, RestaurantSettings } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { Plus, Flame, Star, Sparkles, Check } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  settings: RestaurantSettings;
  onSelectItem: (item: MenuItem) => void;
}

export function MenuItemCard({ item, settings, onSelectItem }: MenuItemCardProps) {
  const { isRtl, t } = useLanguage();
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const name = isRtl ? item.nameAr : item.nameEn;
  const description = isRtl ? item.descriptionAr : item.descriptionEn;
  const currency = isRtl ? settings.currency : settings.currencyEn;
  const brandColor = settings.primaryColor || "#780000";

  const hasCustomizations =
    (item.variants && item.variants.length > 0) ||
    (item.optionGroups && item.optionGroups.length > 0);

  const hasVariants = Boolean(item.variants && item.variants.length > 0);
  const displayPrice = hasVariants ? item.variants![0].price : item.basePrice;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;

    if (hasCustomizations) {
      onSelectItem(item);
    } else {
      addToCart(item, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 900);
    }
  };

  return (
    <div
      onClick={() => item.isAvailable && onSelectItem(item)}
      className={`group relative bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer ${
        !item.isAvailable ? "opacity-60 grayscale-[30%]" : "hover:-translate-y-0.5 active:scale-[0.99]"
      }`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-stone-100">
        <img
          src={item.imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Subtle top tag badge & Discount badge */}
        <div className="absolute top-1.5 right-1.5 flex flex-wrap gap-1 z-10 max-w-[85%]">
          {item.originalPrice && item.originalPrice > displayPrice && (
            <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm animate-pulse">
              <span>🔥</span>
              <span>خصم {Math.round(((item.originalPrice - displayPrice) / item.originalPrice) * 100)}%</span>
            </span>
          )}
          {item.tags?.map((tagId) => {
            const foundTag = settings?.customTags?.find((t) => t.id === tagId);
            const label =
              foundTag?.label ||
              (tagId === "popular"
                ? "الأكثر طلباً"
                : tagId === "spicy"
                ? "حار"
                : tagId === "new"
                ? "جديد"
                : tagId === "vegetarian"
                ? "نباتي"
                : tagId);
            const emoji =
              foundTag?.emoji ||
              (tagId === "popular"
                ? "🔥"
                : tagId === "spicy"
                ? "🌶️"
                : tagId === "new"
                ? "✨"
                : tagId === "vegetarian"
                ? "🥗"
                : "🏷️");
            const colorClass =
              foundTag?.color === "red"
                ? "bg-red-600 text-white"
                : foundTag?.color === "emerald"
                ? "bg-emerald-600 text-white"
                : foundTag?.color === "purple"
                ? "bg-purple-600 text-white"
                : foundTag?.color === "blue"
                ? "bg-blue-600 text-white"
                : foundTag?.color === "rose"
                ? "bg-rose-600 text-white"
                : "bg-amber-500 text-stone-950";

            return (
              <span
                key={tagId}
                className={`${colorClass} font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm`}
              >
                <span>{emoji}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            );
          })}
        </div>

        {/* Sold out overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-1 text-center">
            <span className="bg-red-900/90 text-white px-2 py-1 rounded-lg font-bold text-[10px] sm:text-xs border border-red-500/40">
              {t("soldOut")}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-1 pt-2 pb-0.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-xs sm:text-sm text-stone-900 group-hover:text-[#780000] transition-colors line-clamp-1 leading-snug">
            {name}
          </h3>
          {description && (
            <p className="text-[10px] sm:text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed font-normal">
              {description}
            </p>
          )}
        </div>

        {/* Price & Circular Add Button */}
        <div className="pt-2 mt-1 flex items-center justify-between gap-1">
          <div className="flex items-baseline gap-1 min-w-0">
            {hasVariants && item.variants!.length > 1 && (
              <span className="text-[10px] text-stone-400 font-bold shrink-0">
                {isRtl ? "من" : "from"}
              </span>
            )}
            {item.originalPrice && item.originalPrice > displayPrice && (
              <span className="text-[10px] font-bold text-stone-400 line-through shrink-0">
                {item.originalPrice.toLocaleString()}
              </span>
            )}
            <span
              style={{ color: brandColor }}
              className="text-xs sm:text-sm font-black truncate"
            >
              {displayPrice.toLocaleString()}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400">
              {currency}
            </span>
          </div>

          <button
            type="button"
            disabled={!item.isAvailable}
            onClick={handleAddClick}
            style={{ backgroundColor: brandColor }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center shadow-sm hover:brightness-110 active:scale-90 transition shrink-0 ${
              !item.isAvailable ? "opacity-40 cursor-not-allowed" : ""
            }`}
            title={hasCustomizations ? t("selectOptions") : t("addToCart")}
          >
            {justAdded ? (
              <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
            ) : (
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

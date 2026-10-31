"use client";

import React, { useState } from "react";
import { MenuItem, PromoBanner } from "@/types";
import { Sparkles, ArrowLeft, X, Flame } from "lucide-react";

interface PromoDishBannerProps {
  banner?: PromoBanner;
  menuItems: MenuItem[];
  currency?: string;
  onSelectDish: (item: MenuItem) => void;
}

export function PromoDishBanner({
  banner,
  menuItems,
  currency = "د.ع",
  onSelectDish,
}: PromoDishBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!banner || !banner.isActive || dismissed) {
    return null;
  }

  // Find linked dish if any
  const linkedDish = banner.itemId
    ? menuItems.find((i) => i.id === banner.itemId)
    : menuItems.find((i) => i.tags?.includes("new"));

  // Effective display values (fallback to linked dish)
  const title = banner.title || (linkedDish ? `طبق جديد: ${linkedDish.nameAr}` : "طبق جديد مميز في قائمتنا! ✨");
  const subtitle = banner.subtitle || linkedDish?.descriptionAr || "تذوق أحدث أطباقنا المحضرة بأعلى جودة وتتبيلات رهيبة";
  const image = banner.imageUrl || linkedDish?.imageUrl;
  const badgeText = banner.badgeText || "جديد وحصري 🔥";
  const buttonText = banner.buttonText || "اطلب الآن وجربه";

  const handleClick = () => {
    if (linkedDish) {
      onSelectDish(linkedDish);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pt-3 pb-1">
      <div
        onClick={handleClick}
        className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#5a0000] via-[#780000] to-[#9b111e] text-white p-4 sm:p-6 shadow-xl shadow-red-950/20 border border-red-700/40 cursor-pointer group hover:shadow-2xl hover:border-amber-400/40 transition-all duration-300"
      >
        {/* Ambient background glow & decorative circles */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-red-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white flex items-center justify-center transition z-20 backdrop-blur-xs"
          title="إغلاق الإعلان"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative z-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Text & Actions */}
          <div className="flex-1 space-y-2 text-center sm:text-right">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-stone-950 font-black text-[11px] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-stone-950 animate-bounce" />
              <span>{badgeText}</span>
            </div>

            {/* Title */}
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug drop-shadow-xs">
              {title}
            </h2>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs sm:text-sm text-red-100/90 line-clamp-2 max-w-xl font-medium leading-relaxed">
                {subtitle}
              </p>
            )}

            {/* Price & CTA Button */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-2 group-hover:scale-105 active:scale-95 transition-all"
              >
                <span>{buttonText}</span>
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              {linkedDish && (
                <div className="inline-flex items-center gap-1 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 text-xs font-bold text-amber-200">
                  <span>السعر:</span>
                  <span className="font-black text-white text-sm">
                    {linkedDish.basePrice}
                  </span>
                  <span>{currency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dish Image */}
          {image && (
            <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-500">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-xl bg-stone-900/40 relative">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="absolute -bottom-2 -left-2 bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 sm:hidden">
                <Flame className="w-3 h-3 fill-stone-950" />
                <span>جرّبه الآن</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

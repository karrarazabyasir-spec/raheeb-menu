"use client";

import React, { useState } from "react";
import { MenuItem, PromoBanner } from "@/types";
import { ArrowLeft, X, Sparkles } from "lucide-react";

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

  // Effective display values (fallback to linked dish or high-res appetizing default)
  const title =
    banner.title ||
    (linkedDish ? `مشويات ${linkedDish.nameAr}` : "مشويات رهيب الملكية. طعم لا يُنسى.");
  const subtitle =
    banner.subtitle ||
    linkedDish?.descriptionAr ||
    "نكهة غنية، وتتبيلة سرية لا تُقاوم محضرة يومياً بأعلى جودة.";
  const image =
    banner.imageUrl ||
    linkedDish?.imageUrl ||
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=80";
  const badgeText = banner.badgeText || "جديد وحصري 🔥";
  const buttonText = banner.buttonText || "اطلب الآن";

  const handleClick = () => {
    if (linkedDish) {
      onSelectDish(linkedDish);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pt-3 pb-2">
      <div
        onClick={handleClick}
        className="relative w-full h-52 sm:h-64 md:h-72 rounded-3xl overflow-hidden shadow-xl border border-stone-200/40 cursor-pointer group select-none transition-all duration-300 hover:shadow-2xl"
      >
        {/* Full-bleed background image */}
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Sophisticated Dark Gradient Overlays (Right-to-Left Arabic text readability) */}
        {/* 1. Primary horizontal gradient protecting text on the right side */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#4a0000]/95 via-[#4a0000]/80 sm:via-black/70 to-transparent sm:to-black/20" />
        {/* 2. Secondary subtle bottom-up gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white flex items-center justify-center transition z-20 backdrop-blur-md border border-white/10"
          title="إغلاق الإعلان"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Content Container floating over image */}
        <div className="relative z-10 w-full h-full p-5 sm:p-7 md:p-8 flex flex-col justify-between text-right">
          {/* Top Row: Badge & Price */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-[11px] shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
              <span>{badgeText}</span>
            </div>

            {linkedDish && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold text-amber-300 shadow-sm ml-8 sm:ml-0">
                <span className="text-[10px] text-white/80">السعر:</span>
                <span className="font-black text-white text-sm">
                  {linkedDish.basePrice}
                </span>
                <span className="text-[10px]">{currency}</span>
              </div>
            )}
          </div>

          {/* Middle & Bottom: Headline, Subtitle, and Pill CTA Button (Arby's style) */}
          <div className="max-w-md sm:max-w-lg space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {title}
            </h2>

            {subtitle && (
              <p className="text-xs sm:text-sm text-stone-200/90 font-medium line-clamp-2 max-w-sm sm:max-w-md leading-relaxed drop-shadow-xs">
                {subtitle}
              </p>
            )}

            {/* Arby's style pill button with arrow */}
            <div className="pt-2 flex items-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-amber-400 text-stone-900 hover:text-stone-950 font-black text-xs sm:text-sm rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300 active:scale-95"
              >
                <span>{buttonText}</span>
                <ArrowLeft className="w-4 h-4 stroke-[3] transition-transform group-hover:-translate-x-1" />
              </button>
            </div>
          </div>

          {/* Bottom Carousel Dots (matching reference) */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-5 h-1.5 rounded-full bg-white shadow-xs" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

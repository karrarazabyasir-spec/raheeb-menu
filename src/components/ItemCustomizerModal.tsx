"use client";

import React, { useState, useEffect, useRef } from "react";
import { ItemVariant, MenuItem, RestaurantSettings, SelectedOption } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, Check, AlertCircle, Sparkles } from "lucide-react";

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  settings: RestaurantSettings;
  onClose: () => void;
}

export function ItemCustomizerModal({
  item,
  settings,
  onClose,
}: ItemCustomizerModalProps) {
  const { isRtl, t } = useLanguage();
  const { addToCart, setIsCartOpen } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | undefined>(undefined);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Elastic bounce physics tracking
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const bounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [bounceOffset, setBounceOffset] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);

  // Initialize defaults
  useEffect(() => {
    if (!item) return;
    setQuantity(1);
    setNotes("");
    setErrorMsg(null);

    // Default variant to first variant if exists
    if (item.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    } else {
      setSelectedVariant(undefined);
    }

    // Default required options to first option of each required group
    const initialOpts: SelectedOption[] = [];
    if (item.optionGroups) {
      item.optionGroups.forEach((group) => {
        if (group.required && group.options.length > 0) {
          const first = group.options[0];
          initialOpts.push({
            groupId: group.id,
            groupName: isRtl ? group.nameAr : group.nameEn,
            optionId: first.id,
            optionName: isRtl ? first.nameAr : first.nameEn,
            price: first.price,
          });
        }
      });
    }
    setSelectedOptions(initialOpts);
    setBounceOffset(0);
    setIsBouncing(false);
  }, [item, isRtl]);

  // Cleanup bounce timeouts
  useEffect(() => {
    return () => {
      if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
    };
  }, []);

  // Lock background page scroll when modal is open
  useEffect(() => {
    if (item) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [item]);

  // Touch gesture handlers for elastic rubber-band physics
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsBouncing(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    const el = scrollRef.current;
    if (!el) return;

    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    const isAtTop = el.scrollTop <= 2;
    const isNotScrollable = el.scrollHeight <= el.clientHeight + 5;

    // User pulls finger UP (diff < 0), attempting to scroll down past content
    if ((isAtBottom || isNotScrollable) && diff < 0) {
      const pullDistance = Math.abs(diff);
      // Fluid logarithmic rubber resistance formula (max ~48px)
      const resistance = Math.min(48, Math.pow(pullDistance, 0.72));
      setBounceOffset(-resistance);
    }
    // User pulls finger DOWN (diff > 0), attempting to scroll up past top
    else if ((isAtTop || isNotScrollable) && diff > 0) {
      const pullDistance = diff;
      const resistance = Math.min(36, Math.pow(pullDistance, 0.72));
      setBounceOffset(resistance);
    } else {
      setBounceOffset(0);
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    setIsBouncing(true);
    setBounceOffset(0);
  };

  // Trackpad / mouse wheel elastic bounce
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    const isAtTop = el.scrollTop <= 2;
    const isNotScrollable = el.scrollHeight <= el.clientHeight + 5;

    if ((isAtBottom || isNotScrollable) && e.deltaY > 8) {
      if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
      setIsBouncing(true);
      setBounceOffset(-20);
      bounceTimeoutRef.current = setTimeout(() => {
        setBounceOffset(0);
      }, 180);
    } else if ((isAtTop || isNotScrollable) && e.deltaY < -8) {
      if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
      setIsBouncing(true);
      setBounceOffset(20);
      bounceTimeoutRef.current = setTimeout(() => {
        setBounceOffset(0);
      }, 180);
    }
  };

  if (!item) return null;

  const currency = isRtl ? settings.currency : settings.currencyEn;
  const name = isRtl ? item.nameAr : item.nameEn;
  const description = isRtl ? item.descriptionAr : item.descriptionEn;

  // Toggle or select option
  const handleOptionToggle = (
    groupId: string,
    groupName: string,
    optId: string,
    optName: string,
    optPrice: number,
    required: boolean
  ) => {
    if (required) {
      // Single selection for required
      setSelectedOptions((prev) => [
        ...prev.filter((o) => o.groupId !== groupId),
        { groupId, groupName, optionId: optId, optionName: optName, price: optPrice },
      ]);
    } else {
      // Multi selection for optional
      setSelectedOptions((prev) => {
        const exists = prev.some((o) => o.optionId === optId);
        if (exists) {
          return prev.filter((o) => o.optionId !== optId);
        } else {
          return [
            ...prev,
            { groupId, groupName, optionId: optId, optionName: optName, price: optPrice },
          ];
        }
      });
    }
  };

  // Calculate current unit price
  let unitPrice = selectedVariant ? selectedVariant.price : item.basePrice;
  selectedOptions.forEach((opt) => {
    unitPrice += opt.price;
  });
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    // Validate required option groups
    if (item.optionGroups) {
      for (const group of item.optionGroups) {
        if (group.required) {
          const selected = selectedOptions.some((o) => o.groupId === group.id);
          if (!selected) {
            setErrorMsg(
              isRtl
                ? `يرجى اختيار (${group.nameAr}) قبل الإضافة`
                : `Please select (${group.nameEn}) before adding`
            );
            return;
          }
        }
      }
    }

    addToCart(item, quantity, selectedVariant, selectedOptions, notes);
    onClose();
    // Flash open cart or show toast
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in touch-none"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-white/70 backdrop-blur-md rounded-full mx-auto absolute top-2.5 inset-x-0 z-30 pointer-events-none shadow-xs" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 shadow-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Unified Scrollable Container: holds image + details so touching anywhere scrolls the modal */}
        <div
          ref={scrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onWheel={handleWheel}
          className="overflow-y-auto flex-1 overscroll-contain min-h-0 touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Elastic animated wrapper that springs up and bounces back when scrolling past end */}
          <div
            style={{
              transform: `translate3d(0, ${bounceOffset}px, 0)`,
              transition: isBouncing
                ? "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                : "none",
              willChange: "transform",
            }}
          >
            {/* Item Header Image */}
            <div className="relative h-52 sm:h-60 w-full shrink-0 bg-stone-100">
              <img
                src={item.imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30" />
            </div>

            {/* Details */}
            <div className="p-5 space-y-5 text-stone-900">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900">{name}</h2>
                {item.originalPrice && item.originalPrice > item.basePrice && (
                  <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 animate-pulse">
                    <span>🔥</span>
                    <span>خصم {Math.round(((item.originalPrice - item.basePrice) / item.originalPrice) * 100)}%</span>
                  </span>
                )}
              </div>
              {item.originalPrice && item.originalPrice > item.basePrice && (
                <div className="flex items-center gap-2 mt-1.5 text-xs font-bold">
                  <span className="text-stone-400 line-through">
                    السعر السابق: {item.originalPrice.toLocaleString()} {currency}
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    وفرت {(item.originalPrice - item.basePrice).toLocaleString()} {currency}!
                  </span>
                </div>
              )}
              <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Variants (Sizes) */}
            {item.variants && item.variants.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="text-xs font-bold text-stone-700 block">
                  {isRtl ? "الحجم المطلوب:" : "Select Size:"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {item.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-start flex flex-col justify-between transition ${
                          isSelected
                            ? "border-[#780000] bg-red-50/50 text-[#780000] font-bold shadow-sm"
                            : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                        }`}
                      >
                        <span className="text-xs font-bold">{isRtl ? v.nameAr : v.nameEn}</span>
                        <span className="text-sm font-black mt-1">
                          {v.price} {currency}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Option Groups */}
            {item.optionGroups &&
              item.optionGroups.map((group) => (
                <div key={group.id} className="space-y-2 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">
                      {isRtl ? group.nameAr : group.nameEn}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        group.required
                          ? "bg-red-100 text-[#780000]"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {group.required ? t("required") : t("optional")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions.some((o) => o.optionId === opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() =>
                            handleOptionToggle(
                              group.id,
                              isRtl ? group.nameAr : group.nameEn,
                              opt.id,
                              isRtl ? opt.nameAr : opt.nameEn,
                              opt.price,
                              group.required
                            )
                          }
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? "border-[#780000] bg-red-50/50"
                              : "border-stone-200 hover:bg-stone-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                                isSelected
                                  ? "bg-[#780000] border-[#780000] text-white"
                                  : "border-stone-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-semibold text-stone-800">
                              {isRtl ? opt.nameAr : opt.nameEn}
                            </span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-xs font-bold text-[#780000]">
                              +{opt.price} {currency}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* Notes */}
            <div className="space-y-1.5 pt-3 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-700 block">
                {t("addNotes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={2}
                className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#780000] bg-stone-50"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Footer with quantity and add button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 active:scale-95 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-stone-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Submit button */}
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-[#780000] hover:bg-[#5c0000] text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-red-900/20 active:scale-98 transition"
          >
            <span>{t("addToCart")}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-black">
              {totalPrice} {currency}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

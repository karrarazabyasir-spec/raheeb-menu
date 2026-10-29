"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { RestaurantSettings } from "@/types";
import { LottiePreloader } from "@/components/LottiePreloader";

import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  Banknote,
  Clock,
  User,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface CartDrawerProps {
  settings: RestaurantSettings;
}

export function CartDrawer({ settings }: CartDrawerProps) {
  const router = useRouter();
  const { isRtl, t } = useLanguage();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    tableNumber,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupTime, setPickupTime] = useState("في أسرع وقت");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const currency = isRtl ? settings.currency : settings.currencyEn;

  // Coupon apply
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: couponCode.trim(), discount: data.discount });
        setCouponMsg({ text: `تم تطبيق الخصم بنجاح (-${data.discount} ${currency})`, error: false });
      } else {
        setAppliedCoupon(null);
        setCouponMsg({ text: data.message || "كود الخصم غير صالح", error: true });
      }
    } catch {
      setCouponMsg({ text: "تعذر التحقق من الكود", error: true });
    } finally {
      setCouponLoading(false);
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const serviceFee =
    settings.serviceFeePercent > 0
      ? Math.round(((afterDiscount * settings.serviceFeePercent) / 100) * 100) / 100
      : 0;

  const tax =
    settings.taxPercent > 0
      ? Math.round((((afterDiscount + serviceFee) * settings.taxPercent) / 100) * 100) / 100
      : 0;

  const total = Math.round((afterDiscount + serviceFee + tax) * 100) / 100;

  // Handle Order Submit
  const handleSubmitOrder = async () => {
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError(t("emptyCart"));
      return;
    }

    const isTableOrder = !!tableNumber;
    const finalOrderType = isTableOrder ? "table" : "takeaway";

    if (isTableOrder && !tableNumber) {
      setSubmitError(isRtl ? "يرجى تحديد أو إدخال رقم الطاولة" : "Please specify a table number");
      return;
    }

    if (!isTableOrder) {
      if (!customerName.trim() || !customerPhone.trim()) {
        setSubmitError(
          isRtl ? "الاسم ورقم الجوال مطلوبان لإتمام طلب التوصيل/السفري" : "Name and phone are required for delivery"
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type: finalOrderType,
        tableNumber: isTableOrder ? tableNumber : undefined,
        customerName: !isTableOrder ? customerName.trim() : undefined,
        customerPhone: !isTableOrder ? customerPhone.trim() : undefined,
        pickupTime: !isTableOrder ? pickupTime : undefined,
        cartItems: items,
        couponCode: appliedCoupon?.code,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "فشل إرسال الطلب");
        setIsSubmitting(false);
        return;
      }

      // Success: clear cart and redirect to live tracking page
      clearCart();
      setIsCartOpen(false);
      router.push(`/order/${data.id}`);
    } catch (err) {
      console.error(err);
      setSubmitError("حدث خطأ في الاتصال، يرجى المحاولة ثانية");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting && (
        <LottiePreloader
          text="جاري إرسال طلبكم للمطبخ والكاشير..."
          size={180}
          fullScreen
        />
      )}
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">

      <div
        className="w-full sm:max-w-md bg-white h-full flex flex-col shadow-2xl overflow-hidden animate-slide-left text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-[#780000] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <h2 className="text-base font-extrabold">{t("cart")}</h2>
            <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
              {items.length} {t("items")}
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-[#780000] mb-4">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-stone-800">{t("emptyCart")}</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">{t("startAdding")}</p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-6 px-6 py-2.5 rounded-xl bg-[#780000] text-white text-xs font-bold shadow-md hover:bg-[#5c0000] transition"
            >
              تصفح القائمة
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Automatic Order Context */}
            {tableNumber ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-red-950 font-black flex items-center justify-center text-sm shadow shrink-0">
                  {tableNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-stone-900">
                      طلب صالة (داخل المطعم)
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-900 block truncate mt-0.5">
                    طاولة رقم {tableNumber} (تحددت تلقائياً من رمز الـ QR)
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#780000]" />
                    <span className="text-xs font-bold text-stone-900">
                      طلب توصيل / سفري (عبر الرابط)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#780000]">
                    توصيل
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-stone-400 absolute top-3 right-3" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t("customerName") + " (مطلوب)"}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#780000] focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute top-3 right-3" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={t("customerPhone") + " (مطلوب)"}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#780000] focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-stone-400 absolute top-3 right-3" />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#780000] focus:outline-none"
                    >
                      <option value="في أسرع وقت">في أسرع وقت (خلال 20-30 دقيقة)</option>
                      <option value="بعد 45 دقيقة">بعد 45 دقيقة</option>
                      <option value="بعد ساعة">بعد ساعة</option>
                      <option value="بعد ساعة ونصف">بعد ساعة ونصف</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                الأصناف المختارة
              </span>
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-start gap-3"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.nameAr}
                    className="w-16 h-16 rounded-lg object-cover bg-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                        {isRtl ? item.nameAr : item.nameEn}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-stone-400 hover:text-red-600 transition p-1"
                        title="حذف الصنف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.selectedVariant && (
                      <span className="text-[11px] text-[#780000] font-semibold block">
                        {isRtl ? item.selectedVariant.nameAr : item.selectedVariant.nameEn}
                      </span>
                    )}

                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                        {item.selectedOptions.map((o) => o.optionName).join("، ")}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 line-clamp-1">
                        ملاحظة: {item.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-200/60">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-[#780000]">
                          {item.totalPrice}
                        </span>
                        <span className="text-[10px] text-stone-600">{currency}</span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-xs">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-stone-100 text-stone-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-stone-100 text-stone-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Box */}
            <div className="pt-2">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-stone-400 absolute top-3 right-3" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="كود الخصم (مثال: RAHEEB15)"
                    className="w-full text-xs pr-8 pl-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#780000] focus:outline-none uppercase font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                </button>
              </div>

              {couponMsg && (
                <p
                  className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${
                    couponMsg.error ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {couponMsg.error ? (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{couponMsg.text}</span>
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>{t("subtotal")}</span>
                <span className="font-bold">
                  {subtotal} {currency}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>{t("discount")}</span>
                  <span>
                    -{discountAmount} {currency}
                  </span>
                </div>
              )}

              {settings.serviceFeePercent > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>
                    {t("serviceFee")} ({settings.serviceFeePercent}%)
                  </span>
                  <span className="font-bold">
                    +{serviceFee} {currency}
                  </span>
                </div>
              )}

              {settings.taxPercent > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>
                    {t("tax")} ({settings.taxPercent}%)
                  </span>
                  <span className="font-bold">
                    +{tax} {currency}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-stone-900">
                <span className="font-extrabold text-sm">{t("total")}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#780000]">{total}</span>
                  <span className="text-xs font-bold text-stone-600">{currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Notice (Cash Only Guaranteed) */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
              <Banknote className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{t("payCashNotice")}</span>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        )}

        {/* Drawer Footer Action */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-stone-200 shrink-0">
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#780000] hover:bg-[#5c0000] text-white font-extrabold text-sm flex items-center justify-between shadow-xl shadow-red-900/20 active:scale-98 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-full flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري إرسال الطلب للمطبخ والكاشير...</span>
                </div>
              ) : (
                <>
                  <span>{t("checkout")}</span>
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-black">
                    {total} {currency}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}


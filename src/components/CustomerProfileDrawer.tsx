"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/context/CustomerContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { RestaurantSettings, SavedAddress } from "@/types";
import {
  X,
  ShoppingBag,
  Star,
  MapPin,
  Clock,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Plus,
  Send,
  ExternalLink,
  Phone,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface CustomerProfileDrawerProps {
  settings: RestaurantSettings | null;
}

export function CustomerProfileDrawer({ settings }: CustomerProfileDrawerProps) {
  const router = useRouter();
  const { isRtl } = useLanguage();
  const {
    isProfileOpen,
    setIsProfileOpen,
    activeProfileTab,
    setActiveProfileTab,
    savedOrders,
    savedReviews,
    addReview,
    deleteReview,
    savedAddresses,
    addAddress,
    deleteAddress,
    setDefaultAddress,
  } = useCustomer();

  const { addToCart, setIsCartOpen } = useCart();

  // Review Form State
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

  // Address Form State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newTitle, setNewTitle] = useState("المنزل");
  const [newArea, setNewArea] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);

  if (!isProfileOpen) return null;

  const brandColor = settings?.primaryColor || "#780000";
  const currency = isRtl ? (settings?.currency || "د.ع") : (settings?.currencyEn || "IQD");

  const availableTags = [
    "طعم لا يقاوم 🤤",
    "مشويات ساخنة وطازجة 🔥",
    "توصيل سريع ⚡",
    "تغليف مرتب ونظيف 📦",
    "خدمة ممتازة 🛎️",
    "أسعار مناسبة 💰",
  ];

  // Re-order handler: load items into cart
  const handleReorder = (order: typeof savedOrders[0]) => {
    order.items.forEach((item) => {
      addToCart(
        {
          id: item.menuItemId,
          categoryId: "reorder",
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          descriptionAr: "",
          descriptionEn: "",
          basePrice: item.unitPrice,
          imageUrl: item.imageUrl || "",
          tags: [],
          isAvailable: true,
        },
        item.quantity,
        item.variantName ? { id: "v", nameAr: item.variantName, nameEn: item.variantName, price: item.unitPrice } : undefined,
        [],
        item.selectedOptionsText || ""
      );
    });

    setIsProfileOpen(false);
    setIsCartOpen(true);
  };

  // Submit Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    addReview({
      rating,
      tags: selectedTags,
      comment: reviewComment.trim(),
    });

    setReviewComment("");
    setSelectedTags([]);
    setReviewSuccessMsg(true);
    setTimeout(() => setReviewSuccessMsg(false), 3000);
  };

  // Submit Address
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    if (!newArea.trim() || !newStreet.trim()) {
      setAddressError("يرجى إدخال اسم المنطقة وأقرب نقطة دالة");
      return;
    }

    addAddress({
      title: newTitle.trim() || "المنزل",
      area: newArea.trim(),
      street: newStreet.trim(),
      phone: newPhone.trim(),
      isDefault: savedAddresses.length === 0,
    });

    setNewArea("");
    setNewStreet("");
    setNewPhone("");
    setIsAddingAddress(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsProfileOpen(false)}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left">
        {/* Top Header */}
        <div
          style={{ backgroundColor: brandColor }}
          className="text-white p-4 flex items-center justify-between shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">حسابي وقائمتي</h2>
              <p className="text-[11px] text-white/80">طلباتك السابقة، تقييماتك، وعناوينك المحفوظة</p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs Bar */}
        <div className="bg-stone-100 p-1.5 border-b border-stone-200 flex text-xs font-bold gap-1">
          <button
            onClick={() => setActiveProfileTab("orders")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeProfileTab === "orders"
                ? "bg-white text-stone-900 shadow-xs font-black"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            <span>طلباتي ({savedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab("reviews")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeProfileTab === "reviews"
                ? "bg-white text-stone-900 shadow-xs font-black"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>آرائي ({savedReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab("addresses")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeProfileTab === "addresses"
                ? "bg-white text-stone-900 shadow-xs font-black"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>عناويني ({savedAddresses.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: PREVIOUS ORDERS */}
          {activeProfileTab === "orders" && (
            <div className="space-y-3">
              {savedOrders.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-800">لا توجد طلبات سابقة حتى الآن</h3>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    عند إتمام أي طلب من المينيو، سيتم حفظه تلقائياً هنا لتتمكن من تتبعه وإعادة طلبه بلمسة واحدة!
                  </p>
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    style={{ backgroundColor: brandColor }}
                    className="mt-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow hover:brightness-110 transition"
                  >
                    تصفح المينيو الآن
                  </button>
                </div>
              ) : (
                savedOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString("ar-IQ", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={order.id}
                      className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-3 shadow-2xs hover:border-amber-200 transition"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-900">
                            طلب #{order.orderNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700">
                            {order.type === "table" ? `طاولة ${order.tableNumber}` : "توصيل / سفري"}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </span>
                      </div>

                      {/* Items Summary */}
                      <div className="space-y-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-stone-700">
                            <span className="truncate">
                              {item.nameAr} {item.variantName ? `(${item.variantName})` : ""} × {item.quantity}
                            </span>
                            <span className="font-bold text-stone-900 shrink-0 mr-2">
                              {item.totalPrice} {currency}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total & Action Buttons */}
                      <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-stone-400 block font-medium">المجموع الإجمالي</span>
                          <span className="text-sm font-black text-stone-900">
                            {order.total} {currency}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/order/${order.id}`}
                            onClick={() => setIsProfileOpen(false)}
                            className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 transition flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>تتبع</span>
                          </Link>

                          <button
                            onClick={() => handleReorder(order)}
                            style={{ backgroundColor: brandColor }}
                            className="px-3 py-1.5 rounded-xl text-white text-xs font-bold hover:brightness-110 active:scale-95 transition flex items-center gap-1 shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>إعادة الطلب</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: MY REVIEWS */}
          {activeProfileTab === "reviews" && (
            <div className="space-y-4">
              {/* Form to submit a review */}
              <form
                onSubmit={handleSubmitReview}
                className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>ما رأيك في تجربة مطعم رهيب؟</span>
                  </h3>
                  <span className="text-[10px] font-bold text-amber-800">
                    {rating === 5 && "رهيب ومثالي! 😍"}
                    {rating === 4 && "ممتاز جداً 😋"}
                    {rating === 3 && "جيد 👍"}
                    {rating === 2 && "مقبول 🙂"}
                    {rating === 1 && "يحتاج تحسين 😕"}
                  </span>
                </div>

                {/* Stars Selector */}
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 transition transform hover:scale-115 active:scale-95"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "text-amber-500 fill-amber-500 drop-shadow"
                            : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Quick Feedback Tags */}
                <div>
                  <span className="text-[11px] font-bold text-stone-600 block mb-1.5">
                    اختر ما أعجبك:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => {
                            setSelectedTags((prev) =>
                              isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                            );
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                            isSelected
                              ? "bg-amber-500 text-stone-950 border-amber-500 shadow-2xs"
                              : "bg-white text-stone-700 border-stone-200 hover:border-amber-300"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="اكتب ملاحظاتك أو رأيك حول الطعام والخدمة..."
                    className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: brandColor }}
                  className="w-full py-2.5 text-white rounded-xl text-xs font-bold shadow hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الرأي والتقييم</span>
                </button>

                {reviewSuccessMsg && (
                  <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-100/80 p-2 rounded-xl flex items-center justify-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>شكراً لك! تم تسجيل رأيك وتقييمك بنجاح ✓</span>
                  </div>
                )}
              </form>

              {/* Past Reviews List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-500 block uppercase tracking-wider">
                  سجل آرائك السابقة ({savedReviews.length}):
                </span>

                {savedReviews.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    لم تشاركنا أي رأي سابق بعد. رأيك يهمنا دائماً!
                  </p>
                ) : (
                  savedReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-stone-200 rounded-2xl p-3 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? "text-amber-500 fill-amber-500" : "text-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => deleteReview(rev.id)}
                          className="text-stone-300 hover:text-red-500 p-1"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rev.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {rev.comment && (
                        <p className="text-xs text-stone-700 leading-relaxed font-normal">
                          &quot;{rev.comment}&quot;
                        </p>
                      )}

                      <span className="text-[10px] text-stone-400 block text-start">
                        {new Date(rev.createdAt).toLocaleDateString("ar-IQ", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeProfileTab === "addresses" && (
            <div className="space-y-3">
              {/* Header with Add Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">
                  العناوين المسجلة للتوصيل السريع
                </span>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة عنوان جديد</span>
                  </button>
                )}
              </div>

              {/* Add Address Form Modal / Inline */}
              {isAddingAddress && (
                <form
                  onSubmit={handleSaveAddress}
                  className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                    <span className="text-xs font-black text-stone-900">إضافة عنوان جديد</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {addressError && (
                    <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg font-bold">
                      {addressError}
                    </div>
                  )}

                  {/* Title pills */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      تسمية العنوان:
                    </label>
                    <div className="flex gap-2">
                      {["المنزل", "العمل / الدوام", "بيت الأهل"].map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setNewTitle(t)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                            newTitle === t
                              ? "bg-stone-900 text-white border-stone-900"
                              : "bg-white text-stone-600 border-stone-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      المنطقة (مثال: المنصور، الكرادة، حي الجامعة):
                    </label>
                    <input
                      type="text"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      placeholder="اسم المنطقة أو الحي *"
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#780000]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      الشارع وأقرب نقطة دالة:
                    </label>
                    <input
                      type="text"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      placeholder="مثال: قرب جامع الرحمن، مقابل صيدلية الرواد *"
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#780000]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      رقم هاتف إضافي أو مخصص لهذا العنوان (اختياري):
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="0770xxxxxxx"
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#780000]"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="flex-1 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      style={{ backgroundColor: brandColor }}
                      className="flex-1 py-2 text-white rounded-xl text-xs font-bold hover:brightness-110 transition shadow-xs"
                    >
                      حفظ العنوان
                    </button>
                  </div>
                </form>
              )}

              {/* Addresses List */}
              {savedAddresses.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs font-bold">
                  لا توجد عناوين محفوظة بعد. أضف عنوانك الأول لتسريع طلبات التوصيل!
                </div>
              ) : (
                savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white border rounded-2xl p-3.5 space-y-2 transition ${
                      addr.isDefault
                        ? "border-[#780000] shadow-xs ring-1 ring-[#780000]/20"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <h4 className="text-xs font-black text-stone-900">{addr.title}</h4>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            العنوان الافتراضي
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="text-stone-300 hover:text-red-600 p-1 transition"
                        title="حذف العنوان"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-stone-600 space-y-0.5 pr-2">
                      <p className="font-bold text-stone-800">{addr.area}</p>
                      <p className="text-stone-500">{addr.street}</p>
                      {addr.phone && (
                        <p className="text-[11px] text-stone-400 flex items-center gap-1 pt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{addr.phone}</span>
                        </p>
                      )}
                    </div>

                    {!addr.isDefault && (
                      <div className="pt-2 border-t border-stone-100 flex justify-end">
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-[11px] font-bold text-[#780000] hover:underline"
                        >
                          تعيين كعنوان افتراضي
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

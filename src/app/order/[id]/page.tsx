"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Order, RestaurantSettings } from "@/types";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { subscribeToLiveEvents } from "@/lib/realtime";
import { LottiePreloader } from "@/components/LottiePreloader";


import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  Receipt,
  RotateCcw,
  MessageCircle,
  Star,
  MapPin,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Bike,
  Send,
  Heart,
} from "lucide-react";

const PRESET_OPINIONS: Record<number, string[]> = {
  5: [
    "الأكل ساخن ولذيذ جداً 🔥",
    "التوصيل سريع ودقيق ⚡",
    "تغليف ممتاز ومحكم 📦",
    "مشويات رهيبة وطازجة 🥩",
    "تعامل راقي ومحترم 👏",
    "كميات راهية وممتازة 👑",
  ],
  4: [
    "الأكل لذيذ وطازج 👍",
    "التوصيل بوقت مناسب ⏰",
    "تغليف نظيف ومرتب 📦",
    "تجربة جميلة وسأكررها ✨",
    "الكميات مناسبة 🍽️",
  ],
  3: [
    "الأكل يحتاج حرارة أكثر 🍲",
    "تأخر وقت التوصيل قليلاً ⏳",
    "يحتاج تحسين التتبيلة 🧂",
    "الكمية أقل من المتوقع 🤏",
  ],
  2: [
    "الأكل وصل بارداً ❄️",
    "تأخر السائق كثيراً ⏰",
    "أصناف ناقصة أو غير مطابقة ❌",
    "التغليف سيء أو مسكوب 📦",
    "الطعم لم يكن بالمستوى 👎",
  ],
  1: [
    "الأكل وصل بارداً ❄️",
    "تأخر السائق كثيراً ⏰",
    "أصناف ناقصة أو غير مطابقة ❌",
    "التغليف غير لائق ومسكوب 📦",
    "الطعم سيء للغاية 👎",
    "تعامل المندوب غير لائق 🚫",
  ],
};

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  5: { text: "ممتاز ورهيب! 🔥", color: "text-amber-500 bg-amber-50 border-amber-200" },
  4: { text: "جيد جداً 👍", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  3: { text: "مقبول / عادي 👌", color: "text-blue-600 bg-blue-50 border-blue-200" },
  2: { text: "يحتاج تحسين 😕", color: "text-orange-600 bg-orange-50 border-orange-200" },
  1: { text: "تجربة سيئة 😞", color: "text-rose-600 bg-rose-50 border-rose-200" },
};

function OrderTrackingContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { isRtl, t } = useLanguage();

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [callMessage, setCallMessage] = useState<string | null>(null);

  const fetchOrderAndSettings = async (attempt = 1) => {
    try {
      const [orderRes, settingsRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch("/api/settings"),
      ]);
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrder(orderData);
        setFetchError(false);
        setLoading(false);
      } else {
        // If order is still synchronizing across serverless instances, retry smoothly
        if (attempt <= 4) {
          setTimeout(() => {
            fetchOrderAndSettings(attempt + 1);
          }, 700 * attempt);
          return;
        }
        setFetchError(true);
        setLoading(false);
      }
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }
    } catch (e) {
      console.error(e);
      if (attempt <= 4) {
        setTimeout(() => {
          fetchOrderAndSettings(attempt + 1);
        }, 700 * attempt);
        return;
      }
      setFetchError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndSettings();

    const statusRank: Record<string, number> = {
      received: 0,
      preparing: 1,
      ready: 2,
      out_for_delivery: 3,
      completed: 4,
      cancelled: 5,
    };

    const applyOrderUpdate = (newOrder: Order) => {
      setOrder((prev) => {
        if (!prev) return newOrder;
        // Prevent state regression: ignore stale packets with older status
        const prevRank = statusRank[prev.status] ?? 0;
        const newRank = statusRank[newOrder.status] ?? 0;
        if (newOrder.status !== "cancelled" && newRank < prevRank) {
          return prev;
        }
        return newOrder;
      });
      setFetchError(false);
    };

    // Poll every 4 seconds as a reliable backup to SSE
    const pollInterval = setInterval(() => {
      fetch(`/api/orders/${orderId}`)
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data && data.id === orderId) {
            applyOrderUpdate(data);
          }
        })
        .catch(() => {});
    }, 4000);

    // Supabase Realtime WebSocket subscription (<100ms instant updates)
    const unsubscribe = subscribeToLiveEvents((event, payload) => {
      if (event === "order_status_changed" && payload && payload.id === orderId) {
        applyOrderUpdate(payload);
      }
    });

    return () => {
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, [orderId]);


  const handleTableService = async (type: "call" | "bill") => {
    if (!order?.tableNumber) return;
    try {
      const res = await fetch("/api/tables/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: order.tableNumber, type }),
      });
      if (res.ok) {
        setCallMessage(
          type === "call"
            ? "تم إبلاغ النادل، سيصل لطاولتكم فوراً 🛎️"
            : "تم طلب الحساب، سيأتي النادل مع الفاتورة 🧾"
        );
        setTimeout(() => setCallMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleOpinionTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    const validTags = PRESET_OPINIONS[newRating] || [];
    setSelectedTags((prev) => prev.filter((t) => validTags.includes(t)));
  };

  const handleReviewSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!order || isSubmittingReview || reviewSent) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          orderType: order.type,
          rating,
          tags: selectedTags,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        setReviewSent(true);
        // Automatically close/redirect back to main menu after brief thank you
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf9] flex items-center justify-center">
        <LottiePreloader text="جاري جلب تفاصيل الطلب..." size={160} />
      </div>
    );
  }


  if (fetchError || !order || !settings) {
    return (
      <div className="min-h-screen bg-[#fdfbf9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-[#780000] mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-stone-900 mb-1">تعذر العثور على تفاصيل الطلب</h2>
        <p className="text-xs text-stone-600 mb-6 max-w-xs">
          ربما تم إرسال الطلب بنجاح وهو قيد المزامنة، أو أن رقم الطلب غير متوفر.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchOrderAndSettings();
            }}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-[#780000] hover:bg-red-950 text-white text-xs font-bold rounded-xl transition shadow"
          >
            العودة للمينيو
          </Link>
        </div>
      </div>
    );
  }


  const currency = isRtl ? settings.currency : settings.currencyEn;
  const isTable = order.type === "table";
  const isDelivery = order.type === "delivery";

  // Step progression
  const steps: { key: Order["status"]; label: string; icon: React.ReactNode }[] = isDelivery
    ? [
        { key: "received", label: "تم الاستلام", icon: <CheckCircle2 className="w-5 h-5" /> },
        { key: "preparing", label: "قيد التحضير", icon: <ChefHat className="w-5 h-5" /> },
        { key: "ready", label: "تم التجهيز", icon: <Sparkles className="w-5 h-5" /> },
        { key: "out_for_delivery", label: "مع السائق 🛵", icon: <Bike className="w-5 h-5" /> },
        { key: "completed", label: "تم التسليم", icon: <CheckCircle2 className="w-5 h-5" /> },
      ]
    : [
        { key: "received", label: "تم الاستلام", icon: <CheckCircle2 className="w-5 h-5" /> },
        { key: "preparing", label: "قيد التحضير", icon: <ChefHat className="w-5 h-5" /> },
        { key: "ready", label: "جاهز للتقديم/الاستلام", icon: <Sparkles className="w-5 h-5" /> },
        { key: "completed", label: "تم التسليم", icon: <CheckCircle2 className="w-5 h-5" /> },
      ];

  const getStepStatus = (stepKey: Order["status"]) => {
    const orderIndex = steps.findIndex((s) => s.key === order.status);
    const stepIndex = steps.findIndex((s) => s.key === stepKey);
    if (order.status === "cancelled") return "cancelled";
    if (stepIndex < orderIndex) return "completed";
    if (stepIndex === orderIndex) return "active";
    return "pending";
  };

  const whatsappUrl = getWhatsAppUrl(order, settings);

  return (
    <div className="min-h-screen bg-[#fdfbf9] text-stone-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#780000] text-white p-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-red-100 hover:text-white transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمينيو</span>
          </Link>
          <h1 className="text-sm font-extrabold text-amber-300">مطعم رهيب</h1>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
            طلب #{order.orderNumber}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full p-4 flex-1 space-y-4">
        {/* Floating Waiter Alert */}
        {callMessage && (
          <div className="bg-amber-400 text-stone-950 p-3 rounded-xl font-bold text-xs text-center shadow-md animate-bounce">
            {callMessage}
          </div>
        )}

        {/* Order Status Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm text-center space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              حالة الطلب المباشرة
            </span>
            <h2 className="text-xl font-black text-[#780000]">
              {order.status === "received" && "تم استلام طلبك بنجاح وفي انتظار التحضير"}
              {order.status === "preparing" && "الشيف يحضّر طلبك الآن بكل حب 🔥"}
              {order.status === "ready" &&
                (isDelivery
                  ? "طلبك جاهز بالمطعم وبانتظار السائق 📦"
                  : "طلبك جاهز ولذيذ! في طريقه إليك 🍽️")}
              {order.status === "out_for_delivery" && "طلبك خرج للتوصيل مع السائق الآن 🛵💨"}
              {order.status === "completed" && "تم تسليم الطلب، بالهناء والشفاء ❤️"}
              {order.status === "cancelled" && "تم إلغاء الطلب"}
            </h2>
            {order.cancelReason && (
              <p className="text-xs text-red-600 font-bold">سبب الإلغاء: {order.cancelReason}</p>
            )}
          </div>

          {/* Stepper */}
          {order.status !== "cancelled" && (
            <div className="relative py-4">
              <div className={`grid ${isDelivery ? "grid-cols-5" : "grid-cols-4"} gap-1.5`}>
                {steps.map((s) => {
                  const status = getStepStatus(s.key);
                  return (
                    <div key={s.key} className="flex flex-col items-center text-center gap-1.5">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                          status === "completed"
                            ? "bg-emerald-600 text-white"
                            : status === "active"
                            ? "bg-[#780000] text-amber-300 ring-4 ring-red-100 animate-pulse"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        {s.icon}
                      </div>
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold leading-tight ${
                          status === "active"
                            ? "text-[#780000] font-black"
                            : status === "completed"
                            ? "text-emerald-700"
                            : "text-stone-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery/Table Info Badge */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-around gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-stone-700 font-bold text-center">
              <MapPin className="w-4 h-4 text-[#780000] shrink-0" />
              <span>
                {isTable
                  ? `طاولة رقم ${order.tableNumber}`
                  : isDelivery
                  ? `توصيل: ${order.deliveryZoneName || "منازل"} - ${order.address}`
                  : `استلام مسبق (${order.customerName})`}
              </span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-1.5 text-stone-700 font-bold">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isTable
                  ? `التحضير: ~${settings.estimatedPreparationTimeMinutes} دقيقة`
                  : isDelivery
                  ? `الوقت المقدر: ~${settings.defaultDeliveryTime || "30-45"} دقيقة`
                  : `الموعد: ${order.pickupTime}`}
              </span>
            </div>
          </div>

          {/* WhatsApp Direct Link (wa.me) as required in specifications */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>إرسال تفاصيل الطلب إلى واتساب المطعم (مجاناً)</span>
            </a>
            <p className="text-[10px] text-stone-400 mt-1">
              * الطلب محفوظ في النظام تلقائياً، إرسال واتساب اختياري للتأكيد
            </p>
          </div>

          {/* Table Service Quick Buttons if Dine-In */}
          {isTable && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => handleTableService("call")}
                className="p-2.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Bell className="w-4 h-4 text-amber-600" />
                <span>استدعاء النادل</span>
              </button>
              <button
                onClick={() => handleTableService("bill")}
                className="p-2.5 rounded-xl bg-stone-100 hover:bg-emerald-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>طلب الحساب</span>
              </button>
            </div>
          )}
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            أصناف الفاتورة (الدفع نقداً)
          </h3>
          <div className="space-y-2 divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-start text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-stone-900">{item.nameAr}</span>
                    <span className="text-[#780000] font-bold">× {item.quantity}</span>
                  </div>
                  {item.variantName && (
                    <span className="text-[11px] text-stone-500 block">
                      الحجم: {item.variantName}
                    </span>
                  )}
                  {item.selectedOptionsText && (
                    <span className="text-[10px] text-stone-400 block">
                      {item.selectedOptionsText}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-[10px] text-amber-700 block bg-amber-50 px-1 rounded">
                      ملاحظة: {item.notes}
                    </span>
                  )}
                </div>
                <span className="font-bold text-stone-800">
                  {item.totalPrice} {currency}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 border-t border-stone-200 space-y-1 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>المجموع الفرعي</span>
              <span>{order.subtotal} {currency}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>خصم الكوبون</span>
                <span>-{order.discount} {currency}</span>
              </div>
            )}
            {order.deliveryFee && order.deliveryFee > 0 && (
              <div className="flex justify-between text-stone-700 font-bold">
                <span>أجرة التوصيل ({order.deliveryZoneName || "توصيل"})</span>
                <span>+{order.deliveryFee} {currency}</span>
              </div>
            )}
            {order.serviceFee > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>رسوم الخدمة</span>
                <span>+{order.serviceFee} {currency}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>الضريبة</span>
                <span>+{order.tax} {currency}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-black text-sm">
              <span>المجموع النهائي (نقداً)</span>
              <span className="text-lg text-[#780000]">{order.total} {currency}</span>
            </div>
          </div>
        </div>

        {/* Rating & Review Section (Active when order is completed) */}
        {order.status === "completed" && (
          <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-md text-right space-y-4 transition-all">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 mb-1">
                <Heart className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <h3 className="text-base font-black text-stone-900">
                كيف تقيّم تجربتك اليوم في مطعم رهيب؟
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                رأيك يهمنا ويسهم في تطوير وتحسين جودة طعامنا وخدمتنا
              </p>
            </div>

            {reviewSent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2 animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-black text-emerald-900">
                  شكراً لتقييمك ومشاركتنا رأيك! ❤️
                </h4>
                <p className="text-xs text-emerald-700 font-medium">
                  تم حفظ التقييم بنجاح، جاري إعادتك للقائمة الرئيسية...
                </p>
                <div className="w-24 h-1 bg-emerald-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-emerald-600 animate-[pulse_1s_infinite]"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Interactive Stars */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="p-1 hover:scale-125 active:scale-95 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= rating
                              ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                              : "text-stone-200 hover:text-amber-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {/* Rating Label Badge */}
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      RATING_LABELS[rating]?.color || "text-stone-700 bg-stone-100"
                    }`}
                  >
                    {RATING_LABELS[rating]?.text}
                  </span>
                </div>

                {/* Preset Opinions / Tags */}
                {PRESET_OPINIONS[rating] && PRESET_OPINIONS[rating].length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-stone-100">
                    <label className="text-xs font-bold text-stone-700 block">
                      اختر ما يعبر عن تجربتك (يمكنك اختيار أكثر من خيار):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_OPINIONS[rating].map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleOpinionTag(tag)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all text-right ${
                              isSelected
                                ? "bg-[#780000] text-white border-[#780000] shadow-sm scale-[1.02]"
                                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                            }`}
                          >
                            {isSelected ? `✓ ${tag}` : tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Comment Field */}
                <div className="space-y-1.5 pt-1 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-700 block">
                    ملاحظات أو تعليق إضافي (اختياري):
                  </label>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="اكتب ملاحظتك أو رأيك هنا لمساعدتنا على التطور..."
                    className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#780000]/20 focus:border-[#780000] transition"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3 px-4 rounded-xl bg-[#780000] hover:bg-[#5c0000] active:scale-[0.99] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال التقييم...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال التقييم ومغادرة الصفحة</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Re-order or new order button */}
        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>طلب صنف آخر أو بدء طلب جديد</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <OrderTrackingContent />
      </React.Suspense>
    </LanguageProvider>
  );
}


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
} from "lucide-react";

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
  const [reviewSent, setReviewSent] = useState(false);
  const [callMessage, setCallMessage] = useState<string | null>(null);

  const fetchOrderAndSettings = async () => {
    try {
      const [orderRes, settingsRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch("/api/settings"),
      ]);
      if (orderRes.ok) {
        setOrder(await orderRes.json());
        setFetchError(false);
      } else {
        setFetchError(true);
      }
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }
    } catch (e) {
      console.error(e);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndSettings();

    const statusRank: Record<string, number> = {
      received: 0,
      preparing: 1,
      ready: 2,
      completed: 3,
      cancelled: 4,
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

  // Step progression
  const steps: { key: Order["status"]; label: string; icon: React.ReactNode }[] = [
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
              {order.status === "ready" && "طلبك جاهز ولذيذ! في طريقه إليك 🍽️"}
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
              <div className="grid grid-cols-4 gap-2">
                {steps.map((s) => {
                  const status = getStepStatus(s.key);
                  return (
                    <div key={s.key} className="flex flex-col items-center text-center gap-1.5">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
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
                        className={`text-[10px] font-bold leading-tight ${
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
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 flex items-center justify-around text-xs">
            <div className="flex items-center gap-1.5 text-stone-700 font-bold">
              <MapPin className="w-4 h-4 text-[#780000]" />
              <span>
                {isTable ? `طاولة رقم ${order.tableNumber}` : `استلام مسبق (${order.customerName})`}
              </span>
            </div>
            <div className="h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-1.5 text-stone-700 font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>
                {isTable
                  ? `التحضير: ~${settings.estimatedPreparationTimeMinutes} دقيقة`
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

        {/* Rating & Review */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center space-y-2">
          <span className="text-xs font-bold text-stone-700">كيف تقيّم تجربتك اليوم في مطعم رهيب؟</span>
          {reviewSent ? (
            <p className="text-xs text-emerald-700 font-bold">شكراً لتقييمك الرائع! رأيك يهمنا دائماً ❤️</p>
          ) : (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    setRating(star);
                    setReviewSent(true);
                  }}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-stone-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

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


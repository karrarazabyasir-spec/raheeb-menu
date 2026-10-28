"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order, OrderStatus } from "@/types";
import { playNotificationChime } from "@/lib/audio";
import { subscribeToLiveEvents } from "@/lib/realtime";

import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fetchKitchenOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data: Order[] = await res.json();
      // Only show active kitchen orders (preparing or received), sorted oldest first
      const kitchenOrders = data
        .filter((o) => o.status === "preparing" || o.status === "received")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setOrders(kitchenOrders);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setCurrentTime(Date.now());
    fetchKitchenOrders();

    // Timer heartbeat for elapsed counters
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);

    // Supabase Realtime WebSocket subscription (<100ms instant updates)
    const unsubscribe = subscribeToLiveEvents((event, payload) => {
      if (event === "new_order" && payload) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === payload.id);
          if (exists) return prev;
          return [...prev, payload].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        if (soundEnabled) playNotificationChime("order");
      } else if (event === "order_status_changed" && payload) {
        setOrders((prev) => {
          if (payload.status === "ready" || payload.status === "completed" || payload.status === "cancelled") {
            return prev.filter((o) => o.id !== payload.id);
          }
          return prev.map((o) => (o.id === payload.id ? payload : o));
        });
      }
    });

    // Periodic fast poll every 4 seconds as a secondary fallback
    const pollInterval = setInterval(() => {
      fetchKitchenOrders();
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, [soundEnabled]);


  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        if (status === "ready") {
          playNotificationChime("ready");
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
        } else {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status } : o))
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col font-sans select-none">
      {/* Top Tablet Navigation */}
      <header className="bg-stone-900 border-b border-stone-800 p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-[#780000] flex items-center justify-center text-white hover:scale-105 transition"
            title="المينيو"
          >
            <ChefHat className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>شاشة المطبخ (KDS)</span>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                {orders.length} طلبات قيد العمل
              </span>
            </h1>
            <p className="text-[11px] text-stone-400">مرتبة تلقائياً بالأقدم أولاً</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              soundEnabled ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-400"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "الصوت مفعّل" : "الصوت مكتوم"}</span>
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={fetchKitchenOrders}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Kitchen Grid */}
      <main className="flex-1 p-4 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center text-stone-500 space-y-3">
            <div className="w-20 h-20 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-stone-300">لا توجد طلبات معلقة في المطبخ</h2>
            <p className="text-xs text-stone-500">
              جميع الطلبات تم تجهيزها وتقديمها بالكامل! جاهزون لاستقبال الجديد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => {
              const elapsedMinutes = Math.floor(
                (currentTime - new Date(order.createdAt).getTime()) / 60000
              );
              const elapsedSeconds = Math.floor(
                ((currentTime - new Date(order.createdAt).getTime()) % 60000) / 1000
              );
              const isDelayed = elapsedMinutes >= 15;
              const isUrgent = elapsedMinutes >= 25;

              return (
                <div
                  key={order.id}
                  className={`bg-stone-900 rounded-3xl border-2 flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                    isUrgent
                      ? "border-red-600 ring-2 ring-red-900/50"
                      : isDelayed
                      ? "border-amber-500"
                      : "border-stone-800"
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3.5 flex items-center justify-between ${
                      isUrgent
                        ? "bg-red-950/80 text-red-200"
                        : isDelayed
                        ? "bg-amber-950/60 text-amber-200"
                        : "bg-stone-800/80 text-stone-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-stone-900/80 text-amber-300">
                          {order.type === "table" ? `طاولة ${order.tableNumber}` : "سفري / استلام"}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {new Date(order.createdAt).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Timer Badge */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-black ${
                        isUrgent
                          ? "bg-red-600 text-white animate-pulse"
                          : isDelayed
                          ? "bg-amber-500 text-stone-950"
                          : "bg-stone-950 text-stone-300 border border-stone-700"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {String(elapsedMinutes).padStart(2, "0")}:
                        {String(elapsedSeconds).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-4 flex-1 space-y-3 overflow-y-auto divide-y divide-stone-800/60">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pt-2.5 first:pt-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-base font-extrabold text-stone-100">
                            {item.nameAr}
                          </span>
                          <span className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center shrink-0">
                            ×{item.quantity}
                          </span>
                        </div>

                        {item.variantName && (
                          <span className="text-xs font-bold text-amber-300/90 block mt-0.5">
                            الحجم: {item.variantName}
                          </span>
                        )}

                        {item.selectedOptionsText && (
                          <p className="text-xs text-stone-400 mt-0.5">
                            ▫️ {item.selectedOptionsText}
                          </p>
                        )}

                        {/* Special Instructions / Allergies Callout */}
                        {item.notes && (
                          <div className="mt-1.5 p-2 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-black flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>ملاحظة: {item.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Large Touch Controls */}
                  <div className="p-3 bg-stone-950 border-t border-stone-800 grid grid-cols-1 gap-2">
                    {order.status === "received" ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "preparing")}
                        className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                      >
                        <ChefHat className="w-5 h-5" />
                        <span>بدأ التحضير الآن 👨‍🍳</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "ready")}
                        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                      >
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        <span>تم تجهيز الطلب بالكامل (جاهز) 🍽️</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

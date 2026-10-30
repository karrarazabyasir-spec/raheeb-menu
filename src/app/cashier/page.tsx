"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Order, OrderStatus, RestaurantSettings, Table, WaiterCall, MenuItem } from "@/types";
import { playNotificationChime } from "@/lib/audio";
import { ThermalReceipt } from "@/components/ThermalReceipt";
import { subscribeToLiveEvents } from "@/lib/realtime";

import {
  Bell,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Utensils,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  Receipt,
  Slash,
  DollarSign,
  TrendingUp,
  LayoutGrid,
  ListOrdered,
  ChefHat,
  Volume2,
  VolumeX,
  Bike,
  Share2,
  Navigation,
  Phone,
} from "lucide-react";
import { getDriverWhatsAppUrl } from "@/lib/whatsapp";

export default function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  const [activeTab, setActiveTab] = useState<"orders" | "tables" | "menu_toggle">("orders");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Printing State
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<"customer" | "kitchen">("customer");

  // Rejection/Cancellation modal
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Manual Order Modal
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualTableNumber, setManualTableNumber] = useState("1");
  const [manualOrderType, setManualOrderType] = useState<"table" | "takeaway">("table");
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = useState("");
  const [manualSelectedItems, setManualSelectedItems] = useState<{ [itemId: string]: number }>({});

  const fetchData = async () => {
    try {
      const [ordRes, tblRes, setRes, menuRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/tables"),
        fetch("/api/settings"),
        fetch("/api/menu"),
      ]);
      const [ordData, tblData, setData, menuData] = await Promise.all([
        ordRes.json(),
        tblRes.json(),
        setRes.json(),
        menuRes.json(),
      ]);
      setOrders(ordData);
      setTables(tblData.tables || []);
      setWaiterCalls(tblData.waiterCalls || []);
      setSettings(setData);
      setMenuItems(menuData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();

    // Supabase Realtime WebSocket subscription (<100ms instant updates)
    const unsubscribe = subscribeToLiveEvents((event, payload) => {
      if (event === "new_order" && payload) {
        setOrders((prev) => [payload, ...prev.filter((o) => o.id !== payload.id)]);
        if (soundEnabled) playNotificationChime("order");
      } else if (event === "order_status_changed" && payload) {
        setOrders((prev) => prev.map((o) => (o.id === payload.id ? payload : o)));
      } else if (event === "waiter_called") {
        fetchData();
        if (soundEnabled) playNotificationChime("call");
      } else if (event === "menu_updated") {
        if (payload && payload.id) {
          setMenuItems((prev) =>
            prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i))
          );
        } else {
          fetchData();
        }
      } else if (event === "table_updated" || event === "waiter_dismissed") {
        fetchData();
      }
    });

    // Periodic fast poll every 4 seconds as a secondary fallback
    const interval = setInterval(() => {
      fetchData();
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [soundEnabled]);


  // Update order status
  const handleUpdateStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancelReason: reason }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Close Table & Clear Balance
  const handleCloseTable = async (tableNumber: number) => {
    try {
      const res = await fetch("/api/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber, status: "empty", activeOrderId: null }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dismiss Waiter Call
  const handleDismissCall = async (callId: string) => {
    try {
      await fetch("/api/tables/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  // Toggle item availability (نفد)
  const handleToggleItem = async (itemId: string, currentAvailable: boolean) => {
    const newAvailable = !currentAvailable;
    setTogglingItemId(itemId);

    // 1. Instant optimistic update so the button updates immediately
    setMenuItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isAvailable: newAvailable } : i))
    );

    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_availability", isAvailable: newAvailable }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMenuItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, ...updated } : i))
        );
      } else {
        // Rollback on non-ok response
        setMenuItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isAvailable: currentAvailable } : i))
        );
      }
    } catch (e) {
      console.error(e);
      // Rollback on network error
      setMenuItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isAvailable: currentAvailable } : i))
      );
    } finally {
      setTogglingItemId(null);
    }
  };

  // Trigger Thermal Print
  const handlePrint = (order: Order, type: "customer" | "kitchen") => {
    setSelectedPrintOrder(order);
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Create Manual Order
  const handleCreateManualOrder = async () => {
    const selectedList = Object.entries(manualSelectedItems).filter(([_, qty]) => qty > 0);
    if (selectedList.length === 0) {
      alert("يرجى اختيار صنف واحد على الأقل");
      return;
    }

    const cartItems = selectedList.map(([itemId, qty]) => {
      const dbItem = menuItems.find((i) => i.id === itemId)!;
      return {
        cartItemId: `manual-${itemId}`,
        menuItemId: itemId,
        nameAr: dbItem.nameAr,
        nameEn: dbItem.nameEn,
        imageUrl: dbItem.imageUrl,
        selectedOptions: [],
        unitPrice: dbItem.basePrice,
        quantity: qty,
        totalPrice: dbItem.basePrice * qty,
      };
    });

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: manualOrderType,
          tableNumber: manualOrderType === "table" ? Number(manualTableNumber) : undefined,
          customerName: manualOrderType === "takeaway" ? manualCustomerName : undefined,
          customerPhone: manualOrderType === "takeaway" ? manualCustomerPhone : undefined,
          cartItems,
        }),
      });
      if (res.ok) {
        setShowManualOrderModal(false);
        setManualSelectedItems({});
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations for today's summary
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayRevenue = todayOrders
    .filter((o) => o.status === "completed" || o.status === "ready" || o.status === "preparing" || o.status === "out_for_delivery")
    .reduce((sum, o) => sum + o.total, 0);
  const activeOrdersCount = orders.filter(
    (o) => o.status === "received" || o.status === "preparing" || o.status === "ready" || o.status === "out_for_delivery"
  ).length;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Hidden print receipt rendered when window.print() is called */}
      <ThermalReceipt order={selectedPrintOrder} settings={settings} type={printType} />

      {/* Top Navbar */}
      <header className="bg-[#780000] text-white p-3.5 shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-lg bg-amber-400 text-red-950 font-black flex items-center justify-center text-sm shadow hover:scale-105 transition"
            title="المينيو"
          >
            ر
          </Link>
          <div>
            <h1 className="text-base font-extrabold flex items-center gap-2">
              <span>شاشة الكاشير والصالة</span>
              <span className="text-[10px] bg-red-900 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                مباشر (Live)
              </span>
            </h1>
            <p className="text-[11px] text-red-200">إدارة الطلبات، الحسابات، والطاولات</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              soundEnabled ? "bg-amber-500 text-red-950" : "bg-red-900/60 text-white"
            }`}
            title="تفعيل/تعطيل التنبيه الصوتي"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "الصوت مفعّل" : "الصوت مكتوم"}</span>
          </button>

          <button
            onClick={() => setShowManualOrderModal(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>طلب يدوي جديد</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Daily Metrics Bar */}
      <div className="bg-white border-b border-stone-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">إجمالي نقد اليوم:</span>
              <span className="text-base font-black text-[#780000]">
                {todayRevenue} {settings?.currency || "ر.س"}
              </span>
            </div>
            <div className="h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-2">
              <span className="text-stone-500">طلبات اليوم:</span>
              <span className="font-bold text-stone-900">{todayOrders.length} طلب</span>
            </div>
            <div className="h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-2">
              <span className="text-stone-500">الطلبات النشطة:</span>
              <span className="font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                {activeOrdersCount} قيد المتابعة
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "orders" ? "bg-white text-[#780000] shadow-xs" : "text-stone-600"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>الطلبات الحية ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "tables" ? "bg-white text-[#780000] shadow-xs" : "text-stone-600"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>خريطة الطاولات ({tables.length})</span>
              {waiterCalls.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("menu_toggle")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "menu_toggle" ? "bg-white text-[#780000] shadow-xs" : "text-stone-600"
              }`}
            >
              <Slash className="w-3.5 h-3.5" />
              <span>إيقاف صنف «نفد»</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* Waiter Calls Alert Bar if any call is pending */}
        {waiterCalls.length > 0 && (
          <div className="mb-4 bg-amber-500 text-stone-950 p-3 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 fill-stone-950" />
              <span className="font-extrabold text-sm">
                تنبيه نداء طاولات ({waiterCalls.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {waiterCalls.map((call) => (
                  <span
                    key={call.id}
                    className="bg-stone-950 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5"
                  >
                    <span>طاولة {call.tableNumber}</span>
                    <span className="text-[10px] text-white">
                      ({call.type === "call" ? "استدعاء نادل" : "طلب حساب"})
                    </span>
                    <button
                      onClick={() => handleDismissCall(call.id)}
                      className="text-stone-300 hover:text-white underline text-[10px]"
                    >
                      إلغاء التنبيه ✓
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: ORDERS LIST */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { key: "all", label: "جميع الطلبات" },
                  { key: "received", label: "جديد / انتظار" },
                  { key: "preparing", label: "قيد التحضير" },
                  { key: "ready", label: "جاهز للتقديم" },
                  { key: "out_for_delivery", label: "مع السائق 🛵" },
                  { key: "completed", label: "مكتمل" },
                  { key: "cancelled", label: "ملغي" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      statusFilter === f.key
                        ? "bg-[#780000] text-white shadow-xs"
                        : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1.5 text-xs">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    typeFilter === "all" ? "bg-stone-800 text-white" : "bg-white text-stone-600"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setTypeFilter("table")}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    typeFilter === "table" ? "bg-stone-800 text-white" : "bg-white text-stone-600"
                  }`}
                >
                  طاولات
                </button>
                <button
                  onClick={() => setTypeFilter("takeaway")}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    typeFilter === "takeaway" ? "bg-stone-800 text-white" : "bg-white text-stone-600"
                  }`}
                >
                  استلام خارجي
                </button>
                <button
                  onClick={() => setTypeFilter("delivery")}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    typeFilter === "delivery" ? "bg-stone-800 text-white" : "bg-white text-stone-600"
                  }`}
                >
                  توصيل 🛵
                </button>
              </div>
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-stone-400 font-bold text-sm">
                لا توجد طلبات مطابقة للفلتر المحدد
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const isNew = order.status === "received";
                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl p-4 border flex flex-col justify-between shadow-xs transition-all ${
                        isNew
                          ? "border-[#780000] ring-2 ring-red-100"
                          : "border-stone-200"
                      }`}
                    >
                      {/* Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-stone-900">
                                طلب #{order.orderNumber}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  order.type === "table"
                                    ? "bg-amber-100 text-amber-900"
                                    : order.type === "delivery"
                                    ? "bg-purple-100 text-purple-900"
                                    : "bg-blue-100 text-blue-900"
                                }`}
                              >
                                {order.type === "table"
                                  ? `طاولة ${order.tableNumber}`
                                  : order.type === "delivery"
                                  ? `🛵 توصيل (${order.deliveryZoneName || "منازل"})`
                                  : "استلام (Takeaway)"}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-400">
                              {new Date(order.createdAt).toLocaleTimeString("ar-SA", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              order.status === "received"
                                ? "bg-red-100 text-[#780000]"
                                : order.status === "preparing"
                                ? "bg-amber-100 text-amber-800"
                                : order.status === "ready"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "out_for_delivery"
                                ? "bg-purple-100 text-purple-900 animate-pulse"
                                : order.status === "completed"
                                ? "bg-stone-100 text-stone-700"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {order.status === "received" && "جديد / انتظار"}
                            {order.status === "preparing" && "قيد التحضير"}
                            {order.status === "ready" && "جاهز"}
                            {order.status === "out_for_delivery" && "مع السائق 🛵"}
                            {order.status === "completed" && "مكتمل ومقفل"}
                            {order.status === "cancelled" && "ملغي"}
                          </span>
                        </div>

                        {/* Customer Info if takeaway */}
                        {order.type === "takeaway" && (
                          <div className="py-2 text-xs text-stone-600 bg-stone-50 rounded-lg px-2 mt-2">
                            <span className="font-bold">{order.customerName}</span> |{" "}
                            <span>{order.customerPhone}</span>
                            <span className="block text-[10px] text-amber-800 font-semibold mt-0.5">
                              وقت الاستلام: {order.pickupTime}
                            </span>
                          </div>
                        )}

                        {/* Customer Info & Dispatch if delivery */}
                        {order.type === "delivery" && (
                          <div className="py-2.5 px-3 text-xs text-stone-700 bg-purple-50/70 border border-purple-100 rounded-xl mt-2 space-y-1.5">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-purple-950 font-black">{order.customerName}</span>
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-purple-200"
                              >
                                <Phone className="w-3 h-3" />
                                <span dir="ltr">{order.customerPhone}</span>
                              </a>
                            </div>

                            <div className="text-[11px] text-stone-600">
                              <p><span className="font-bold text-stone-800">العنوان:</span> {order.address}</p>
                              {order.landmark && (
                                <p><span className="font-bold text-stone-800">أقرب دالة:</span> {order.landmark}</p>
                              )}
                              {order.driverNotes && (
                                <p className="text-amber-800 font-semibold bg-amber-50 p-1 rounded mt-1">
                                  📝 {order.driverNotes}
                                </p>
                              )}
                              {order.cashToPay && order.cashToPay > order.total && (
                                <p className="text-emerald-800 font-bold bg-emerald-50 p-1 rounded mt-1">
                                  💵 الزبون معه: {order.cashToPay} {settings?.currency} (الباقي: {order.cashToPay - order.total})
                                </p>
                              )}
                            </div>

                            {/* Driver Dispatch & Maps Actions */}
                            <div className="pt-1 flex gap-1.5">
                              {settings && (
                                <a
                                  href={getDriverWhatsAppUrl(order, settings)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs"
                                  title="إرسال تفاصيل الطلب للسائق عبر واتساب"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>إرسال للسائق (واتساب)</span>
                                </a>
                              )}

                              {order.lat && order.lng && (
                                <a
                                  href={`https://maps.google.com/?q=${order.lat},${order.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs"
                                  title="فتح موقع الزبون في خرائط Google"
                                >
                                  <Navigation className="w-3 h-3" />
                                  <span>الخريطة</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Items */}
                        <div className="py-3 space-y-1.5 text-xs">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-stone-900">{item.nameAr}</span>
                                <span className="text-[#780000] font-black mr-1">
                                  × {item.quantity}
                                </span>
                                {item.variantName && (
                                  <span className="text-[10px] text-stone-500 block">
                                    {item.variantName}
                                  </span>
                                )}
                                {item.selectedOptionsText && (
                                  <span className="text-[10px] text-stone-400 block">
                                    {item.selectedOptionsText}
                                  </span>
                                )}
                                {item.notes && (
                                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1 rounded block">
                                    ⚠️ {item.notes}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-stone-700">
                                {item.totalPrice} {settings?.currency}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-stone-100 space-y-2">
                        {/* Financial line */}
                        <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                          <span>
                            المجموع {order.deliveryFee ? `(شامل توصيل +${order.deliveryFee})` : "(نقداً)"}:
                          </span>
                          <span className="text-sm font-black text-[#780000]">
                            {order.total} {settings?.currency}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {order.status === "received" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order.id, "preparing")}
                                className="py-2 bg-[#780000] hover:bg-[#5c0000] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>قبول وإرسال للمطبخ</span>
                              </button>
                              <button
                                onClick={() => setCancelModalOrder(order)}
                                className="py-2 bg-stone-100 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رفض الطلب</span>
                              </button>
                            </>
                          )}

                          {order.status === "preparing" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "ready")}
                              className="col-span-2 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              <span>تعليم كـ "جاهز للتقديم"</span>
                            </button>
                          )}

                          {order.status === "ready" && (
                            order.type === "delivery" ? (
                              <button
                                onClick={() => handleUpdateStatus(order.id, "out_for_delivery")}
                                className="col-span-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Bike className="w-3.5 h-3.5" />
                                <span>تسليم للسائق (خرج للتوصيل 🛵)</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(order.id, "completed")}
                                className="col-span-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تسجيل استلام النقد وإتمام الطلب</span>
                              </button>
                            )
                          )}

                          {order.status === "out_for_delivery" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "completed")}
                              className="col-span-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>تم التسليم واستلام النقد من السائق ✓</span>
                            </button>
                          )}

                          {/* Print Buttons */}
                          <button
                            onClick={() => handlePrint(order, "customer")}
                            className="py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Printer className="w-3.5 h-3.5 text-stone-600" />
                            <span>فاتورة الزبون</span>
                          </button>
                          <button
                            onClick={() => handlePrint(order, "kitchen")}
                            className="py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#780000]" />
                            <span>تذكرة المطبخ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TABLES MAP */}
        {activeTab === "tables" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-stone-800">
                حالة الطاولات في الصالة والتراس والعائلات
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>فارغة</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>مشغولة</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>تطلب نادل</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>تطلب الحساب</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tables.map((table) => {
                const isOccupied = table.status !== "empty";
                const isCalling = table.status === "calling_waiter";
                const isRequestingBill = table.status === "requesting_bill";

                return (
                  <div
                    key={table.id}
                    className={`bg-white rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                      isRequestingBill
                        ? "border-purple-500 ring-2 ring-purple-100 bg-purple-50/20"
                        : isCalling
                        ? "border-amber-500 ring-2 ring-amber-100 bg-amber-50/20 animate-pulse"
                        : isOccupied
                        ? "border-blue-300 bg-blue-50/20"
                        : "border-stone-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500">{table.section}</span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isRequestingBill
                              ? "bg-purple-600"
                              : isCalling
                              ? "bg-amber-500"
                              : isOccupied
                              ? "bg-blue-600"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>
                      <h3 className="text-xl font-black text-stone-900 mt-1">
                        طاولة {table.number}
                      </h3>
                      <p className="text-[11px] font-bold mt-1 text-stone-600">
                        {isRequestingBill && "🧾 تطلب الحساب"}
                        {isCalling && "🛎️ استدعاء نادل"}
                        {table.status === "occupied" && "🍽️ مشغولة (طلب جاري)"}
                        {table.status === "empty" && "✅ فارغة ومتاحة"}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-stone-100 flex flex-col gap-1.5">
                      {isOccupied ? (
                        <button
                          onClick={() => handleCloseTable(table.number)}
                          className="w-full py-1.5 px-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition"
                        >
                          قفل الحساب وتفريغ الطاولة
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 text-center">جاهزة للزبائن</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TOGGLE MENU ITEM (نفد) */}
        {activeTab === "menu_toggle" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                يمكنك هنا بضغطة زر وضع أي صنف بحالة «نفد» أو إعادته للتوفر، وسينعكس فوراً عند كل الزبائن.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3 border border-stone-200 flex items-center justify-between gap-3 shadow-xs"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.nameAr}
                    className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{item.nameAr}</h4>
                    <span className="text-[11px] text-[#780000] font-bold">
                      {item.basePrice} {settings?.currency}
                    </span>
                  </div>

                  <button
                    disabled={togglingItemId === item.id}
                    onClick={() => handleToggleItem(item.id, item.isAvailable)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      item.isAvailable
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    } ${togglingItemId === item.id ? "opacity-60 cursor-wait" : ""}`}
                  >
                    {togglingItemId === item.id && (
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    {item.isAvailable ? "وضع «نفد»" : "إعادة للتوفر"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Cancel Order Reason Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <h3 className="text-sm font-black text-stone-900">
              رفض أو إلغاء طلب #{cancelModalOrder.orderNumber}
            </h3>
            <p className="text-xs text-stone-500">
              يرجى تسجيل سبب الإلغاء ليظهر للعميل في شاشة التتبع:
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="مثال: نفد الصنف المطلوب / عدم توفر طاولة"
              className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#780000] focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                تراجع
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(cancelModalOrder.id, "cancelled", cancelReason || "اعتذار المطعم");
                  setCancelModalOrder(null);
                  setCancelReason("");
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Creation Modal */}
      {showManualOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-stone-900">تسجيل طلب يدوي من الكاشير</h3>
              <button
                onClick={() => setShowManualOrderModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 text-xs">
              <div className="flex bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setManualOrderType("table")}
                  className={`flex-1 py-1.5 rounded-lg font-bold ${
                    manualOrderType === "table" ? "bg-[#780000] text-white" : "text-stone-600"
                  }`}
                >
                  طاولة داخلية
                </button>
                <button
                  type="button"
                  onClick={() => setManualOrderType("takeaway")}
                  className={`flex-1 py-1.5 rounded-lg font-bold ${
                    manualOrderType === "takeaway" ? "bg-[#780000] text-white" : "text-stone-600"
                  }`}
                >
                  استلام خارجي / سفري
                </button>
              </div>

              {manualOrderType === "table" ? (
                <div>
                  <label className="font-bold block mb-1">رقم الطاولة:</label>
                  <input
                    type="number"
                    value={manualTableNumber}
                    onChange={(e) => setManualTableNumber(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    placeholder="اسم العميل"
                    className="w-full p-2 border rounded-lg"
                  />
                  <input
                    type="tel"
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                    placeholder="رقم الهاتف"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">اختر الأصناف:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border p-2 rounded-xl">
                  {menuItems.map((item) => {
                    const qty = manualSelectedItems[item.id] || 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between py-1 border-b">
                        <span className="font-semibold">{item.nameAr}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setManualSelectedItems((prev) => ({
                                ...prev,
                                [item.id]: Math.max(0, qty - 1),
                              }))
                            }
                            className="w-6 h-6 bg-stone-100 rounded text-center"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold">{qty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setManualSelectedItems((prev) => ({
                                ...prev,
                                [item.id]: qty + 1,
                              }))
                            }
                            className="w-6 h-6 bg-stone-100 rounded text-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowManualOrderModal(false)}
                className="px-3 py-2 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateManualOrder}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#780000] text-white hover:bg-[#5c0000]"
              >
                حفظ وإرسال الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

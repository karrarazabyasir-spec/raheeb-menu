"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { RestaurantSettings } from "@/types";
import {
  Bell,
  Receipt,
  ShoppingBag,
  Globe,
  UtensilsCrossed,
  MapPin,
  Clock,
  Sparkles,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

interface HeaderProps {
  settings: RestaurantSettings;
}

export function Header({ settings }: HeaderProps) {
  const { lang, toggleLang, isRtl, t } = useLanguage();
  const { totalItemsCount, setIsCartOpen, tableNumber, setTableNumber, orderType, setOrderType } = useCart();
  const [isCalling, setIsCalling] = useState(false);
  const [callMessage, setCallMessage] = useState<string | null>(null);

  const handleTableService = async (type: "call" | "bill") => {
    if (!tableNumber) return;
    setIsCalling(true);
    try {
      const res = await fetch("/api/tables/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber, type }),
      });
      if (res.ok) {
        setCallMessage(
          type === "call"
            ? isRtl ? "تم إبلاغ النادل، سيصل إليكم فوراً 🛎️" : "Waiter notified, arriving shortly 🛎️"
            : isRtl ? "تم طلب الحساب، سيأتي النادل مع الفاتورة 🧾" : "Bill requested, waiter is on the way 🧾"
        );
        setTimeout(() => setCallMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalling(false);
    }
  };

  const brandColor = settings.primaryColor || "#780000";

  return (
    <header style={{ backgroundColor: brandColor }} className="sticky top-0 z-40 text-white shadow-md transition-all">
      {/* Top micro-bar for opening hours & phone */}
      <div className="bg-black/20 text-xs px-4 py-1.5 flex items-center justify-between text-white/90 border-b border-black/10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">{settings.openingHours}</span>
            <span className="sm:hidden">مفتوح الآن</span>
          </span>
          <span className="hidden md:flex items-center gap-1 text-white/80">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>{settings.address}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-white/80">
          {settings.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-1 hover:text-white transition text-[11px]"
            >
              <PhoneCall className="w-3 h-3 text-amber-300" />
              <span>{settings.phone}</span>
            </a>
          )}
        </div>
      </div>


      {/* Main Bar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-amber-400 overflow-hidden flex items-center justify-center text-stone-950 font-black shadow-md group-hover:scale-105 transition-transform">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <UtensilsCrossed className="w-5 h-5 text-stone-950" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-1.5 text-white">
              <span>{isRtl ? settings.name : settings.nameEn}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 inline" />
            </h1>
            <p className="text-[11px] text-white/80 font-medium line-clamp-1">
              {settings.description || (isRtl ? "مذاق المشويات الأصيل والتجربة الرهيبة" : "Authentic Grills & Shawarma")}
            </p>
          </div>
        </Link>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Table Badge or Mode Toggle */}
          {tableNumber ? (
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/15">
              <span className="text-xs font-bold px-2 py-1 bg-amber-500 text-red-950 rounded-md">
                طاولة {tableNumber}
              </span>
              <button
                onClick={() => handleTableService("call")}
                disabled={isCalling}
                title="استدعاء النادل"
                className="p-1.5 hover:bg-white/20 rounded-md transition text-white flex items-center gap-1 text-xs"
              >
                <Bell className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline text-xs">نادل</span>
              </button>
              <button
                onClick={() => handleTableService("bill")}
                disabled={isCalling}
                title="طلب الحساب"
                className="p-1.5 hover:bg-white/20 rounded-md transition text-white flex items-center gap-1 text-xs"
              >
                <Receipt className="w-4 h-4 text-emerald-300" />
                <span className="hidden sm:inline text-xs">الحساب</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-0.5 flex text-xs font-semibold">
              <button
                onClick={() => setOrderType("table")}
                className={`px-2.5 py-1 rounded-md transition ${
                  orderType === "table"
                    ? "bg-amber-500 text-red-950 shadow"
                    : "text-white/80 hover:text-white"
                }`}
              >
                طاولة
              </button>
              <button
                onClick={() => setOrderType("takeaway")}
                className={`px-2.5 py-1 rounded-md transition ${
                  orderType === "takeaway"
                    ? "bg-amber-500 text-red-950 shadow"
                    : "text-white/80 hover:text-white"
                }`}
              >
                استلام
              </button>
            </div>
          )}

          {/* Language Switch */}
          <button
            onClick={toggleLang}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center gap-1 text-xs font-bold border border-white/10"
            title="تغيير اللغة"
          >
            <Globe className="w-4 h-4 text-amber-300" />
            <span>{lang === "ar" ? "EN" : "عربي"}</span>
          </button>

          {/* Cart Floating / Header Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-red-950 font-bold shadow-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
            aria-label="عرض السلة"
          >
            <ShoppingBag className="w-5 h-5 text-red-950" />
            <span className="text-xs hidden sm:inline">{t("cart")}</span>
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#400000] text-amber-300 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Alert for Waiter Call */}
      {callMessage && (
        <div className="bg-amber-400 text-red-950 px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{callMessage}</span>
        </div>
      )}
    </header>
  );
}

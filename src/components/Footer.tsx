"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { RestaurantSettings } from "@/types";
import { Globe, Clock, MapPin, Phone, Sparkles } from "lucide-react";

interface FooterProps {
  settings: RestaurantSettings | null;
}

export function Footer({ settings }: FooterProps) {
  const { lang, toggleLang, isRtl } = useLanguage();

  if (!settings) return null;

  return (
    <footer className="mt-12 bg-white text-stone-600 border-t border-stone-200 pb-24 sm:pb-12 pt-8">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center space-y-6">
        {/* Brand */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400 overflow-hidden flex items-center justify-center text-stone-950 font-black shadow-xs shrink-0">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-xs">ر</span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-stone-900">
              {isRtl ? settings.name : settings.nameEn}
            </h3>
          </div>
          <p className="text-xs text-stone-500 max-w-sm">
            {settings.description || (isRtl ? "مذاق المشويات الأصيل والتجربة الرهيبة" : "Authentic Grills & Shawarma")}
          </p>
        </div>

        {/* Quick Contact & Info */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
          {settings.openingHours && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#780000] shrink-0" />
              <span>{settings.openingHours}</span>
            </div>
          )}
          {settings.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#780000] shrink-0" />
              <span>{settings.address}</span>
            </div>
          )}
          {settings.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-1.5 hover:text-[#780000] transition"
            >
              <Phone className="w-3.5 h-3.5 text-[#780000] shrink-0" />
              <span dir="ltr">{settings.phone}</span>
            </a>
          )}
        </div>

        {/* Language Switcher Button in Footer */}
        <div className="pt-2">
          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition text-xs font-bold border border-stone-200 active:scale-95 shadow-xs"
            title="تبديل اللغة / Change Language"
          >
            <Globe className="w-4 h-4 text-[#780000]" />
            <span>{lang === "ar" ? "English / الإنجليزية" : "العربية / Arabic"}</span>
          </button>
        </div>

        {/* Copyright */}
        <div className="text-[11px] text-stone-400 border-t border-stone-100 pt-4 w-full">
          <p>© {new Date().getFullYear()} {isRtl ? settings.name : settings.nameEn} — المينيو الإلكتروني الذكي</p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "ar" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    restaurantName: "مطعم رهيب",
    menu: "المينيو",
    cart: "السلة",
    items: "أصناف",
    total: "المجموع",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    serviceFee: "رسوم الخدمة",
    tax: "الضريبة",
    checkout: "تأكيد وإرسال الطلب",
    payCashNotice: "الدفع نقداً دائماً عند الاستلام أو الكاشير",
    tableOrder: "طلب طاولة",
    takeawayOrder: "طلب استلام خارجي",
    tableNumber: "رقم الطاولة",
    customerName: "اسم العميل",
    customerPhone: "رقم الجوال",
    pickupTime: "وقت الاستلام المتوقع",
    asap: "في أسرع وقت",
    addNotes: "ملاحظات إضافية على الطلب (مثل: بدون بصل)",
    notesPlaceholder: "اكتب ملاحظتك هنا...",
    emptyCart: "سلتك فارغة حالياً",
    startAdding: "تصفح المينيو وأضف أشهى المأكولات",
    popular: "الأكثر طلباً",
    spicy: "حار",
    vegetarian: "نباتي",
    new: "جديد",
    soldOut: "نفد مؤقتاً",
    addToCart: "إضافة للطلب",
    selectOptions: "تخصيص الصنف",
    required: "إلزامي",
    optional: "اختياري",
    callWaiter: "استدعاء النادل",
    requestBill: "طلب الحساب",
    orderTracking: "تتبع حالة الطلب",
    orderNumber: "رقم الطلب",
    sendWhatsApp: "إرسال نسخة عبر واتساب",
    searchPlaceholder: "ابحث عن طبق، مشويات، شاورما...",
    allCategories: "الكل",
    cashierScreen: "شاشة الكاشير",
    kitchenScreen: "شاشة المطبخ",
    adminPanel: "لوحة المالك",
    statusReceived: "تم استلام الطلب",
    statusPreparing: "جاري التحضير",
    statusReady: "جاهز للاستلام/التقديم",
    statusCompleted: "تم التسليم",
    statusCancelled: "تم الإلغاء",
    applyCoupon: "تطبيق الكوبون",
    couponCode: "كود الخصم",
    cashier: "الكاشير",
    kitchen: "المطبخ",
    reorder: "إعادة الطلب",
  },
  en: {
    restaurantName: "Raheeb Restaurant",
    menu: "Menu",
    cart: "Cart",
    items: "items",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    serviceFee: "Service Fee",
    tax: "Tax",
    checkout: "Confirm & Submit Order",
    payCashNotice: "Cash payment only upon receipt or at cashier",
    tableOrder: "Dine-in (Table)",
    takeawayOrder: "Takeaway",
    tableNumber: "Table Number",
    customerName: "Customer Name",
    customerPhone: "Phone Number",
    pickupTime: "Pickup Time",
    asap: "As soon as possible",
    addNotes: "Special instructions (e.g. no onions)",
    notesPlaceholder: "Type your request here...",
    emptyCart: "Your cart is currently empty",
    startAdding: "Browse our delicious menu and pick your dishes",
    popular: "Popular",
    spicy: "Spicy",
    vegetarian: "Veggie",
    new: "New",
    soldOut: "Sold Out",
    addToCart: "Add to Order",
    selectOptions: "Customize",
    required: "Required",
    optional: "Optional",
    callWaiter: "Call Waiter",
    requestBill: "Request Bill",
    orderTracking: "Track Order",
    orderNumber: "Order #",
    sendWhatsApp: "Send via WhatsApp",
    searchPlaceholder: "Search for grills, shawarma, appetizers...",
    allCategories: "All",
    cashierScreen: "Cashier Screen",
    kitchenScreen: "Kitchen Screen",
    adminPanel: "Admin Panel",
    statusReceived: "Order Received",
    statusPreparing: "Preparing in Kitchen",
    statusReady: "Ready for Serving / Pickup",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    applyCoupon: "Apply Coupon",
    couponCode: "Promo Code",
    cashier: "Cashier",
    kitchen: "Kitchen",
    reorder: "Order Again",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
  isRtl: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("raheeb_lang") as Language;
    if (saved === "ar" || saved === "en") {
      setLangState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("raheeb_lang", newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const toggleLang = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  const t = (key: string): string => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, isRtl: lang === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

"use client";

import React, { useState } from "react";
import { RestaurantSettings, StaffUser } from "@/types";
import { Lock, User, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, ChefHat } from "lucide-react";

interface AdminLoginFormProps {
  settings: RestaurantSettings | null;
  onLoginSuccess: (user: StaffUser) => void;
}

function normalizeDigits(str: string): string {
  return String(str || "")
    .replace(/[٠۰]/g, "0")
    .replace(/[١۱]/g, "1")
    .replace(/[٢۲]/g, "2")
    .replace(/[٣۳]/g, "3")
    .replace(/[٤۴]/g, "4")
    .replace(/[٥۵]/g, "5")
    .replace(/[٦۶]/g, "6")
    .replace(/[٧۷]/g, "7")
    .replace(/[٨۸]/g, "8")
    .replace(/[٩۹]/g, "9")
    .trim();
}

export function AdminLoginForm({ settings, onLoginSuccess }: AdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const brandColor = settings?.primaryColor || "#780000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: normalizeDigits(username.trim().toLowerCase()),
          password: normalizeDigits(password.trim()),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      onLoginSuccess(data.user);
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى التحقق من اتصالك");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-900 via-stone-950 to-black text-stone-100 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 text-stone-950 font-black text-3xl overflow-hidden border-2 border-amber-300">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              settings?.name?.charAt(0) || "ر"
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>{settings?.name || "مطعم رهيب"}</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-stone-400 font-bold mt-1">
              تسجيل الدخول إلى لوحة التحكم والإدارة
            </p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 block">
                اسم المستخدم:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute top-3.5 right-3.5" />
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin أو editor"
                  className="w-full pl-3 pr-10 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs font-bold font-mono focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 block">
                كلمة المرور:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute top-3.5 right-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs font-bold font-mono focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3.5 left-3.5 text-stone-500 hover:text-stone-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: brandColor }}
              className="w-full py-3.5 px-4 text-white rounded-xl text-xs font-black shadow-lg hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>دخول إلى لوحة التحكم</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Helper for Default Credentials */}
          <div className="pt-4 border-t border-stone-800/80 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block text-center">
              الحسابات الافتراضية للنظام (اضغط للتعبئة التلقائية)
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill("admin", "admin")}
                className="p-2.5 rounded-xl bg-stone-950/90 border border-stone-800 hover:border-amber-500/50 text-right transition flex flex-col gap-0.5 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 group-hover:underline">
                    👑 حساب المدير
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                    كامل
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">admin / admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("editor", "123")}
                className="p-2.5 rounded-xl bg-stone-950/90 border border-stone-800 hover:border-blue-500/50 text-right transition flex flex-col gap-0.5 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 group-hover:underline">
                    ✍️ مدخل البيانات
                  </span>
                  <span className="text-[9px] text-blue-400 bg-blue-950/60 px-1.5 py-0.2 rounded">
                    مينيو فقط
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">editor / 123</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-stone-600 font-bold">
          نظام إدارة مطعم رهيب © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}


"use client";

import React, { useState } from "react";
import { RestaurantSettings, StaffUser } from "@/types";
import { Lock, User, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, Key, AlertCircle, CheckCircle2 } from "lucide-react";

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

  // Recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccessMsg(null);

    if (!recoveryPin.trim() || !newPassword.trim()) {
      setRecoveryError("يرجى إدخال رمز أمان الطوارئ وكلمة المرور الجديدة");
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError("كلمتا المرور غير متطابقتين");
      return;
    }

    setIsRecovering(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: normalizeDigits(recoveryPin.trim()),
          newPassword: normalizeDigits(newPassword.trim()),
          username: "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRecoveryError(data.error || "فشلت عملية استعادة الحساب");
        return;
      }

      setRecoverySuccessMsg("تمت استعادة حساب المدير بنجاح! يمكنك الآن تسجيل الدخول.");
      setUsername("admin");
      setPassword(newPassword.trim());

      setTimeout(() => {
        setShowRecoveryModal(false);
        setRecoverySuccessMsg(null);
        setRecoveryPin("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch {
      setRecoveryError("تعذر الاتصال بالخادم، يرجى المحاولة ثانية");
    } finally {
      setIsRecovering(false);
    }
  };

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
                  dir="auto"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin أو editor (أو بالعربي: ادمن / محرر)"
                  className="w-full pl-3 pr-10 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs font-bold focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
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
                  dir="auto"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full pl-10 pr-10 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs font-bold focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
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

            {/* Helper Credential Info Box */}
            <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-3 text-[11px] text-stone-400 space-y-1.5">
              <div className="flex items-center justify-between text-stone-300 font-bold border-b border-stone-800/80 pb-1">
                <span>💡 بيانات تسجيل الدخول الافتراضية:</span>
                <span className="text-amber-400 text-[10px] font-sans">يقبل العربي والإنجليزية</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-bold">حساب المدير:</span>
                <span className="text-amber-300 font-mono">admin <span className="text-stone-600">/</span> admin <span className="text-stone-500 text-[10px] font-sans">(أو: ادمن)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-bold">حساب المحرر:</span>
                <span className="text-amber-300 font-mono">editor <span className="text-stone-600">/</span> 123 <span className="text-stone-500 text-[10px] font-sans">(أو: محرر)</span></span>
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

            {/* Forgot password trigger */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(true);
                  setRecoveryError(null);
                  setRecoverySuccessMsg(null);
                }}
                className="text-xs font-bold text-amber-400/90 hover:text-amber-300 transition underline underline-offset-4 cursor-pointer"
              >
                نسيت كلمة المرور؟ (استعادة برمز الطوارئ) 🔑
              </button>
            </div>
          </form>
        </div>

        {/* Master PIN Recovery Modal */}
        {showRecoveryModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-4 animate-fade-in text-right">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white">استعادة حساب المدير برمز الطوارئ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="text-stone-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed font-medium">
                أدخل رمز أمان الطوارئ (Master Recovery PIN) لتعيين كلمة مرور جديدة لحساب المدير فوراً بدون الحاجة لمراجعة المطور.
              </p>

              {recoveryError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{recoverySuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleRecoverSubmit} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300 block">
                    رمز أمان الطوارئ (Master PIN):
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-stone-500 absolute top-3.5 right-3.5" />
                    <input
                      type="password"
                      dir="ltr"
                      value={recoveryPin}
                      onChange={(e) => setRecoveryPin(e.target.value)}
                      placeholder="الرمز السري (الافتراضي: 998877)"
                      className="w-full pl-3 pr-10 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 text-xs font-mono font-bold focus:border-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300 block">
                    كلمة المرور الجديدة:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute top-3.5 right-3.5" />
                    <input
                      type="password"
                      dir="ltr"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الجديدة"
                      className="w-full pl-3 pr-10 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 text-xs font-mono font-bold focus:border-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300 block">
                    تأكيد كلمة المرور الجديدة:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute top-3.5 right-3.5" />
                    <input
                      type="password"
                      dir="ltr"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور"
                      className="w-full pl-3 pr-10 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 text-xs font-mono font-bold focus:border-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={isRecovering}
                    className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isRecovering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                        <span>جاري إعادة التعيين...</span>
                      </>
                    ) : (
                      <span>إعادة تعيين ودخول ✓</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-stone-600 font-bold">
          نظام إدارة مطعم رهيب © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}


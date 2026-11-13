"use client";

import React, { useState } from "react";
import { StaffUser, AdminRole } from "@/types";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Edit,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface StaffManagementTabProps {
  currentUser: StaffUser;
  staffUsers: StaffUser[];
  onRefreshStaff: () => Promise<void>;
  brandColor?: string;
}

export function StaffManagementTab({
  currentUser,
  staffUsers,
  onRefreshStaff,
  brandColor = "#780000",
}: StaffManagementTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AdminRole>("editor");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormRole("editor");
    setShowPassword(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: StaffUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword(user.password);
    setFormRole(user.role);
    setShowPassword(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      setErrorMsg("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (editingUser) {
        // Edit existing
        const res = await fetch("/api/staff", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingUser.id,
            name: formName.trim(),
            password: formPassword.trim(),
            role: formRole,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "فشل تعديل الحساب");
          return;
        }

        setSuccessMsg("تم تعديل بيانات الحساب بنجاح! ✓");
      } else {
        // Create new
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            username: formUsername.trim(),
            password: formPassword.trim(),
            role: formRole,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "فشل إضافة الحساب");
          return;
        }

        setSuccessMsg("تمت إضافة الحساب الجديد بنجاح! ✓");
      }

      await onRefreshStaff();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى المحاولة ثانية");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (user: StaffUser) => {
    if (user.id === currentUser.id) {
      alert("لا يمكنك حذف حسابك الحالي الذي تستخدمه لتسجيل الدخول!");
      return;
    }

    const confirmDelete = window.confirm(
      `هل أنت متأكد من حذف الحساب "${user.name}" (${user.username}) نهائياً؟`
    );
    if (!confirmDelete) return;

    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/staff?id=${user.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "فشل حذف الحساب");
        return;
      }

      setSuccessMsg(`تم حذف حساب "${user.name}" بنجاح`);
      await onRefreshStaff();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      alert("تعذر الاتصال بالخادم لحذف الحساب");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-stone-900">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>إدارة الحسابات والموظفين</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            إنشاء حسابات للمدراء الجدد ولمدخلي بيانات المينيو وتحديد صلاحياتهم بدقة
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{ backgroundColor: brandColor }}
          className="py-2.5 px-4 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة حساب جديد</span>
        </button>
      </div>

      {/* Roles Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Owner Role Card */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm">
              👑
            </span>
            <div>
              <h3 className="text-xs font-black text-amber-950">صلاحية المدير العام (Owner)</h3>
              <p className="text-[10px] text-amber-800 font-bold">صلاحيات مطلقة وشاملة للنظام</p>
            </div>
          </div>
          <ul className="text-[11px] text-stone-700 space-y-1 pr-2 list-disc list-inside">
            <li>الاطلاع على تقارير المبيعات والأرباح والإحصائيات المالية.</li>
            <li>تعديل إعدادات المطعم، أسعار التوصيل، الواتساب والشعار.</li>
            <li>إدارة حسابات الموظفين وإضافة مدراء ومدخلي بيانات جدد.</li>
          </ul>
        </div>

        {/* Editor Role Card */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm">
              ✍️
            </span>
            <div>
              <h3 className="text-xs font-black text-blue-950">صلاحية مدخل البيانات (Editor)</h3>
              <p className="text-[10px] text-blue-800 font-bold">مخصصة لتعبئة وتحديث المينيو فقط</p>
            </div>
          </div>
          <ul className="text-[11px] text-stone-700 space-y-1 pr-2 list-disc list-inside">
            <li>إضافة وتعديل أصناف الوجبات، الأسعار، الصور، والخيارات.</li>
            <li>إدارة الأقسام والتصنيفات وشارات التمييز.</li>
            <li className="text-rose-700 font-bold">
              🚫 محجوب عنه تماماً: تقارير الأرباح والمبيعات والإعدادات الحساسة.
            </li>
          </ul>
        </div>
      </div>

      {/* Users List Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-xs font-black text-stone-800">
            الحسابات المسجلة في النظام ({staffUsers.length})
          </h3>
          <span className="text-[11px] text-stone-500 font-medium">
            حسابك الحالي: <span className="font-bold text-stone-900">{currentUser.name}</span>
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {staffUsers.map((user) => {
            const isOwner = user.role === "owner";
            const isSelf = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                      isOwner
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-blue-100 text-blue-900 border border-blue-300"
                    }`}
                  >
                    {isOwner ? "👑" : "✍️"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-stone-900">{user.name}</h4>
                      {isSelf && (
                        <span className="text-[9px] font-black bg-stone-900 text-white px-2 py-0.5 rounded-full">
                          أنت (الحساب الحالي)
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          isOwner
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {isOwner ? "مدير عام" : "مدخل بيانات"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500 mt-1 flex-wrap">
                      <span>
                        اسم المستخدم:{" "}
                        <span className="font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded">
                          {user.username}
                        </span>
                      </span>
                      <span>
                        كلمة المرور:{" "}
                        <span className="font-mono font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                          {user.password}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-stone-600" />
                    <span>تعديل</span>
                  </button>

                  {!isSelf && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={deletingId === user.id}
                      className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === user.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{editingUser ? "تعديل بيانات الحساب" : "إضافة حساب موظف جديد"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">
                  الاسم الكامل (أو صفة الموظف) <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله (مدخل بيانات)"
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold focus:outline-hidden focus:border-[#780000]"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">
                  اسم المستخدم (لتسجيل الدخول) <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  disabled={!!editingUser}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="مثال: ahmed_menu"
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono focus:outline-hidden focus:border-[#780000] disabled:bg-stone-200 disabled:text-stone-500"
                  required
                />
                {editingUser && (
                  <p className="text-[10px] text-stone-500">اسم المستخدم لا يمكن تغييره بعد إنشائه.</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">
                  كلمة المرور <span className="text-red-500">*</span>:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold font-mono pl-10 focus:outline-hidden focus:border-[#780000]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-2.5 left-3 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-stone-700 block">
                  نوع الصلاحية <span className="text-red-500">*</span>:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole("editor")}
                    className={`p-3 rounded-xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                      formRole === "editor"
                        ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs">✍️ مدخل بيانات</span>
                      {formRole === "editor" && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-stone-500">تعديل المينيو والأسعار فقط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole("owner")}
                    className={`p-3 rounded-xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                      formRole === "owner"
                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs">👑 مدير عام</span>
                      {formRole === "owner" && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <span className="text-[10px] text-stone-500">وصول كامل للتقارير والإعدادات</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ backgroundColor: brandColor }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingUser ? "حفظ التعديلات" : "إضافة الحساب"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

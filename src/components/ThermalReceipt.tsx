"use client";

import React from "react";
import { Order, RestaurantSettings } from "@/types";

interface ThermalReceiptProps {
  order: Order | null;
  settings: RestaurantSettings | null;
  type?: "customer" | "kitchen";
}

export function ThermalReceipt({ order, settings, type = "customer" }: ThermalReceiptProps) {
  if (!order || !settings) return null;

  const isKitchen = type === "kitchen";
  const dateStr = new Date(order.createdAt).toLocaleString("ar-SA");

  return (
    <div className="hidden print:block print-receipt font-mono text-black text-start">
      {/* Header */}
      <div className="text-center pb-2 border-b border-black">
        <h2 className="text-base font-black">{settings.name}</h2>
        <p className="text-[10px]">{settings.address}</p>
        <p className="text-[10px]">هاتف: {settings.phone}</p>
        <div className="my-1 border-t border-dashed border-black" />
        <h3 className="text-sm font-black uppercase">
          {isKitchen ? "تذكرة المطبخ (KITCHEN TICKET)" : "فاتورة الحساب (RECEIPT)"}
        </h3>
        <p className="text-xs font-bold">طلب #{order.orderNumber}</p>
        <p className="text-[9px]">{dateStr}</p>
      </div>

      {/* Order info */}
      <div className="py-2 text-[11px] border-b border-dashed border-black space-y-0.5">
        <p>
          <span className="font-bold">نوع الطلب: </span>
          {order.type === "table" ? `طاولة رقم ${order.tableNumber}` : "استلام مسبق (Takeaway)"}
        </p>
        {order.type === "takeaway" && (
          <>
            <p>العميل: {order.customerName}</p>
            <p>الجوال: {order.customerPhone}</p>
            <p>الموعد: {order.pickupTime}</p>
          </>
        )}
      </div>

      {/* Items Table */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="flex justify-between font-black text-[11px] pb-1 border-b border-black">
          <span>الصنف</span>
          <span>الكمية</span>
          {!isKitchen && <span>الإجمالي</span>}
        </div>
        <div className="pt-1 space-y-1.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-[11px]">
              <div className="flex justify-between font-bold">
                <span className="flex-1">{item.nameAr}</span>
                <span className="w-8 text-center">× {item.quantity}</span>
                {!isKitchen && (
                  <span className="w-16 text-end">
                    {item.totalPrice} {settings.currency}
                  </span>
                )}
              </div>
              {item.variantName && (
                <p className="text-[9px] text-stone-700">▫️ الحجم: {item.variantName}</p>
              )}
              {item.selectedOptionsText && (
                <p className="text-[9px] text-stone-700">▫️ {item.selectedOptionsText}</p>
              )}
              {item.notes && (
                <p className="text-[10px] font-black underline">⚠️ ملاحظة: {item.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Financials (Only for customer receipt) */}
      {!isKitchen && (
        <div className="py-2 text-[11px] space-y-1 border-b border-black">
          <div className="flex justify-between">
            <span>المجموع الفرعي:</span>
            <span>
              {order.subtotal} {settings.currency}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>الخصم:</span>
              <span>
                -{order.discount} {settings.currency}
              </span>
            </div>
          )}
          {order.serviceFee > 0 && (
            <div className="flex justify-between">
              <span>رسوم الخدمة:</span>
              <span>
                +{order.serviceFee} {settings.currency}
              </span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between">
              <span>الضريبة:</span>
              <span>
                +{order.tax} {settings.currency}
              </span>
            </div>
          )}
          <div className="my-1 border-t border-black" />
          <div className="flex justify-between font-black text-sm">
            <span>المجموع النهائي:</span>
            <span>
              {order.total} {settings.currency}
            </span>
          </div>
          <p className="text-[10px] font-bold text-center mt-1">الدفع نقداً (CASH)</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 text-center text-[10px] space-y-0.5">
        <p>شكراً لزيارتكم مطعم رهيب</p>
        <p>نسعد بخدمتكم دائماً!</p>
      </div>
    </div>
  );
}

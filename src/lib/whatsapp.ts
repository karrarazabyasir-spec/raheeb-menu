import { Order, RestaurantSettings } from "@/types";

export function generateWhatsAppMessage(order: Order, settings: RestaurantSettings): string {
  const isTable = order.type === "table";
  const isDelivery = order.type === "delivery";
  
  let text = `مرحباً مطعم ${settings.name} 🍽️\n`;
  text += `تأكيد طلب جديد رقم: *#${order.orderNumber}*\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  
  if (isTable) {
    text += `📍 *نوع الطلب:* طلب طاولة\n`;
    text += `🪑 *رقم الطاولة:* ${order.tableNumber}\n`;
  } else if (isDelivery) {
    text += `🛵 *نوع الطلب:* توصيل للمنازل (Delivery)\n`;
    text += `👤 *الاسم:* ${order.customerName || "غير محدد"}\n`;
    text += `📱 *الهاتف:* ${order.customerPhone || "غير محدد"}\n`;
    text += `📍 *المنطقة:* ${order.deliveryZoneName || "توصيل"}\n`;
    text += `🏠 *العنوان:* ${order.address || "غير محدد"}\n`;
    if (order.landmark) {
      text += `🏛️ *أقرب نقطة دالة:* ${order.landmark}\n`;
    }
    if (order.lat && order.lng) {
      text += `🗺️ *رابط الموقع:* https://maps.google.com/?q=${order.lat},${order.lng}\n`;
    }
    if (order.cashToPay) {
      text += `💵 *المبلغ المتاح للصرف:* ${order.cashToPay} ${settings.currency}\n`;
    }
    if (order.driverNotes) {
      text += `📝 *ملاحظات التوصيل:* ${order.driverNotes}\n`;
    }
  } else {
    text += `🥡 *نوع الطلب:* طلب مسبق للاستلام (Takeaway)\n`;
    text += `👤 *الاسم:* ${order.customerName || "غير محدد"}\n`;
    text += `📱 *الهاتف:* ${order.customerPhone || "غير محدد"}\n`;
    text += `⏱️ *موعد الاستلام:* ${order.pickupTime || "في أسرع وقت"}\n`;
  }

  text += `━━━━━━━━━━━━━━━\n`;
  text += `📋 *تفاصيل الأصناف:*\n`;

  order.items.forEach((item, index) => {
    text += `${index + 1}. *${item.nameAr}* × ${item.quantity}`;
    if (item.variantName) {
      text += ` (${item.variantName})`;
    }
    text += ` = ${item.totalPrice} ${settings.currency}\n`;

    if (item.selectedOptionsText) {
      text += `   ▫️ إضافات: ${item.selectedOptionsText}\n`;
    }
    if (item.notes) {
      text += `   📝 ملاحظة: ${item.notes}\n`;
    }
  });

  text += `━━━━━━━━━━━━━━━\n`;
  text += `💰 *المجموع الفرعي:* ${order.subtotal} ${settings.currency}\n`;

  if (order.discount > 0) {
    text += `🏷️ *الخصم:* -${order.discount} ${settings.currency}\n`;
  }
  if (order.deliveryFee && order.deliveryFee > 0) {
    text += `🛵 *أجرة التوصيل:* +${order.deliveryFee} ${settings.currency}\n`;
  }
  if (order.serviceFee > 0) {
    text += `🛎️ *رسوم الخدمة:* +${order.serviceFee} ${settings.currency}\n`;
  }
  if (order.tax > 0) {
    text += `🏛️ *الضريبة:* +${order.tax} ${settings.currency}\n`;
  }

  text += `💵 *المجموع الكلي:* *${order.total} ${settings.currency}*\n`;
  text += `💳 *طريقة الدفع:* نقداً عند الاستلام/التوصيل 💵\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `شكراً لكم! 🙏`;

  return text;
}

export function getWhatsAppUrl(order: Order, settings: RestaurantSettings): string {
  const phone = settings.whatsapp.replace(/[^0-9]/g, "");
  const message = generateWhatsAppMessage(order, settings);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Message formatted specifically for the driver dispatch via WhatsApp
 */
export function generateDriverWhatsAppMessage(order: Order, settings: RestaurantSettings): string {
  let text = `🚀 *طلب توصيل - مطعم ${settings.name}*\n`;
  text += `📋 رقم الطلب: *#${order.orderNumber}*\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `👤 *الزبون:* ${order.customerName || "—"}\n`;
  text += `📞 *رقم الهاتف:* ${order.customerPhone || "—"}\n`;
  text += `📍 *المنطقة:* ${order.deliveryZoneName || "توصيل"}\n`;
  text += `🏠 *العنوان:* ${order.address || "—"}\n`;
  if (order.landmark) {
    text += `🏛️ *أقرب نقطة دالة:* ${order.landmark}\n`;
  }
  if (order.lat && order.lng) {
    text += `🗺️ *الموقع على الخريطة:* https://maps.google.com/?q=${order.lat},${order.lng}\n`;
  }
  if (order.driverNotes) {
    text += `📝 *ملاحظة التوصيل:* ${order.driverNotes}\n`;
  }
  text += `━━━━━━━━━━━━━━━\n`;
  text += `💵 *المبلغ المطلوب تحصيله كاش:*\n`;
  text += `👉 *${order.total} ${settings.currency}*\n`;
  if (order.cashToPay && order.cashToPay > order.total) {
    const change = order.cashToPay - order.total;
    text += `(الزبون لديه: ${order.cashToPay} ${settings.currency} — الباقي له: ${change} ${settings.currency})\n`;
  }
  text += `━━━━━━━━━━━━━━━\n`;
  text += `📦 *محتويات الطلب:*\n`;
  order.items.forEach((item, index) => {
    text += `${index + 1}. ${item.nameAr} × ${item.quantity}\n`;
  });
  text += `━━━━━━━━━━━━━━━\n`;
  text += `يرجى الانتباه والتأكد من استلام المبلغ بالكامل. بالتوفيق! 🛵💨`;

  return text;
}

export function getDriverWhatsAppUrl(order: Order, settings: RestaurantSettings, driverPhone?: string): string {
  const cleanPhone = driverPhone ? driverPhone.replace(/[^0-9]/g, "") : "";
  const message = generateDriverWhatsAppMessage(order, settings);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}


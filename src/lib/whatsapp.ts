import { Order, RestaurantSettings } from "@/types";

export function generateWhatsAppMessage(order: Order, settings: RestaurantSettings): string {
  const isTable = order.type === "table";
  const isDelivery = order.type === "delivery";

  const restaurantDisplayName = settings.name.startsWith("مطعم")
    ? settings.name
    : `مطعم ${settings.name}`;

  let text = `مرحباً ${restaurantDisplayName} 🍽️\n`;
  text += `طلب جديد رقم: *#${order.orderNumber}*\n`;
  text += `━━━━━━━━━━━━━━━\n`;

  if (isTable) {
    text += `📍 *نوع الطلب:* طلب طاولة\n`;
    text += `🪑 *رقم الطاولة:* ${order.tableNumber}\n`;
  } else if (isDelivery) {
    text += `🛵 *نوع الطلب:* توصيل للمنازل (Delivery)\n`;
    text += `👤 *الاسم:* ${order.customerName || "غير محدد"}\n`;
    text += `📱 *الهاتف:* ${order.customerPhone || "غير محدد"}\n`;
    text += `📍 *المنطقة:* ${order.deliveryZoneName || "غير محدد"}\n`;
    if (order.landmark) {
      text += `🏛️ *أقرب دالة:* ${order.landmark}\n`;
    }
    if (order.distanceKm && order.distanceKm > 0) {
      text += `📏 *المسافة:* ${order.distanceKm} كم\n`;
    }
    const deliveryFeeFormatted =
      order.deliveryFee && order.deliveryFee > 0
        ? `${order.deliveryFee.toLocaleString()} ${settings.currency}`
        : "يحددها المطعم بعد استلام الطلب 🛵";
    text += `🛵 *أجرة التوصيل:* ${deliveryFeeFormatted}\n`;
    if (order.estimatedDeliveryTime) {
      text += `⏱️ *الوقت المتوقع:* ~${order.estimatedDeliveryTime}\n`;
    }
    if (order.cashToPay) {
      text += `💵 *المبلغ المتاح للصرف:* ${order.cashToPay.toLocaleString()} ${settings.currency}\n`;
    }
    if (order.driverNotes) {
      text += `📝 *ملاحظة:* ${order.driverNotes}\n`;
    }
    if (order.lat && order.lng) {
      text += `━━━━━━━━━━━━━━━\n`;
      text += `🧭 *موقع العميل على الخريطة (اختياري):*\n`;
      text += `🗺️ *Google Maps:* https://maps.google.com/?q=${order.lat},${order.lng}\n`;
      text += `🚗 *Waze:* https://waze.com/ul?ll=${order.lat},${order.lng}&navigate=yes\n`;
    }
  } else {
    text += `🥡 *نوع الطلب:* استلام مسبق (Takeaway)\n`;
    text += `👤 *الاسم:* ${order.customerName || "غير محدد"}\n`;
    text += `📱 *الهاتف:* ${order.customerPhone || "غير محدد"}\n`;
    text += `⏱️ *موعد الاستلام:* ${order.pickupTime || "في أسرع وقت"}\n`;
  }

  text += `━━━━━━━━━━━━━━━\n`;
  text += `📋 *تفاصيل الطلب:*\n`;

  order.items.forEach((item, index) => {
    text += `${index + 1}. *${item.nameAr}* × ${item.quantity}`;
    if (item.variantName) {
      text += ` (${item.variantName})`;
    }
    text += ` = ${item.totalPrice.toLocaleString()} ${settings.currency}\n`;

    if (item.selectedOptionsText) {
      text += `   ▫️ إضافات: ${item.selectedOptionsText}\n`;
    }
    if (item.notes) {
      text += `   📝 ملاحظة: ${item.notes}\n`;
    }
  });

  text += `━━━━━━━━━━━━━━━\n`;
  text += `💰 *سعر الطلبات:* ${order.subtotal.toLocaleString()} ${settings.currency}\n`;

  if (order.discount > 0) {
    text += `🏷️ *الخصم:* -${order.discount.toLocaleString()} ${settings.currency}\n`;
  }
  if (isDelivery) {
    if (order.deliveryFee && order.deliveryFee > 0) {
      text += `🛵 *أجرة التوصيل:* +${order.deliveryFee.toLocaleString()} ${settings.currency}\n`;
    } else {
      text += `🛵 *أجرة التوصيل:* يحددها المطعم وتُضاف للمجموع\n`;
    }
  }
  if (order.serviceFee > 0) {
    text += `🛎️ *رسوم الخدمة:* +${order.serviceFee.toLocaleString()} ${settings.currency}\n`;
  }
  if (order.tax > 0) {
    text += `🏛️ *الضريبة:* +${order.tax.toLocaleString()} ${settings.currency}\n`;
  }

  if (isDelivery && (!order.deliveryFee || order.deliveryFee === 0)) {
    text += `💵 *مجموع الوجبات:* *${order.total.toLocaleString()} ${settings.currency}* (غير شامل التوصيل)\n`;
    text += `(الدفع نقداً عند الاستلام 💵)\n`;
    text += `━━━━━━━━━━━━━━━\n`;
    text += `⏳ *ملاحظة:* سيقوم المطعم بتحديد أجرة التوصيل وإبلاغكم بالمجموع النهائي عبر الواتساب. شكراً لكم! 🙏`;
  } else {
    text += `💵 *المجموع الكلي المطلوب:* *${order.total.toLocaleString()} ${settings.currency}*\n`;
    text += `(الدفع نقداً عند الاستلام 💵)\n`;
    text += `━━━━━━━━━━━━━━━\n`;
    text += `شكراً لكم! 🙏`;
  }

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
  const restaurantDisplayName = settings.name.startsWith("مطعم")
    ? settings.name
    : `مطعم ${settings.name}`;

  let text = `🚀 *طلب توصيل - ${restaurantDisplayName}*\n`;
  text += `📋 رقم الطلب: *#${order.orderNumber}*\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `👤 *الزبون:* ${order.customerName || "—"}\n`;
  text += `📞 *رقم الهاتف:* ${order.customerPhone || "—"}\n`;
  text += `📍 *المنطقة:* ${order.deliveryZoneName || "توصيل"}\n`;
  text += `🏠 *العنوان:* ${order.address || "—"}\n`;
  if (order.distanceKm && order.distanceKm > 0) {
    text += `📏 *المسافة:* ${order.distanceKm} كم\n`;
  }
  const feeText =
    order.deliveryFee && order.deliveryFee > 0
      ? `${order.deliveryFee.toLocaleString()} ${settings.currency}`
      : "يحددها المطعم";
  text += `🛵 *أجرة التوصيل:* ${feeText}\n`;
  if (order.landmark) {
    text += `🏛️ *أقرب دالة:* ${order.landmark}\n`;
  }
  if (order.lat && order.lng) {
    text += `━━━━━━━━━━━━━━━\n`;
    text += `🧭 *الموقع على الخريطة:*\n`;
    text += `🗺️ *Google Maps:* https://maps.google.com/?q=${order.lat},${order.lng}\n`;
    text += `🚗 *Waze:* https://waze.com/ul?ll=${order.lat},${order.lng}&navigate=yes\n`;
  }
  if (order.driverNotes) {
    text += `📝 *ملاحظة التوصيل:* ${order.driverNotes}\n`;
  }
  text += `━━━━━━━━━━━━━━━\n`;
  text += `💵 *المبلغ المطلوب تحصيله كاش:*\n`;
  text += `👉 *${order.total.toLocaleString()} ${settings.currency}*\n`;
  if (order.cashToPay && order.cashToPay > order.total) {
    const change = order.cashToPay - order.total;
    text += `(الزبون لديه: ${order.cashToPay.toLocaleString()} ${settings.currency} — الباقي له: ${change.toLocaleString()} ${settings.currency})\n`;
  }
  text += `━━━━━━━━━━━━━━━\n`;
  text += `📦 *محتويات الطلب:*\n`;
  order.items.forEach((item, index) => {
    text += `${index + 1}. ${item.nameAr} × ${item.quantity}\n`;
  });
  text += `━━━━━━━━━━━━━━━\n`;
  text += `يرجى التأكد من استلام المبلغ بالكامل. بالتوفيق! 🛵💨`;

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

import { Order, RestaurantSettings } from "@/types";

export function generateWhatsAppMessage(order: Order, settings: RestaurantSettings): string {
  const isTable = order.type === "table";
  
  let text = `مرحباً مطعم ${settings.name} 🍽️\n`;
  text += `تأكيد طلب جديد رقم: *#${order.orderNumber}*\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  
  if (isTable) {
    text += `📍 *نوع الطلب:* طلب طاولة\n`;
    text += `🪑 *رقم الطاولة:* ${order.tableNumber}\n`;
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
  if (order.serviceFee > 0) {
    text += `🛎️ *رسوم الخدمة:* +${order.serviceFee} ${settings.currency}\n`;
  }
  if (order.tax > 0) {
    text += `🏛️ *الضريبة:* +${order.tax} ${settings.currency}\n`;
  }

  text += `💵 *المجموع الكلي:* *${order.total} ${settings.currency}*\n`;
  text += `💳 *طريقة الدفع:* نقداً عند الاستلام/الكاشير 💵\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `شكراً لكم! 🙏`;

  return text;
}

export function getWhatsAppUrl(order: Order, settings: RestaurantSettings): string {
  const phone = settings.whatsapp.replace(/[^0-9]/g, "");
  const message = generateWhatsAppMessage(order, settings);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

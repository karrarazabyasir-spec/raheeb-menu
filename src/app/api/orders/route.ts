import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { CartItem, Order, OrderItem, OrderStatus, OrderType } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as OrderStatus) || undefined;
  const type = (searchParams.get("type") as OrderType) || undefined;

  const orders = db.getOrders({ status, type });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      tableNumber,
      customerName,
      customerPhone,
      pickupTime,
      cartItems,
      couponCode,
    }: {
      type: OrderType;
      tableNumber?: number;
      customerName?: string;
      customerPhone?: string;
      pickupTime?: string;
      cartItems: CartItem[];
      couponCode?: string;
    } = body;

    const settings = db.getSettings();

    if (!settings.isOrderingEnabled) {
      return NextResponse.json(
        { error: "نأسف، استقبال الطلبات متوقف مؤقتاً حالياً" },
        { status: 403 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "السلة فارغة" }, { status: 400 });
    }

    if (type === "table" && !tableNumber) {
      return NextResponse.json({ error: "رقم الطاولة مطلوب للطلب الداخلي" }, { status: 400 });
    }

    if (type === "takeaway" && (!customerName || !customerPhone)) {
      return NextResponse.json(
        { error: "الاسم ورقم الهاتف مطلوبان للطلب المسبق" },
        { status: 400 }
      );
    }

    // SERVER-SIDE VERIFICATION OF ITEMS AND PRICES
    const verifiedOrderItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    for (const cartItem of cartItems) {
      const dbItem = db.getMenuItemById(cartItem.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { error: `الصنف ${cartItem.nameAr} لم يعد متوفراً` },
          { status: 400 }
        );
      }
      if (!dbItem.isAvailable) {
        return NextResponse.json(
          { error: `نأسف، الصنف (${dbItem.nameAr}) نفد حالياً` },
          { status: 400 }
        );
      }

      // Base price or selected variant price
      let unitPrice = dbItem.basePrice;
      let variantName: string | undefined = undefined;

      if (cartItem.selectedVariant && dbItem.variants) {
        const foundVariant = dbItem.variants.find((v) => v.id === cartItem.selectedVariant?.id);
        if (foundVariant) {
          unitPrice = foundVariant.price;
          variantName = foundVariant.nameAr;
        }
      }

      // Calculate options price from DB item definitions
      const optionsTexts: string[] = [];
      if (cartItem.selectedOptions && cartItem.selectedOptions.length > 0 && dbItem.optionGroups) {
        for (const selOpt of cartItem.selectedOptions) {
          for (const group of dbItem.optionGroups) {
            const foundOption = group.options.find((o) => o.id === selOpt.optionId);
            if (foundOption) {
              unitPrice += foundOption.price;
              optionsTexts.push(
                foundOption.price > 0
                  ? `${foundOption.nameAr} (+${foundOption.price} ${settings.currency})`
                  : foundOption.nameAr
              );
            }
          }
        }
      }

      const quantity = Math.max(1, Math.min(50, Number(cartItem.quantity) || 1));
      const lineTotal = unitPrice * quantity;
      calculatedSubtotal += lineTotal;

      verifiedOrderItems.push({
        id: `ord-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        menuItemId: dbItem.id,
        nameAr: dbItem.nameAr,
        nameEn: dbItem.nameEn,
        variantName,
        selectedOptionsText: optionsTexts.length > 0 ? optionsTexts.join("، ") : undefined,
        notes: cartItem.notes?.trim() || undefined,
        unitPrice,
        quantity,
        totalPrice: lineTotal,
      });
    }

    // Coupon discount calculation
    let discount = 0;
    if (couponCode) {
      const couponResult = db.validateCoupon(couponCode, calculatedSubtotal);
      if (couponResult.valid) {
        discount = couponResult.discount;
      }
    }

    const afterDiscount = Math.max(0, calculatedSubtotal - discount);

    // Service fee & Tax
    const serviceFee =
      settings.serviceFeePercent > 0
        ? Math.round(((afterDiscount * settings.serviceFeePercent) / 100) * 100) / 100
        : 0;

    const tax =
      settings.taxPercent > 0
        ? Math.round((((afterDiscount + serviceFee) * settings.taxPercent) / 100) * 100) / 100
        : 0;

    const total = Math.round((afterDiscount + serviceFee + tax) * 100) / 100;

    const newOrder = db.createOrder({
      type,
      tableNumber: type === "table" ? Number(tableNumber) : undefined,
      customerName: type === "takeaway" ? customerName?.trim() : undefined,
      customerPhone: type === "takeaway" ? customerPhone?.trim() : undefined,
      pickupTime: type === "takeaway" ? (pickupTime || "في أسرع وقت") : undefined,
      items: verifiedOrderItems,
      subtotal: calculatedSubtotal,
      discount,
      serviceFee,
      tax,
      total,
      paymentMethod: "cash",
      status: "received",
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json({ error: "تعذر إرسال الطلب، يرجى المحاولة ثانية" }, { status: 500 });
  }
}

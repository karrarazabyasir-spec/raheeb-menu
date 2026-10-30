import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import {
  Category,
  Coupon,
  MenuItem,
  Order,
  OrderStatus,
  RestaurantSettings,
  Table,
  WaiterCall,
} from "@/types";
import { initialCategories, initialMenuItems, initialSettings, initialTables } from "./initialData";
import { supabaseAdmin } from "./supabase";

export interface DatabaseSchema {
  settings: RestaurantSettings;
  categories: Category[];
  menuItems: MenuItem[];
  tables: Table[];
  orders: Order[];
  coupons: Coupon[];
  waiterCalls: WaiterCall[];
  nextOrderNumber: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

// Real-time Event bus for Server-Sent Events (SSE)
class OrderEventBus extends EventEmitter {}
export const eventBus = new OrderEventBus();
eventBus.setMaxListeners(100);

let memoryCache: DatabaseSchema | null = null;
let lastCloudFetchTime = 0;

function ensureSettingsDefaults(settings: RestaurantSettings): RestaurantSettings {
  return {
    ...initialSettings,
    ...settings,
    deliveryZones: settings.deliveryZones && settings.deliveryZones.length > 0
      ? settings.deliveryZones
      : initialSettings.deliveryZones,
    deliveryEnabled: settings.deliveryEnabled ?? initialSettings.deliveryEnabled,
    freeDeliveryThreshold: settings.freeDeliveryThreshold ?? initialSettings.freeDeliveryThreshold,
    defaultDeliveryTime: settings.defaultDeliveryTime || initialSettings.defaultDeliveryTime,
  };
}

function syncCloudDataInBackground() {
  const now = Date.now();
  // Throttle cloud fetch to once every 10 seconds
  if (now - lastCloudFetchTime < 10000) return;
  lastCloudFetchTime = now;

  supabaseAdmin.storage
    .from("menu-images")
    .download("config/store.json")
    .then(async ({ data, error }) => {
      if (data && !error) {
        const text = await data.text();
        const parsed = JSON.parse(text) as DatabaseSchema;
        if (parsed && parsed.settings) {
          parsed.settings = ensureSettingsDefaults(parsed.settings);
          memoryCache = parsed;
        }
      }
    })
    .catch(() => {});
}

function readData(): DatabaseSchema {
  syncCloudDataInBackground();

  if (memoryCache) {
    if (memoryCache.settings) {
      memoryCache.settings = ensureSettingsDefaults(memoryCache.settings);
    }
    return memoryCache;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      memoryCache = JSON.parse(content) as DatabaseSchema;
      if (memoryCache && memoryCache.settings) {
        memoryCache.settings = ensureSettingsDefaults(memoryCache.settings);
      }
      return memoryCache;
    }
  } catch (err) {
    console.error("Local file read failed, using defaults:", err);
  }

  memoryCache = {
    settings: initialSettings,
    categories: initialCategories,
    menuItems: initialMenuItems,
    tables: initialTables,
    orders: [],
    coupons: [
      { code: "RAHEEB15", type: "percent", value: 15, minOrderValue: 50, isActive: true },
      { code: "WELCOME10", type: "fixed", value: 10, minOrderValue: 40, isActive: true },
    ],
    waiterCalls: [],
    nextOrderNumber: 101,
  };
  return memoryCache;
}

async function writeData(data: DatabaseSchema): Promise<void> {
  memoryCache = data;

  // 1. Try local filesystem (works on dev / persistent servers)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Expected on Vercel read-only filesystem
  }

  // 2. Persist to Supabase Cloud Storage (permanent across all serverless instances)
  try {
    const { error } = await supabaseAdmin.storage
      .from("menu-images")
      .upload("config/store.json", JSON.stringify(data, null, 2), {
        upsert: true,
        contentType: "application/json",
      });
    if (error) {
      console.error("Cloud storage sync error:", error);
    }
  } catch (cloudErr) {
    console.error("Cloud storage upload error:", cloudErr);
  }
}


export const db = {
  // Settings
  getSettings(): RestaurantSettings {
    const data = readData();
    data.settings = ensureSettingsDefaults(data.settings);
    return data.settings;
  },

  async updateSettings(partial: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    const data = readData();
    data.settings = { ...data.settings, ...partial };
    await writeData(data);
    eventBus.emit("settings_updated", data.settings);
    return data.settings;
  },

  // Categories
  getCategories(): Category[] {
    const data = readData();
    return data.categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  saveCategories(categories: Category[]): Category[] {
    const data = readData();
    data.categories = categories;
    writeData(data);
    eventBus.emit("menu_updated");
    return data.categories;
  },

  // Menu Items
  getMenuItems(): MenuItem[] {
    const data = readData();
    return data.menuItems;
  },

  getMenuItemById(id: string): MenuItem | undefined {
    const data = readData();
    return data.menuItems.find((item) => item.id === id);
  },

  saveMenuItem(item: MenuItem): MenuItem {
    const data = readData();
    const index = data.menuItems.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      data.menuItems[index] = item;
    } else {
      data.menuItems.push(item);
    }
    writeData(data);
    eventBus.emit("menu_updated");
    return item;
  },

  deleteMenuItem(id: string): boolean {
    const data = readData();
    data.menuItems = data.menuItems.filter((i) => i.id !== id);
    writeData(data);
    eventBus.emit("menu_updated");
    return true;
  },

  setMenuItemsCache(items: MenuItem[]): void {
    const data = readData();
    data.menuItems = items;
    memoryCache = data;
  },

  async syncToCloud(): Promise<void> {
    const data = readData();
    try {
      await supabaseAdmin.storage
        .from("menu-images")
        .upload("config/store.json", JSON.stringify(data, null, 2), {
          upsert: true,
          contentType: "application/json",
        });
    } catch (cloudErr) {
      console.error("Cloud storage sync error:", cloudErr);
    }
  },

  toggleItemAvailability(id: string, isAvailable?: boolean): MenuItem | null {
    const data = readData();
    const item = data.menuItems.find((i) => i.id === id);
    if (!item) return null;
    item.isAvailable = typeof isAvailable === "boolean" ? isAvailable : !item.isAvailable;
    writeData(data);
    eventBus.emit("menu_updated", item);
    return item;
  },

  // Tables
  getTables(): Table[] {
    const data = readData();
    return data.tables.sort((a, b) => a.number - b.number);
  },

  getTableByNumber(tableNumber: number): Table | undefined {
    const data = readData();
    return data.tables.find((t) => t.number === tableNumber);
  },

  updateTableStatus(
    tableNumber: number,
    status: Table["status"],
    activeOrderId?: string | null
  ): Table | null {
    const data = readData();
    const table = data.tables.find((t) => t.number === tableNumber);
    if (!table) return null;

    table.status = status;
    if (activeOrderId !== undefined) {
      table.activeOrderId = activeOrderId;
    }
    if (status === "empty") {
      table.activeOrderId = null;
      table.lastCallAt = null;
      table.lastBillRequestAt = null;
    }
    writeData(data);
    eventBus.emit("table_updated", table);
    return table;
  },

  saveTables(tables: Table[]): Table[] {
    const data = readData();
    data.tables = tables;
    writeData(data);
    eventBus.emit("table_updated", tables);
    return data.tables;
  },

  // Orders
  getOrders(filter?: { status?: OrderStatus; type?: Order["type"] }): Order[] {
    const data = readData();
    let orders = [...data.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filter?.status) {
      orders = orders.filter((o) => o.status === filter.status);
    }
    if (filter?.type) {
      orders = orders.filter((o) => o.type === filter.type);
    }
    return orders;
  },

  getOrderById(id: string): Order | undefined {
    const data = readData();
    return data.orders.find((o) => o.id === id);
  },

  createOrder(orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Order {
    const data = readData();
    const orderNumber = data.nextOrderNumber++;
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };

    data.orders.unshift(newOrder);

    // If it's a table order, update table status to occupied
    if (newOrder.type === "table" && newOrder.tableNumber) {
      const table = data.tables.find((t) => t.number === newOrder.tableNumber);
      if (table) {
        table.status = "occupied";
        table.activeOrderId = newOrder.id;
      }
    }

    writeData(data);
    eventBus.emit("new_order", newOrder);

    // Sync to Supabase Cloud database
    supabaseAdmin
      .from("orders")
      .insert({
        id: newOrder.id,
        order_number: newOrder.orderNumber,
        type: newOrder.type,
        table_number: newOrder.tableNumber || null,
        customer_name: newOrder.customerName || null,
        customer_phone: newOrder.customerPhone || null,
        pickup_time: newOrder.pickupTime || null,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        service_fee: newOrder.serviceFee,
        tax: newOrder.tax,
        total: newOrder.total,
        payment_method: newOrder.paymentMethod,
        status: newOrder.status,
        cancel_reason: newOrder.cancelReason || null,
        created_at: newOrder.createdAt,
        updated_at: newOrder.updatedAt,
        delivery_zone_name: newOrder.deliveryZoneName || null,
        delivery_fee: newOrder.deliveryFee || 0,
        address: newOrder.address || null,
        landmark: newOrder.landmark || null,
        driver_notes: newOrder.driverNotes || null,
        cash_to_pay: newOrder.cashToPay || null,
        lat: newOrder.lat || null,
        lng: newOrder.lng || null,
      })
      .then(({ error }) => {
        if (error) console.error("Supabase order sync error:", error);
      });

    return newOrder;
  },

  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    cancelReason?: string
  ): Order | null {
    const data = readData();
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (cancelReason) {
      order.cancelReason = cancelReason;
    }

    writeData(data);
    eventBus.emit("order_status_changed", order);

    // Sync status change to Supabase
    supabaseAdmin
      .from("orders")
      .update({
        status,
        cancel_reason: cancelReason || null,
        updated_at: order.updatedAt,
      })
      .eq("id", orderId)
      .then(({ error }) => {
        if (error) console.error("Supabase order status update error:", error);
      });

    return order;
  },

  // Waiter Calls & Bill Requests
  callWaiter(tableNumber: number, type: "call" | "bill"): WaiterCall {
    const data = readData();
    const now = new Date().toISOString();
    const call: WaiterCall = {
      id: `call-${Date.now()}`,
      tableNumber,
      type,
      status: "pending",
      createdAt: now,
    };

    data.waiterCalls.unshift(call);

    const table = data.tables.find((t) => t.number === tableNumber);
    if (table) {
      if (type === "call") {
        table.status = "calling_waiter";
        table.lastCallAt = now;
      } else {
        table.status = "requesting_bill";
        table.lastBillRequestAt = now;
      }
    }

    writeData(data);
    eventBus.emit("waiter_called", { call, table });
    return call;
  },

  dismissWaiterCall(callId: string): boolean {
    const data = readData();
    const call = data.waiterCalls.find((c) => c.id === callId);
    if (call) {
      call.status = "handled";
      const table = data.tables.find((t) => t.number === call.tableNumber);
      if (table && (table.status === "calling_waiter" || table.status === "requesting_bill")) {
        table.status = table.activeOrderId ? "occupied" : "empty";
      }
      writeData(data);
      eventBus.emit("waiter_dismissed", call);
      return true;
    }
    return false;
  },

  getActiveWaiterCalls(): WaiterCall[] {
    const data = readData();
    return data.waiterCalls.filter((c) => c.status === "pending");
  },

  // Coupons
  validateCoupon(code: string, currentSubtotal: number): { valid: boolean; discount: number; message?: string } {
    const data = readData();
    const coupon = data.coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
    );

    if (!coupon) {
      return { valid: false, discount: 0, message: "كود الخصم غير صحيح أو منتهي الصلاحية" };
    }

    if (coupon.minOrderValue && currentSubtotal < coupon.minOrderValue) {
      return {
        valid: false,
        discount: 0,
        message: `الحد الأدنى لتطبيق هذا الخصم هو ${coupon.minOrderValue} ${data.settings.currency}`,
      };
    }

    let discount = 0;
    if (coupon.type === "percent") {
      discount = (currentSubtotal * coupon.value) / 100;
    } else {
      discount = Math.min(coupon.value, currentSubtotal);
    }

    return { valid: true, discount: Math.round(discount * 100) / 100 };
  },

  getCoupons(): Coupon[] {
    const data = readData();
    return data.coupons;
  },

  saveCoupon(coupon: Coupon): Coupon {
    const data = readData();
    const idx = data.coupons.findIndex((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx >= 0) {
      data.coupons[idx] = coupon;
    } else {
      data.coupons.push(coupon);
    }
    writeData(data);
    return coupon;
  },
};

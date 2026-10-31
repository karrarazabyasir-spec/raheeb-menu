export type Role = "owner" | "cashier" | "kitchen";

export type OrderType = "table" | "takeaway" | "delivery";

export type OrderStatus = "received" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

export type TableStatus = "empty" | "occupied" | "calling_waiter" | "requesting_bill";

export interface DeliveryZone {
  id: string;
  nameAr: string;
  nameEn: string;
  fee: number; // in IQD (e.g. 2000, 3000)
  minOrder?: number; // minimum order subtotal for this zone (e.g. 10000)
  estimatedTime?: string; // e.g. "30-45 دقيقة"
  isActive: boolean;
}

export interface RestaurantSettings {
  name: string;
  nameEn: string;
  description: string;
  phone: string;
  whatsapp: string; // for wa.me direct message link
  currency: string;
  currencyEn: string;
  primaryColor?: string; // e.g. "#780000"
  secondaryColor?: string; // e.g. "#c68a2c"
  logoUrl?: string;
  isOrderingEnabled: boolean;
  serviceFeePercent: number; // default 0, customizable
  taxPercent: number; // default 0, customizable
  showTaxAndServiceOnReceipt: boolean;
  estimatedPreparationTimeMinutes: number; // default 20
  address: string;
  openingHours: string;
  bannerMessage?: string;
  bannerActive?: boolean;
  // Delivery settings
  deliveryEnabled?: boolean;
  deliveryZones?: DeliveryZone[];
  freeDeliveryThreshold?: number; // e.g. 50000 -> 0 fee
  defaultDeliveryTime?: string; // e.g. "35-50 دقيقة"
}


export interface Table {
  id: string;
  number: number;
  label: string;
  section: "صالة" | "عائلات" | "تراس" | "أخرى";
  status: TableStatus;
  activeOrderId?: string | null;
  qrToken: string;
  lastCallAt?: string | null;
  lastBillRequestAt?: string | null;
}

export interface OptionItem {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  nameAr: string;
  nameEn: string;
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: OptionItem[];
}

export interface ItemVariant {
  id: string;
  nameAr: string; // e.g. صغير، وسط، كبير
  nameEn: string;
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  basePrice: number;
  imageUrl: string;
  tags: ("spicy" | "popular" | "vegetarian" | "new")[];
  isAvailable: boolean; // available or sold out (نفد)
  variants?: ItemVariant[];
  optionGroups?: OptionGroup[];
  availableHours?: {
    start: string; // "08:00"
    end: string;   // "12:00"
  };
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  nameAr: string;
  nameEn: string;
  imageUrl: string;
  selectedVariant?: ItemVariant;
  selectedOptions: SelectedOption[];
  notes?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  nameAr: string;
  nameEn: string;
  variantName?: string;
  selectedOptionsText?: string;
  notes?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: number; // Sequential (e.g. 101, 102)
  type: OrderType;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  pickupTime?: string; // "asap" or specified time
  // Delivery specific fields
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  deliveryFee?: number;
  address?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  driverNotes?: string;
  cashToPay?: number; // amount customer will pay to prepare change
  items: OrderItem[];
  subtotal: number;
  discount: number;
  serviceFee: number;
  tax: number;
  total: number;
  paymentMethod: "cash";
  status: OrderStatus;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderValue?: number;
  isActive: boolean;
}

export interface WaiterCall {
  id: string;
  tableNumber: number;
  type: "call" | "bill";
  status: "pending" | "handled";
  createdAt: string;
}

export interface SavedCustomerOrder {
  id: string;
  orderNumber: number;
  type: OrderType;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  pickupTime?: string;
  deliveryZoneName?: string;
  deliveryFee?: number;
  address?: string;
  landmark?: string;
  items: {
    menuItemId: string;
    nameAr: string;
    nameEn: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variantName?: string;
    selectedOptionsText?: string;
    imageUrl?: string;
  }[];
  total: number;
  createdAt: string;
}

export interface CustomerReview {
  id: string;
  orderId?: string;
  orderNumber?: number;
  customerName?: string;
  customerPhone?: string;
  orderType?: OrderType;
  rating: number; // 1 to 5
  tags: string[];
  comment: string;
  createdAt: string;
}

export interface SavedAddress {
  id: string;
  title: string; // e.g. "المنزل", "العمل"
  area: string;
  street: string;
  phone: string;
  isDefault?: boolean;
}


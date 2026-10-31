"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CustomerReview, SavedAddress, SavedCustomerOrder } from "@/types";

interface CustomerContextType {
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  activeProfileTab: "orders" | "reviews" | "addresses";
  setActiveProfileTab: (tab: "orders" | "reviews" | "addresses") => void;

  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  syncCustomerByPhone: (phone: string) => Promise<{ success: boolean; count: number; error?: string }>;
  isSyncing: boolean;

  savedOrders: SavedCustomerOrder[];
  addSavedOrder: (order: SavedCustomerOrder) => void;

  savedReviews: CustomerReview[];
  addReview: (review: Omit<CustomerReview, "id" | "createdAt">) => void;
  deleteReview: (id: string) => void;

  savedAddresses: SavedAddress[];
  addAddress: (addr: Omit<SavedAddress, "id">) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  defaultAddress: SavedAddress | undefined;
}

const CustomerContext = createContext<CustomerContextType>({
  isProfileOpen: false,
  setIsProfileOpen: () => {},
  activeProfileTab: "orders",
  setActiveProfileTab: () => {},

  customerPhone: "",
  setCustomerPhone: () => {},
  syncCustomerByPhone: async () => ({ success: false, count: 0 }),
  isSyncing: false,

  savedOrders: [],
  addSavedOrder: () => {},

  savedReviews: [],
  addReview: () => {},
  deleteReview: () => {},

  savedAddresses: [],
  addAddress: () => {},
  deleteAddress: () => {},
  setDefaultAddress: () => {},
  defaultAddress: undefined,
});

const ORDERS_KEY = "raheeb_customer_orders_v1";
const REVIEWS_KEY = "raheeb_customer_reviews_v1";
const ADDRESSES_KEY = "raheeb_customer_addresses_v1";
const PHONE_KEY = "raheeb_customer_phone_v1";

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<"orders" | "reviews" | "addresses">("orders");

  const [customerPhone, setCustomerPhone] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const [savedOrders, setSavedOrders] = useState<SavedCustomerOrder[]>([]);
  const [savedReviews, setSavedReviews] = useState<CustomerReview[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem(PHONE_KEY);
      if (savedPhone) setCustomerPhone(savedPhone);

      const orders = localStorage.getItem(ORDERS_KEY);
      if (orders) setSavedOrders(JSON.parse(orders));

      const reviews = localStorage.getItem(REVIEWS_KEY);
      if (reviews) setSavedReviews(JSON.parse(reviews));

      const addresses = localStorage.getItem(ADDRESSES_KEY);
      if (addresses) {
        const parsed = JSON.parse(addresses);
        const cleaned = Array.isArray(parsed)
          ? parsed.filter((a) => a.street !== "قرب تقاطع الرواد - شارع 14 رمضان")
          : [];
        setSavedAddresses(cleaned);
      } else {
        setSavedAddresses([]);
      }
    } catch (e) {
      console.warn("Could not load customer data from storage", e);
    }
    setIsLoaded(true);
  }, []);

  // Save phone
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (customerPhone) {
        localStorage.setItem(PHONE_KEY, customerPhone);
      }
    } catch {}
  }, [customerPhone, isLoaded]);

  // Save Orders
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(savedOrders));
    } catch {}
  }, [savedOrders, isLoaded]);

  // Save Reviews & auto-sync to cloud if phone is known
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(savedReviews));
    } catch {}
  }, [savedReviews, isLoaded]);

  // Save Addresses & auto-sync to cloud if phone is known
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(ADDRESSES_KEY, JSON.stringify(savedAddresses));
      if (customerPhone && customerPhone.length >= 7) {
        fetch("/api/customer/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: customerPhone,
            addresses: savedAddresses,
            reviews: savedReviews,
          }),
        }).catch(() => {});
      }
    } catch {}
  }, [savedAddresses, customerPhone, isLoaded]);

  // Cross-browser sync function using phone number
  const syncCustomerByPhone = async (phone: string): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!phone || phone.trim().length < 6) {
      return { success: false, count: 0, error: "رقم الهاتف غير صالح" };
    }

    setIsSyncing(true);
    try {
      const res = await fetch(`/api/customer/sync?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCustomerPhone(data.phone || phone.trim());

        if (Array.isArray(data.orders)) {
          setSavedOrders(data.orders);
        }
        if (Array.isArray(data.addresses) && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
        }
        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          setSavedReviews(data.reviews);
        }

        return { success: true, count: data.orders?.length || 0 };
      } else {
        return { success: false, count: 0, error: data.error || "لم يتم العثور على سجل بهذا الرقم" };
      }
    } catch (err) {
      console.error("Sync error:", err);
      return { success: false, count: 0, error: "تعذر الاتصال بالسيرفر" };
    } finally {
      setIsSyncing(false);
    }
  };

  const addSavedOrder = (order: SavedCustomerOrder) => {
    setSavedOrders((prev) => {
      const filtered = prev.filter((o) => o.id !== order.id);
      return [order, ...filtered];
    });
  };

  const addReview = (reviewData: Omit<CustomerReview, "id" | "createdAt">) => {
    const newReview: CustomerReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSavedReviews((prev) => [newReview, ...prev]);
  };

  const deleteReview = (id: string) => {
    setSavedReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const addAddress = (addrData: Omit<SavedAddress, "id">) => {
    const isFirst = savedAddresses.length === 0;
    const newAddr: SavedAddress = {
      ...addrData,
      id: `addr-${Date.now()}`,
      isDefault: isFirst || addrData.isDefault,
    };

    setSavedAddresses((prev) => {
      if (newAddr.isDefault) {
        return [newAddr, ...prev.map((a) => ({ ...a, isDefault: false }))];
      }
      return [...prev, newAddr];
    });
  };

  const deleteAddress = (id: string) => {
    setSavedAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  };

  const setDefaultAddress = (id: string) => {
    setSavedAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  const defaultAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  return (
    <CustomerContext.Provider
      value={{
        isProfileOpen,
        setIsProfileOpen,
        activeProfileTab,
        setActiveProfileTab,
        customerPhone,
        setCustomerPhone,
        syncCustomerByPhone,
        isSyncing,
        savedOrders,
        addSavedOrder,
        savedReviews,
        addReview,
        deleteReview,
        savedAddresses,
        addAddress,
        deleteAddress,
        setDefaultAddress,
        defaultAddress,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  return useContext(CustomerContext);
}

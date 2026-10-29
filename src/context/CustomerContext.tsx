"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CustomerReview, SavedAddress, SavedCustomerOrder } from "@/types";

interface CustomerContextType {
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  activeProfileTab: "orders" | "reviews" | "addresses";
  setActiveProfileTab: (tab: "orders" | "reviews" | "addresses") => void;

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

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<"orders" | "reviews" | "addresses">("orders");

  const [savedOrders, setSavedOrders] = useState<SavedCustomerOrder[]>([]);
  const [savedReviews, setSavedReviews] = useState<CustomerReview[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const orders = localStorage.getItem(ORDERS_KEY);
      if (orders) setSavedOrders(JSON.parse(orders));

      const reviews = localStorage.getItem(REVIEWS_KEY);
      if (reviews) setSavedReviews(JSON.parse(reviews));

      const addresses = localStorage.getItem(ADDRESSES_KEY);
      if (addresses) {
        setSavedAddresses(JSON.parse(addresses));
      } else {
        // Pre-populate with a convenient default template
        const initial = [
          {
            id: "addr-home",
            title: "المنزل",
            area: "المنصور",
            street: "قرب تقاطع الرواد - شارع 14 رمضان",
            phone: "",
            isDefault: true,
          },
        ];
        setSavedAddresses(initial);
      }
    } catch (e) {
      console.warn("Could not load customer data from storage", e);
    }
    setIsLoaded(true);
  }, []);

  // Save Orders
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(savedOrders));
    } catch {}
  }, [savedOrders, isLoaded]);

  // Save Reviews
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(savedReviews));
    } catch {}
  }, [savedReviews, isLoaded]);

  // Save Addresses
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(ADDRESSES_KEY, JSON.stringify(savedAddresses));
    } catch {}
  }, [savedAddresses, isLoaded]);

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

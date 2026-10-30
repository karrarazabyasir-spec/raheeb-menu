"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, ItemVariant, MenuItem, SelectedOption } from "@/types";

interface CartContextType {
  items: CartItem[];
  addToCart: (
    item: MenuItem,
    quantity: number,
    selectedVariant?: ItemVariant,
    selectedOptions?: SelectedOption[],
    notes?: string
  ) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  tableNumber: number | null;
  setTableNumber: (tbl: number | null) => void;
  orderType: "table" | "takeaway" | "delivery";
  setOrderType: (type: "table" | "takeaway" | "delivery") => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalItemsCount: 0,
  subtotal: 0,
  tableNumber: null,
  setTableNumber: () => {},
  orderType: "takeaway",
  setOrderType: () => {},
  isCartOpen: false,
  setIsCartOpen: () => {},
});

const CART_STORAGE_KEY = "raheeb_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<"table" | "takeaway" | "delivery">("takeaway");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load cart from storage", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart to storage", e);
    }
  }, [items, isLoaded]);

  const addToCart = (
    item: MenuItem,
    quantity: number,
    selectedVariant?: ItemVariant,
    selectedOptions: SelectedOption[] = [],
    notes: string = ""
  ) => {
    let unitPrice = selectedVariant ? selectedVariant.price : item.basePrice;
    selectedOptions.forEach((opt) => {
      unitPrice += opt.price;
    });

    const cartItemId = `${item.id}-${selectedVariant?.id || "base"}-${selectedOptions
      .map((o) => o.optionId)
      .sort()
      .join("_")}-${notes.trim()}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex >= 0) {
        const copy = [...prev];
        const updatedQty = copy[existingIndex].quantity + quantity;
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: updatedQty,
          totalPrice: copy[existingIndex].unitPrice * updatedQty,
        };
        return copy;
      } else {
        const newItem: CartItem = {
          cartItemId,
          menuItemId: item.id,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          imageUrl: item.imageUrl,
          selectedVariant,
          selectedOptions,
          notes: notes.trim(),
          unitPrice,
          quantity,
          totalPrice: unitPrice * quantity,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal,
        tableNumber,
        setTableNumber,
        orderType,
        setOrderType,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

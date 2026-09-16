"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, CartState } from "./types";

const CART_STORAGE_KEY = "ev_spare_parts_cart_v1";

const CartContext = createContext<CartState | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to LocalStorage whenever items change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to storage:", e);
    }
  }, [items, isInitialized]);

  const addItem: CartState["addItem"] = (product, quantity) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      const minQty = Math.max(1, product.minimum_quantity || 1);
      const addQty = quantity !== undefined ? Math.max(minQty, quantity) : minQty;

      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + (quantity || minQty) }
            : item
        );
      }

      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: Number(product.price),
        unit: product.unit || "PIECE",
        minimum_quantity: minQty,
        stock_quantity: product.stock_quantity ?? 0,
        quantity: addQty,
        image_url: product.image_url,
      };

      return [...prev, newItem];
    });
  };

  const updateQuantity: CartState["updateQuantity"] = (productId, newQuantity) => {
    setItems((prev) => {
      const target = prev.find((i) => i.product_id === productId);
      if (!target) return prev;

      // If user sets to 0 or less, remove the item
      if (newQuantity <= 0) {
        return prev.filter((i) => i.product_id !== productId);
      }

      // Enforce minimum order quantity
      const validatedQuantity = Math.max(target.minimum_quantity, newQuantity);

      return prev.map((item) =>
        item.product_id === productId ? { ...item, quantity: validatedQuantity } : item
      );
    });
  };

  const removeItem: CartState["removeItem"] = (productId) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartState {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

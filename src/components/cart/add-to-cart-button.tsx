"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/context";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check, Plus, Minus } from "lucide-react";
import type { Product } from "@/types/database.types";

export function AddToCartSection({ product }: { product: Product }) {
  const { addItem } = useCart();
  const minQty = Math.max(1, product.minimum_quantity || 1);
  const [quantity, setQuantity] = useState(minQty);
  const [isAdded, setIsAdded] = useState(false);

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => Math.max(minQty, q - 1));

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">
          Quantity ({product.unit}):
        </label>
        <div className="flex items-center border rounded-md">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= minQty}
            className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-1 text-sm font-semibold min-w-[2.5rem] text-center">
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {minQty > 1 && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            (Minimum order: {minQty} {product.unit}s)
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="lg"
          className="flex-1 gap-2"
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
        >
          {isAdded ? (
            <>
              <Check className="h-5 w-5 text-emerald-300" /> Added to Cart!
            </>
          ) : product.stock_quantity === 0 ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" /> Add to Order Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setErrorMessage("Please fill in your name, contact phone number, and delivery address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          phone,
          address,
          note: note || undefined,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      // Clear the local cart
      clearCart();

      // Store redirect target
      const successUrl = `/order-success?order_id=${data.order_id}&order_number=${data.order_number}&whatsapp_url=${encodeURIComponent(
        data.whatsapp_url
      )}`;

      router.push(successUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong creating your order";
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center max-w-md mx-auto space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Your Cart is Empty</h1>
        <p className="text-sm text-muted-foreground">
          You haven&apos;t added any EV spare parts to your order cart yet.
        </p>
        <div className="pt-2">
          <Link href="/shop">
            <Button className="gap-2">
              Browse Spare Parts <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Order Cart</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review selected components and enter delivery coordinates for WhatsApp confirmation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart items list */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Selected Parts ({items.length})</span>
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive">
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {items.map((item) => (
                <div key={item.product_id} className="p-4 flex gap-4 items-center justify-between">
                  <div className="flex-1 space-y-1">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.price)} / {item.unit}
                    </p>
                    {item.minimum_quantity > 1 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        MOQ: {item.minimum_quantity} {item.unit}s
                      </p>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= item.minimum_quantity}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 py-0.5 text-xs font-semibold min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[5rem]">
                    <span className="font-bold text-sm">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Customer Information & Order Placement */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Your Full Name *
                  </label>
                  <Input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex Morgan / Apex Fleet Ops"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    WhatsApp / Phone Number *
                  </label>
                  <Input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555 123 4567"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Workshop address, city, postal code..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Special Notes / Vehicle Model (Optional)
                  </label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. 72V 3000W BLDC hub motor compatibility"
                  />
                </div>

                {/* Subtotal summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping / Taxes</span>
                    <span className="text-xs text-muted-foreground">Calculated on WhatsApp</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Estimated Total</span>
                    <span className="text-primary">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  variant="whatsapp"
                  disabled={isSubmitting}
                  className="w-full gap-2 text-base h-12"
                >
                  <MessageSquare className="h-5 w-5" />
                  {isSubmitting ? "Creating Order..." : "Proceed to WhatsApp Order"}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">
                  No online payment is collected here. Your order details will open directly in WhatsApp for quick stock confirmation.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  PackageCheck,
  Zap,
} from "lucide-react";

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
      setErrorMessage("Please provide your name, phone number, and delivery address.");
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
        throw new Error(data.error || "Failed to create order request");
      }

      // Clear local cart
      clearCart();

      // Redirect to order success
      const successUrl = `/order-success?order_id=${data.order_id}&order_number=${data.order_number}&whatsapp_url=${encodeURIComponent(
        data.whatsapp_url
      )}`;

      router.push(successUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong submitting your order";
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center max-w-md mx-auto space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Cart is Empty</h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          You haven&apos;t added any EV spare parts to your order cart yet. Browse our catalog to select components.
        </p>
        <div className="pt-2">
          <Link href="/shop">
            <Button className="gap-2 font-medium">
              Browse Spare Parts <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Order Cart ({items.length})
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Review selected components, adjust wholesale quantities, and submit for direct WhatsApp dispatch
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart items list (Left) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Bill of Materials ({items.length} item{items.length === 1 ? "" : "s"})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
              >
                Clear Cart
              </Button>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {items.map((item) => (
                <div key={item.product_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1 text-foreground"
                    >
                      {item.product_name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(item.price)} / {item.unit}</span>
                      {item.minimum_quantity > 1 && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                          MOQ: {item.minimum_quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {/* Quantity controls */}
                    <div className="flex items-center border rounded-md bg-background">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= item.minimum_quantity}
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right min-w-[5rem]">
                      <span className="font-bold text-sm text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Customer Information & Order Placement (Right - Sticky on Desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <Card className="shadow-sm border">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-primary" /> Delivery & Dispatch Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Full Name / Company Name *
                  </label>
                  <Input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Apex Fleet Operations"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    WhatsApp Phone Number *
                  </label>
                  <Input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555 123 4567"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Workshop address, city, postal code..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Vehicle Model / Notes (Optional)
                  </label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. 72V 3000W BLDC conversion"
                    className="text-xs h-9"
                  />
                </div>

                {/* Subtotal Calculation Box */}
                <div className="border-t pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Subtotal</span>
                    <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Courier Delivery / Logistics</span>
                    <span className="text-[11px] text-muted-foreground">Arranged via WhatsApp</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2 text-foreground">
                    <span>Order Total</span>
                    <span className="text-primary">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  variant="whatsapp"
                  disabled={isSubmitting}
                  className="w-full gap-2 text-sm h-11 font-semibold shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  {isSubmitting ? "Generating Order..." : "Proceed to WhatsApp Confirmation"}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                  No online payment is taken here. Clicking above securely logs your order specification and opens WhatsApp directly to verify warehouse availability.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

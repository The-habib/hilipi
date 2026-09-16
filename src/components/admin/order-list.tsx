"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { MessageSquare, ExternalLink, Calendar, User, MapPin } from "lucide-react";
import type { Order, OrderItem } from "@/types/database.types";

type OrderWithItems = Order & {
  order_items: OrderItem[];
};

const statuses = [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
] as const;

export function OrderList({
  initialOrders,
  currency,
}: {
  initialOrders: OrderWithItems[];
  currency: string;
}) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (
    orderId: string,
    newStatus: "pending" | "confirmed" | "processing" | "completed" | "cancelled"
  ) => {
    setUpdatingId(orderId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground">
        No orders logged yet. Customer inquiries created from the cart will show up here.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <div className="bg-muted/40 p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-base text-foreground">
                  {order.order_number}
                </span>
                <Badge
                  variant={
                    order.status === "completed"
                      ? "success"
                      : order.status === "confirmed"
                      ? "default"
                      : order.status === "cancelled"
                      ? "destructive"
                      : "warning"
                  }
                >
                  {order.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {order.customer_name} ({order.phone})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <div className="text-right mr-2">
                <span className="text-xs text-muted-foreground block">Total</span>
                <span className="font-bold text-base text-foreground">
                  {formatCurrency(Number(order.subtotal), currency)}
                </span>
              </div>

              {/* Status Selector */}
              <select
                disabled={updatingId === order.id}
                value={order.status}
                onChange={(e) =>
                  handleStatusChange(
                    order.id,
                    e.target.value as "pending" | "confirmed" | "processing" | "completed" | "cancelled"
                  )
                }
                className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    Mark {s}
                  </option>
                ))}
              </select>

              {order.whatsapp_message && (
                <a
                  href={order.whatsapp_message}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="whatsapp" size="sm" className="gap-1.5 text-xs h-8">
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* Delivery & Notes */}
            <div className="text-xs space-y-1 bg-muted/20 p-3 rounded-lg border">
              <div className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                <span>
                  <strong className="text-foreground">Delivery:</strong> {order.address}
                </span>
              </div>
              {order.note && (
                <p className="text-muted-foreground pl-5">
                  <strong className="text-foreground">Notes:</strong> {order.note}
                </p>
              )}
            </div>

            {/* Line Items Table */}
            {order.order_items && order.order_items.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase border-b">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.order_items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium">{item.product_name}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(Number(item.unit_price), currency)}</td>
                        <td className="p-2.5 text-right font-semibold">{formatCurrency(Number(item.subtotal), currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  MessageSquare,
  ExternalLink,
  Calendar,
  User,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  Package,
  FileText,
} from "lucide-react";
import type { Order, OrderItem } from "@/types/database.types";

type OrderWithItems = Order & {
  order_items: OrderItem[];
};

const ORDER_STATUSES = [
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
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter orders by status and search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.order_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        order.address.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Handle status update
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
      router.refresh();
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Failed to update status. Please make sure you are signed in as admin.");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "confirmed":
      case "processing":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "warning";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Status Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, customer, phone, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="text-xs h-8"
              >
                All ({orders.length})
              </Button>
              {ORDER_STATUSES.map((status) => {
                const count = orders.filter((o) => o.status === status).length;
                return (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="text-xs h-8 capitalize"
                  >
                    {status} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden shadow-sm border">
              {/* Order Header */}
              <div className="bg-muted/40 p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-base text-foreground">
                      {order.order_number}
                    </span>
                    <Badge variant={statusBadgeVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                      {new Date(order.created_at).toLocaleDateString()} at{" "}
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Customer: <strong className="text-foreground">{order.customer_name}</strong>
                    </span>
                    <span className="font-mono">
                      Phone: <strong className="text-foreground">{order.phone}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Order Total</span>
                    <span className="font-bold text-base text-foreground">
                      {formatCurrency(Number(order.subtotal), currency)}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    disabled={updatingId === order.id}
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(
                        order.id,
                        e.target.value as (typeof ORDER_STATUSES)[number]
                      )
                    }
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        Mark {s}
                      </option>
                    ))}
                  </select>

                  {/* WhatsApp Quick Dispatch */}
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

              {/* Order Detail Body */}
              <CardContent className="p-4 space-y-4">
                {/* Delivery & Notes Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-muted/20 p-3 rounded-lg border">
                  <div className="space-y-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                      <div>
                        <strong className="text-foreground block">Delivery Address:</strong>
                        <span className="text-muted-foreground leading-relaxed">{order.address}</span>
                      </div>
                    </div>
                  </div>

                  {order.note && (
                    <div className="space-y-1 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-3">
                      <div className="flex items-start gap-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                        <div>
                          <strong className="text-foreground block">Customer Notes / Requirements:</strong>
                          <span className="text-muted-foreground leading-relaxed">{order.note}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Line Items Table (Snapshot values) */}
                {order.order_items && order.order_items.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground uppercase border-b">
                        <tr>
                          <th className="p-2.5">Item Name (Snapshot)</th>
                          <th className="p-2.5 text-center">Ordered Qty</th>
                          <th className="p-2.5 text-right">Unit Price</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {order.order_items.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/10">
                            <td className="p-2.5 font-medium text-foreground">
                              {item.product_name}
                            </td>
                            <td className="p-2.5 text-center font-semibold">
                              {item.quantity}
                            </td>
                            <td className="p-2.5 text-right text-muted-foreground font-mono">
                              {formatCurrency(Number(item.unit_price), currency)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-foreground font-mono">
                              {formatCurrency(Number(item.subtotal), currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30 border-t font-semibold">
                        <tr>
                          <td colSpan={3} className="p-2.5 text-right uppercase text-muted-foreground">
                            Order Total:
                          </td>
                          <td className="p-2.5 text-right text-sm text-foreground font-bold font-mono">
                            {formatCurrency(Number(order.subtotal), currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 text-xs text-muted-foreground bg-muted/20 rounded text-center">
                    No line items attached to this order.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-sm text-muted-foreground space-y-3">
          <Package className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p>No orders found matching the filter or search criteria.</p>
          {(statusFilter !== "all" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

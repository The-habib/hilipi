import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  FolderTree,
  ShoppingBag,
  Clock,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch counts
  const [{ count: productCount }, { count: categoryCount }, { count: orderCount }, { count: pendingCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: settings } = await supabase
    .from("store_settings")
    .select("currency")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time catalog metrics and incoming dispatch orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="outline" size="sm" className="gap-2">
              <FolderTree className="h-4 w-4" /> Categories
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Available SKUs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <FolderTree className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">System groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Logged customer requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting dispatch review</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-lg">Recent WhatsApp Orders</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Latest requests submitted by customers
            </p>
          </div>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              View All Orders <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders && recentOrders.length > 0 ? (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-foreground">
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
                    <p className="text-xs text-muted-foreground">
                      Customer: <strong className="text-foreground">{order.customer_name}</strong> • Phone: {order.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className="text-sm font-bold">
                      {formatCurrency(Number(order.subtotal), currency)}
                    </span>
                    {order.whatsapp_message && (
                      <a
                        href={order.whatsapp_message}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          Open WhatsApp <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No orders have been submitted yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

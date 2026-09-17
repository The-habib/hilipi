import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  CheckCircle2,
  FolderTree,
  ShoppingBag,
  Clock,
  Plus,
  ArrowRight,
  ExternalLink,
  Settings,
  Store,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch real-time live counts
  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalCategories },
    { count: totalOrders },
    { count: pendingOrders },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: settings } = await supabase
    .from("store_settings")
    .select("currency, store_name")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";

  return (
    <div className="space-y-8">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{settings?.store_name || "HILIPI"} Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time catalog metrics, inventory status, and incoming customer dispatch orders
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/products/new">
            <Button size="sm" className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" /> Products
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="outline" size="sm" className="gap-2">
              <FolderTree className="h-4 w-4" /> Categories
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="gap-2">
              <ShoppingBag className="h-4 w-4" /> Orders
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" /> Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Catalog
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProducts ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All registered SKUs</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active In Store
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeProducts ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Visible to buyers</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </CardTitle>
            <FolderTree className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCategories ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">System groups</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalOrders ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Logged requests</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Pending Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingOrders ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Needs review/dispatch</p>
          </CardContent>
        </Card>
      </div>

      {/* First-Time Store Setup Flow (Displayed when catalog has 0 products) */}
      {(!totalProducts || totalProducts === 0) && (
        <Card className="border-primary/30 bg-primary/5 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-primary/10 bg-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <CardTitle className="text-lg font-bold text-foreground">
                    HILIPI is ready to be configured.
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Follow this simple 5-step setup flow to prepare your store and begin receiving customer orders.
                </p>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary bg-background text-xs font-semibold self-start sm:self-auto">
                Ready for Setup
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* STEP 1 */}
              <div className="space-y-3 p-4 rounded-lg bg-card border border-border/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <span className="flex h-5 w-5 rounded-full bg-primary text-primary-foreground items-center justify-center text-xs font-bold">1</span>
                    STEP 1
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Complete store information</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Verify WhatsApp number, support contact details, and currency.
                  </p>
                </div>
                <Link href="/admin/settings" className="pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                    <Settings className="h-3.5 w-3.5" /> Store Settings
                  </Button>
                </Link>
              </div>

              {/* STEP 2 */}
              <div className="space-y-3 p-4 rounded-lg bg-card border border-border/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <span className="flex h-5 w-5 rounded-full bg-primary text-primary-foreground items-center justify-center text-xs font-bold">2</span>
                    STEP 2
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Create product categories</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set up categories ({totalCategories ?? 0} created) to group your EV hardware.
                  </p>
                </div>
                <Link href="/admin/categories" className="pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                    <FolderTree className="h-3.5 w-3.5" /> Add Categories
                  </Button>
                </Link>
              </div>

              {/* STEP 3 */}
              <div className="space-y-3 p-4 rounded-lg bg-card border border-border/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <span className="flex h-5 w-5 rounded-full bg-primary text-primary-foreground items-center justify-center text-xs font-bold">3</span>
                    STEP 3
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Add products</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Add parts with photos, pricing, minimum order quantity, and specs.
                  </p>
                </div>
                <Link href="/admin/products/new" className="pt-2">
                  <Button size="sm" className="w-full text-xs gap-1.5 h-8 shadow-sm">
                    <Plus className="h-3.5 w-3.5" /> Add Product
                  </Button>
                </Link>
              </div>

              {/* STEP 4 */}
              <div className="space-y-3 p-4 rounded-lg bg-card border border-border/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <span className="flex h-5 w-5 rounded-full bg-primary text-primary-foreground items-center justify-center text-xs font-bold">4</span>
                    STEP 4
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Publish products</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Review and activate products so they appear live on your storefront.
                  </p>
                </div>
                <Link href="/admin/products" className="pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                    <Package className="h-3.5 w-3.5" /> View Products
                  </Button>
                </Link>
              </div>

              {/* STEP 5 */}
              <div className="space-y-3 p-4 rounded-lg bg-card border border-border/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex h-5 w-5 rounded-full bg-emerald-600 text-white items-center justify-center text-xs font-bold">5</span>
                    STEP 5
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Start receiving orders</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Customer orders and inquiries arrive directly on WhatsApp and in Orders.
                  </p>
                </div>
                <Link href="/admin/orders" className="pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                    <ShoppingBag className="h-3.5 w-3.5" /> View Orders
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-base font-semibold">Recent Customer Orders</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Latest WhatsApp inquiries and order specifications submitted by customers
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
                <div
                  key={order.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
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
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Customer: <strong className="text-foreground">{order.customer_name}</strong> • Phone:{" "}
                      <span className="font-mono">{order.phone}</span> • Address: {order.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Amount</span>
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(Number(order.subtotal), currency)}
                      </span>
                    </div>
                    {order.whatsapp_message && (
                      <a
                        href={order.whatsapp_message}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="whatsapp" size="sm" className="gap-1.5 text-xs h-8">
                          WhatsApp <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground space-y-3">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p>No orders have been submitted yet.</p>
              <Link href="/shop" target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Store className="h-3.5 w-3.5" /> View Public Storefront
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

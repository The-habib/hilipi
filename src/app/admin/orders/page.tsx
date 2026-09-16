import { createClient } from "@/lib/supabase/server";
import { OrderList } from "@/components/admin/order-list";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase
    .from("store_settings")
    .select("currency")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review customer inquiries, order specifications, and update fulfillment status
        </p>
      </div>

      <OrderList initialOrders={orders || []} currency={currency} />
    </div>
  );
}

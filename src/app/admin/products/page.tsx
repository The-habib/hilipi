import { createClient } from "@/lib/supabase/server";
import { ProductList } from "@/components/admin/product-list";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }, { data: settings }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*, categories(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("store_settings")
        .select("currency")
        .limit(1)
        .single(),
    ]);

  const currency = settings?.currency || "USD";

  return (
    <ProductList
      initialProducts={products || []}
      categories={categories || []}
      currency={currency}
    />
  );
}

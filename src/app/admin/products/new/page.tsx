import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New EV Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create an active SKU with wholesale MOQ, unit pricing, and technical specs
        </p>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  );
}

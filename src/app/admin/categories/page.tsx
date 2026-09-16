import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize EV hardware systems (e.g., Motors, Inverters, BMS, Chargers)
        </p>
      </div>

      <CategoryManager initialCategories={categories || []} />
    </div>
  );
}

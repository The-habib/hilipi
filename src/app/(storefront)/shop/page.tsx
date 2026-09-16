import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Zap, Search } from "lucide-react";

interface ShopPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}

export const revalidate = 30;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const categorySlug = params.category || "";

  const supabase = await createClient();

  // Fetch active categories for the sidebar filter
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Build product query
  let productQuery = supabase
    .from("products")
    .select("*, categories(*)")
    .eq("is_active", true);

  if (query) {
    productQuery = productQuery.ilike("name", `%${query}%`);
  }

  if (categorySlug) {
    const matchedCategory = categories?.find((c) => c.slug === categorySlug);
    if (matchedCategory) {
      productQuery = productQuery.eq("category_id", matchedCategory.id);
    }
  }

  const { data: products } = await productQuery.order("created_at", {
    ascending: false,
  });

  const { data: settings } = await supabase
    .from("store_settings")
    .select("currency")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spare Parts Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse our complete inventory of industrial-grade EV components
          </p>
        </div>

        {/* Search form */}
        <form method="GET" action="/shop" className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by part name or SKU..."
              className="pl-9"
            />
          </div>
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Category Filters */}
        <aside className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Categories
          </h3>
          <div className="flex flex-col space-y-1">
            <Link
              href="/shop"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                !categorySlug
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Categories
            </Link>
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  categorySlug === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="md:col-span-3">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`} className="group">
                  <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-md hover:border-primary">
                    <div className="aspect-video bg-muted/40 flex items-center justify-center border-b p-4">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full object-contain"
                        />
                      ) : (
                        <Zap className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {product.categories && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {product.categories.name}
                          </span>
                        )}
                        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          SKU: {product.sku}
                        </p>
                      </div>

                      <div className="border-t pt-3 flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-bold text-foreground">
                            {formatCurrency(Number(product.price), currency)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            / {product.unit}
                          </span>
                        </div>
                        {product.minimum_quantity > 1 && (
                          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            MOQ: {product.minimum_quantity}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Zap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">No Products Found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {query || categorySlug
                  ? "Try adjusting your search query or category filter."
                  : "Products will appear here as soon as inventory is added."}
              </p>
              {(query || categorySlug) && (
                <div className="mt-4">
                  <Link href="/shop">
                    <Button variant="outline" size="sm">
                      Clear Filters
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

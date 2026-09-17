import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Zap, Search, ArrowRight, Package, ShoppingBag } from "lucide-react";

interface ShopPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
}

export const revalidate = 30;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const categorySlug = params.category || "";
  const sort = params.sort || "newest";

  const supabase = await createClient();

  // Fetch active categories for the filter sidebar
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

  // Sorting
  if (sort === "price-asc") {
    productQuery = productQuery.order("price", { ascending: true });
  } else if (sort === "price-desc") {
    productQuery = productQuery.order("price", { ascending: false });
  } else {
    // default newest
    productQuery = productQuery.order("created_at", { ascending: false });
  }

  const { data: products } = await productQuery;

  const { data: settings } = await supabase
    .from("store_settings")
    .select("currency")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";

  return (
    <div className="container py-8 space-y-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Spare Parts Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse our complete inventory of industrial-grade EV components and assemblies
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
              className="pl-9 text-xs"
            />
          </div>
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <Button type="submit" size="sm" className="h-9">
            Search
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Category Filters Sidebar */}
        <aside className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Filter By Category
            </h3>
            <div className="flex flex-col space-y-1">
              <Link
                href={`/shop${query ? `?q=${encodeURIComponent(query)}` : ""}`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  !categorySlug
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                All Categories ({categories?.length ?? 0})
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}${sort ? `&sort=${sort}` : ""}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    categorySlug === cat.slug
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Sort Selector */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Sort By
            </h3>
            <div className="space-y-1 text-xs">
              <Link
                href={`/shop?${categorySlug ? `category=${categorySlug}&` : ""}${query ? `q=${encodeURIComponent(query)}&` : ""}sort=newest`}
                className={`block px-3 py-1.5 rounded transition-colors ${sort === "newest" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                • Newest Arrivals
              </Link>
              <Link
                href={`/shop?${categorySlug ? `category=${categorySlug}&` : ""}${query ? `q=${encodeURIComponent(query)}&` : ""}sort=price-asc`}
                className={`block px-3 py-1.5 rounded transition-colors ${sort === "price-asc" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                • Price: Low to High
              </Link>
              <Link
                href={`/shop?${categorySlug ? `category=${categorySlug}&` : ""}${query ? `q=${encodeURIComponent(query)}&` : ""}sort=price-desc`}
                className={`block px-3 py-1.5 rounded transition-colors ${sort === "price-desc" ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                • Price: High to Low
              </Link>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {products?.length ?? 0} active component{products?.length === 1 ? "" : "s"}
            </span>
            {(query || categorySlug) && (
              <Link href="/shop" className="text-primary hover:underline font-medium">
                Clear all filters
              </Link>
            )}
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`} className="group">
                  <Card className="h-full flex flex-col justify-between overflow-hidden transition-all hover:shadow-md hover:border-primary">
                    <div>
                      <div className="aspect-video bg-muted/40 flex items-center justify-center border-b p-4 relative overflow-hidden">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <Zap className="h-10 w-10 text-muted-foreground/30" />
                        )}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          {product.stock_quantity > 0 ? (
                            <Badge variant="success" className="text-[10px] px-2 py-0.5">
                              In Stock
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-5 space-y-2">
                        {product.categories && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {product.categories.name}
                          </span>
                        )}
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      </CardContent>
                    </div>

                    <div className="px-5 pb-5 pt-0">
                      <div className="flex items-baseline justify-between border-t pt-3">
                        <span className="text-base font-bold text-foreground">
                          {formatCurrency(Number(product.price), currency)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /{product.unit}
                        </span>
                      </div>

                      {product.minimum_quantity > 1 && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                          MOQ: {product.minimum_quantity} {product.unit}s
                        </p>
                      )}

                      <div className="mt-3 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                        >
                          View Specifications <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-4">
              <Package className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-semibold text-base">No Components Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {query
                    ? `No products matched "${query}". Try checking your spelling or searching for another keyword.`
                    : "No products currently available in this category."}
                </p>
              </div>
              <div>
                <Link href="/shop">
                  <Button variant="outline" size="sm">
                    View All Products
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

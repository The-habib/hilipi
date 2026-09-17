import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Zap, Search, ArrowRight, Package } from "lucide-react";

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

  // Fetch active categories for sidebar / mobile filters
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Parts Catalog
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl break-words">
            Browse genuine commercial EV spares, motors, controllers, and conversion kits
          </p>
        </div>

        {/* Search form */}
        <form method="GET" action="/shop" className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search parts or SKU..."
              className="pl-9 text-xs h-9 w-full"
            />
          </div>
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <Button type="submit" size="sm" className="h-9 px-3 shrink-0 font-medium">
            Search
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Category Filters Sidebar (Desktop) and Quick Pills (Mobile) */}
        <aside className="space-y-6">
          <div className="space-y-3">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Categories
            </h2>
            <div className="flex flex-wrap md:flex-col gap-1.5 md:space-y-1">
              <Link
                href={`/shop${query ? `?q=${encodeURIComponent(query)}` : ""}`}
                className={`px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  !categorySlug
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                All Parts ({products?.length ?? 0})
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}${sort ? `&sort=${sort}` : ""}`}
                  className={`px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
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
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Sort By
            </h2>
            <div className="flex flex-wrap md:flex-col gap-1 text-xs">
              <Link
                href={`/shop?${categorySlug ? `category=${categorySlug}&` : ""}${query ? `q=${encodeURIComponent(query)}&` : ""}sort=newest`}
                className={`px-2.5 py-1 rounded transition-colors ${sort === "newest" ? "font-bold text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                Newest Arrivals
              </Link>
              <Link
                href={`/shop?${categorySlug ? `category=${categorySlug}&` : ""}${query ? `q=${encodeURIComponent(query)}&` : ""}sort=price-asc`}
                className={`px-2.5 py-1 rounded transition-colors ${sort === "price-asc" ? "font-bold text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                Price: Low to High
              </Link>
              <Link
                href={`/shop?${categorySlug ? `category=${categorySlug}&` : ""}${query ? `q=${encodeURIComponent(query)}&` : ""}sort=price-desc`}
                className={`px-2.5 py-1 rounded transition-colors ${sort === "price-desc" ? "font-bold text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                Price: High to Low
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
                Reset filters
              </Link>
            )}
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`} className="group block">
                  <Card className="h-full flex flex-col justify-between overflow-hidden transition-all hover:shadow-md hover:border-primary">
                    <div>
                      {/* Product Image Square Container */}
                      <div className="aspect-square bg-muted/40 flex items-center justify-center border-b p-4 relative overflow-hidden">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <Zap className="h-12 w-12 text-muted-foreground/30" />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={product.stock_quantity > 0 ? "success" : "destructive"}
                            className="text-[10px] px-2 py-0.5"
                          >
                            {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-1.5">
                        {product.categories && (
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                            {product.categories.name}
                          </span>
                        )}
                        <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      </CardContent>
                    </div>

                    <div className="p-4 pt-0">
                      <div className="flex items-baseline justify-between border-t pt-3">
                        <div>
                          <span className="text-base font-bold text-foreground">
                            {formatCurrency(Number(product.price), currency)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            /{product.unit}
                          </span>
                        </div>

                        {product.minimum_quantity > 1 && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            MOQ: {product.minimum_quantity}
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
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
                    ? `No products matched "${query}". Check your spelling or search for another term.`
                    : "No products currently available in this category."}
                </p>
              </div>
              <div>
                <Link href="/shop">
                  <Button variant="outline" size="sm">
                    View All Parts
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

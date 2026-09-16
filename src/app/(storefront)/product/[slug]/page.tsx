import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCartSection } from "@/components/cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Zap, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 30;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) {
    notFound();
  }

  const { data: settings } = await supabase
    .from("store_settings")
    .select("currency")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";

  return (
    <div className="container py-8 space-y-8">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Product Image */}
        <div className="rounded-xl border bg-muted/30 aspect-square flex items-center justify-center p-8 overflow-hidden">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/40 space-y-2">
              <Zap className="h-20 w-20 stroke-1" />
              <span className="text-xs uppercase tracking-wider font-semibold">No Image Available</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            {product.categories && (
              <Link
                href={`/category/${product.categories.slug}`}
                className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
              >
                {product.categories.name}
              </Link>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-foreground">
              {formatCurrency(Number(product.price), currency)}
            </span>
            <span className="text-sm text-muted-foreground">/ {product.unit}</span>

            {product.stock_quantity > 0 ? (
              <Badge variant="success" className="ml-2">In Stock</Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">Out of Stock</Badge>
            )}
          </div>

          {/* MOQ Alert if > 1 */}
          {product.minimum_quantity > 1 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300">
              <strong>Minimum Order Quantity:</strong> This item has a wholesale minimum order requirement of <strong>{product.minimum_quantity} {product.unit}s</strong> per order.
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="space-y-2 pt-2 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description & Specs</h3>
              <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          {/* Add to Cart Section */}
          <div className="pt-4 border-t">
            <AddToCartSection product={product} />
          </div>

          {/* Assurance badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>Tested Compatibility</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span>Direct Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary shrink-0" />
              <span>Official Warranty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

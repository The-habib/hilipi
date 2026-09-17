import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Zap, ArrowLeft, Package, MessageSquare } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!category) {
    notFound();
  }

  const desc = category.description || `Browse ${category.name} EV spare parts, conversion hardware, and components with wholesale pricing.`;

  return {
    title: `${category.name} Parts`,
    description: desc,
    openGraph: {
      title: `${category.name} | HILIPI Catalog`,
      description: desc,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!category) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase
    .from("store_settings")
    .select("currency, store_name, whatsapp_number")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";
  const storeName = settings?.store_name || "HILIPI";
  const cleanPhone = settings?.whatsapp_number
    ? settings.whatsapp_number.replace(/[^0-9]/g, "")
    : null;

  return (
    <div className="container py-8 space-y-8">
      <div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Catalog
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        <Card className="p-10 text-center max-w-md mx-auto space-y-4">
          <Package className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base">Catalog Is Being Prepared</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Components in {category.name} are currently being prepared for launch. Products will be available here soon.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20am%20inquiring%20about%20parts%20in%20the%20${encodeURIComponent(category.name)}%20category.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button variant="whatsapp" size="sm" className="w-full gap-2 text-xs">
                  <MessageSquare className="h-4 w-4" /> Inquire on WhatsApp
                </Button>
              </a>
            )}
            <Link href="/shop" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Browse Full Catalog
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

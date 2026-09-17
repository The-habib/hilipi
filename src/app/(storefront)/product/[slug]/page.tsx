import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCartSection } from "@/components/cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  Package,
} from "lucide-react";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 30;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, description, image_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) {
    return {
      title: "Product Not Found",
      description: "Requested electric vehicle spare part is unavailable.",
    };
  }

  const desc = product.description || `Order ${product.name} commercial-grade EV hardware with direct WhatsApp confirmation.`;

  return {
    title: product.name,
    description: desc,
    openGraph: {
      title: `${product.name} | EV Spare Parts`,
      description: desc,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  };
}

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
    .select("*")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";
  const storeName = settings?.store_name || "EV Spare Parts Direct";
  const cleanPhone = settings?.whatsapp_number
    ? settings.whatsapp_number.replace(/[^0-9]/g, "")
    : null;

  // Split description lines into structured specs if colon separated
  const descriptionLines = product.description
    ? product.description.split("\n").map((line) => line.trim()).filter(Boolean)
    : [];

  const structuredSpecs: { label: string; value: string }[] = [];
  const generalParagraphs: string[] = [];

  for (const line of descriptionLines) {
    if (line.includes(":") && line.indexOf(":") < 35) {
      const parts = line.split(":");
      structuredSpecs.push({
        label: parts[0].trim(),
        value: parts.slice(1).join(":").trim(),
      });
    } else {
      generalParagraphs.push(line);
    }
  }

  return (
    <div className="container py-8 space-y-8 max-w-6xl">
      {/* Breadcrumb back */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Parts Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Product Image Stage (Left) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border bg-muted/20 aspect-square flex items-center justify-center p-8 overflow-hidden relative shadow-sm">
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
                <span className="text-xs uppercase tracking-wider font-semibold">
                  No Image Available
                </span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              {product.is_featured && (
                <Badge variant="default" className="text-[10px]">
                  Featured Item
                </Badge>
              )}
            </div>
          </div>

          {/* Quick fulfillment highlights */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border">
            <div>
              <span className="block font-semibold text-foreground">Direct Desk</span>
              <span className="text-[11px]">WhatsApp Verified</span>
            </div>
            <div className="border-x">
              <span className="block font-semibold text-foreground">B2B MOQ</span>
              <span className="text-[11px]">{product.minimum_quantity} {product.unit}s</span>
            </div>
            <div>
              <span className="block font-semibold text-foreground">Warehouse</span>
              <span className="text-[11px]">{product.stock_quantity > 0 ? "Ready to pack" : "Out of stock"}</span>
            </div>
          </div>
        </div>

        {/* Product Details & Ordering (Right) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Title & SKU */}
          <div className="space-y-2">
            {product.categories && (
              <Link
                href={`/category/${product.categories.slug}`}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline inline-block"
              >
                {product.categories.name}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span>SKU: {product.sku}</span>
              <span>•</span>
              <Badge
                variant={product.stock_quantity > 0 ? "success" : "destructive"}
                className="text-[10px] px-2 py-0.5"
              >
                {product.stock_quantity > 0 ? `${product.stock_quantity} Available` : "Out of Stock"}
              </Badge>
            </div>
          </div>

          {/* Price & Unit Box */}
          <div className="p-4 rounded-xl bg-card border shadow-sm space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">
                {formatCurrency(Number(product.price), currency)}
              </span>
              <span className="text-xs text-muted-foreground uppercase font-semibold">
                / {product.unit}
              </span>
            </div>

            {product.minimum_quantity > 1 ? (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                <Package className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Wholesale MOQ Requirement:</strong> Minimum order for this component is{" "}
                  <strong>{product.minimum_quantity} {product.unit}s</strong>.
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sold individually or in bulk volume. Add to cart to prepare your WhatsApp bill of materials.
              </p>
            )}
          </div>

          {/* Add to Cart Section */}
          <div className="space-y-3 pt-2">
            <AddToCartSection product={product} />

            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20am%20inquiring%20about%20*${encodeURIComponent(product.name)}*%20(SKU:%20${encodeURIComponent(product.sku)}).`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs h-10 border-primary/30 text-foreground hover:bg-primary/5"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  <span>Ask Technical Question on WhatsApp</span>
                </Button>
              </a>
            )}
          </div>

          {/* Technical Specifications Section */}
          <div className="space-y-3 pt-4 border-t">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Technical Specifications & Notes
            </h2>

            {structuredSpecs.length > 0 ? (
              <div className="rounded-lg border overflow-hidden text-xs">
                <table className="w-full text-left">
                  <tbody className="divide-y">
                    {structuredSpecs.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-muted/30" : "bg-card"}>
                        <td className="p-2.5 font-semibold text-muted-foreground w-1/3 border-r">
                          {spec.label}
                        </td>
                        <td className="p-2.5 font-medium text-foreground">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {generalParagraphs.length > 0 ? (
              <div className="text-xs leading-relaxed text-muted-foreground space-y-2">
                {generalParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            ) : !structuredSpecs.length ? (
              <p className="text-xs text-muted-foreground">
                No specific notes logged. Contact our technical desk via WhatsApp with SKU {product.sku} for complete wiring diagrams or dimensional drawings.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

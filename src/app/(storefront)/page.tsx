import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Truck,
  MessageSquare,
  Wrench,
  Boxes,
  Cpu,
} from "lucide-react";

export const revalidate = 60; // ISR cache for 60 seconds

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch active categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(8);

  // Fetch featured active products
  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  // Fetch latest active products
  const { data: latestProducts } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1)
    .single();

  const currency = settings?.currency || "USD";
  const storeName = settings?.store_name || "EV Spare Parts Direct";
  const whatsappNumber = settings?.whatsapp_number;
  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, "") : null;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background py-16 md:py-24 border-b">
        <div className="container relative z-10">
          <div className="max-w-3xl space-y-6">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs border-primary/40 text-primary">
              <Zap className="h-3.5 w-3.5 fill-primary" /> Verified OEM & Aftermarket EV Parts
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Commercial-Grade <span className="text-primary">EV Spare Parts</span> & Components.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Explore electric vehicle motors, high-voltage controllers, battery harnesses, and specialized replacement spares with direct WhatsApp ordering and wholesale minimums.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/shop">
                <Button size="lg" className="gap-2 shadow-sm">
                  Browse Parts Catalog <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20have%20an%20inquiry%20regarding%20EV%20spare%20parts.`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="whatsapp" size="lg" className="gap-2 shadow-sm">
                    <MessageSquare className="h-4 w-4" /> WhatsApp Us
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions / Trust Pillars */}
      <section className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-muted bg-card/60">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                <Cpu className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-foreground">EV-Focused Catalog</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Engineered specifically for electric vehicle platforms, conversion setups, and light mobility.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted bg-card/60">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-foreground">Wholesale-Friendly</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Transparent Minimum Order Quantities (MOQ) and unit pricing suited for fleet workshops.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted bg-card/60">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-foreground">Fast WhatsApp Response</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Submit your bill of materials directly into WhatsApp for quick stock confirmation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted bg-card/60">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-foreground">Quality Hardware</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Accurate technical parameters, voltage ratings, and connector pinouts on all items.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Categories */}
      {categories && categories.length > 0 && (
        <section className="container space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Browse by Category</h2>
              <p className="text-sm text-muted-foreground">Find components organized by system architecture</p>
            </div>
            <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="group">
                <Card className="h-full text-center transition-all hover:border-primary hover:shadow-md">
                  <CardContent className="p-5 flex flex-col items-center justify-center space-y-2">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {cat.name}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Featured EV Hardware</h2>
              <p className="text-sm text-muted-foreground">Highlighted replacement components and assemblies</p>
            </div>
            <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
              View catalog
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <Link key={prod.id} href={`/product/${prod.slug}`} className="group">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:border-primary flex flex-col justify-between">
                  <div>
                    <div className="aspect-video bg-muted/40 flex items-center justify-center border-b p-4 overflow-hidden">
                      {prod.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Zap className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <CardContent className="p-5 space-y-2">
                      {prod.categories && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {prod.categories.name}
                        </span>
                      )}
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground">SKU: {prod.sku}</p>
                    </CardContent>
                  </div>
                  <div className="px-5 pb-5 pt-0">
                    <div className="flex items-baseline justify-between border-t pt-3">
                      <span className="text-base font-bold text-foreground">
                        {formatCurrency(Number(prod.price), currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{prod.unit}
                      </span>
                    </div>
                    {prod.minimum_quantity > 1 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                        MOQ: {prod.minimum_quantity} {prod.unit}s
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      {latestProducts && latestProducts.length > 0 && (
        <section className="container space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Latest Additions</h2>
              <p className="text-sm text-muted-foreground">Recently stocked components and accessories</p>
            </div>
            <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
              See all parts
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latestProducts.map((prod) => (
              <Link key={prod.id} href={`/product/${prod.slug}`} className="group">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:border-primary flex flex-col justify-between">
                  <div>
                    <div className="aspect-video bg-muted/40 flex items-center justify-center border-b p-4 overflow-hidden">
                      {prod.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Zap className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <CardContent className="p-5 space-y-2">
                      {prod.categories && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {prod.categories.name}
                        </span>
                      )}
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground">SKU: {prod.sku}</p>
                    </CardContent>
                  </div>
                  <div className="px-5 pb-5 pt-0">
                    <div className="flex items-baseline justify-between border-t pt-3">
                      <span className="text-base font-bold text-foreground">
                        {formatCurrency(Number(prod.price), currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{prod.unit}
                      </span>
                    </div>
                    {prod.minimum_quantity > 1 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                        MOQ: {prod.minimum_quantity} {prod.unit}s
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Direct WhatsApp CTA Section */}
      {cleanPhone && (
        <section className="container">
          <Card className="bg-muted/40 border-primary/20 overflow-hidden shadow-sm">
            <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left max-w-xl">
                <h3 className="text-2xl font-bold text-foreground">
                  Need a Specific EV Component or Custom Bulk Order?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Send your part number, voltage specs, or photos directly to our dispatch desk via WhatsApp for rapid verification.
                </p>
              </div>
              <a
                href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20need%20assistance%20locating%20a%20specific%20EV%20spare%20part.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="whatsapp" size="lg" className="gap-2 shadow-sm h-12 px-6">
                  <MessageSquare className="h-5 w-5" /> Chat on WhatsApp
                </Button>
              </a>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

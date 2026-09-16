import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Zap, ArrowRight, ShieldCheck, Truck, MessageSquare } from "lucide-react";

export const revalidate = 60; // ISR cache for 60 seconds

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch active categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(6);

  // Fetch featured active products
  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(8);

  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1)
    .single();

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
              Explore electric vehicle motors, high-voltage controllers, battery harnesses, and specialized replacement spares with direct WhatsApp ordering and volume wholesale pricing.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/shop">
                <Button size="lg" className="gap-2">
                  Browse Catalog <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {settings?.whatsapp_number && (
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(settings.store_name)},%20I%20have%20an%20inquiry%20regarding%20EV%20spare%20parts.`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="whatsapp" size="lg" className="gap-2">
                    <MessageSquare className="h-4 w-4" /> Quick WhatsApp Inquiry
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-muted bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Tested Specifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Rigorous bench-testing for electric drivetrains, voltage tolerances, and thermal stability.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Direct WhatsApp Ordering</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Build your bill of materials and submit directly to our dispatch desk via WhatsApp.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Fast Industrial Dispatch</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Expedited logistics for fleet managers, conversion shops, and commercial repair centers.
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
              <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
              <p className="text-sm text-muted-foreground">Find components organized by system architecture</p>
            </div>
            <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="group">
                <Card className="h-full text-center transition-all hover:border-primary hover:shadow-md">
                  <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Zap className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
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
      <section className="container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured EV Hardware</h2>
            <p className="text-sm text-muted-foreground">Popular high-demand spares and conversion units</p>
          </div>
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
            View catalog
          </Link>
        </div>

        {featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <Link key={prod.id} href={`/product/${prod.slug}`} className="group">
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary">
                  <div className="aspect-video bg-muted/40 flex items-center justify-center border-b p-4">
                    {prod.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prod.image_url} alt={prod.name} className="h-full object-contain" />
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
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {prod.name}
                    </h3>
                    <div className="flex items-baseline justify-between pt-2">
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(Number(prod.price), settings?.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {prod.unit}
                      </span>
                    </div>
                    {prod.minimum_quantity > 1 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Min order: {prod.minimum_quantity} {prod.unit}s
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Catalog Initializing</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No products have been marked as featured yet. Explore the full catalog in the shop or add products from the admin panel.
            </p>
            <div className="mt-6">
              <Link href="/shop">
                <Button variant="outline">Browse All Products</Button>
              </Link>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}

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
  Cpu,
  Boxes,
  CheckCircle2,
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
      <section className="border-b bg-muted/20 py-12 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Commercial-Grade EV Components</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                Electric Vehicle <span className="text-primary">Motors, Controllers</span> & Drivetrain Spares.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Wholesale and replacement parts for EV fleet operators, conversion workshops, and repair centers. Build your order list online and confirm stock directly via WhatsApp.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/shop">
                  <Button size="lg" className="gap-2 h-11 px-6 font-semibold shadow-sm">
                    Browse Parts Catalog <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20have%20an%20inquiry%20regarding%20EV%20spare%20parts.`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="whatsapp" size="lg" className="gap-2 h-11 px-6 font-semibold shadow-sm">
                      <MessageSquare className="h-4 w-4" /> Order via WhatsApp
                    </Button>
                  </a>
                )}
              </div>

              {/* Value highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Wholesale MOQ Limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Direct Desk Dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Technical Verification</span>
                </div>
              </div>
            </div>

            {/* Right Visual Component Card */}
            <div className="lg:col-span-5">
              <Card className="border shadow-md bg-card overflow-hidden">
                <div className="p-4 bg-muted/40 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Catalog Spotlight
                    </span>
                  </div>
                  <Badge variant="success" className="text-[10px]">Active Stock</Badge>
                </div>

                <div className="p-6 space-y-4">
                  <div className="aspect-video rounded-lg border bg-muted/30 flex items-center justify-center p-4">
                    <Zap className="h-16 w-16 text-primary/40" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                      Drivetrain Motor
                    </span>
                    <h2 className="font-bold text-base text-foreground">
                      72V 3000W BLDC Hub Motor Assembly
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">
                      SKU: EVM-723000-HUB • MOQ: 1 PIECE
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <div>
                      <span className="text-muted-foreground block">Wholesale Rate</span>
                      <span className="text-lg font-extrabold text-foreground">
                        {formatCurrency(499.00, currency)}
                      </span>
                    </div>
                    <Link href="/product/72v-3000w-bldc-hub-motor">
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        View Details <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container">
        <div className="border rounded-xl p-6 sm:p-8 bg-card shadow-sm space-y-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold tracking-tight text-foreground">How WhatsApp Ordering Works</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Simple 3-step procurement designed for quick turnarounds and trade orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-semibold text-sm text-foreground">Select Hardware & Quantities</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Browse our verified parts catalog. Add required items to your cart respecting minimum wholesale order parameters (MOQ).
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-semibold text-sm text-foreground">Submit Delivery Coordinates</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide your workshop address and vehicle notes. Our server generates a unique order reference number.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-semibold text-sm text-foreground">Instant WhatsApp Confirmation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click to open your complete order specification directly in WhatsApp. Our team confirms warehouse stock and dispatch timing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      {categories && categories.length > 0 && (
        <section className="container space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Browse by Category</h2>
              <p className="text-sm text-muted-foreground">Components organized by system architecture</p>
            </div>
            <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="group">
                <Card className="h-full text-center transition-all hover:border-primary hover:shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Featured Components</h2>
              <p className="text-sm text-muted-foreground">Popular high-demand replacement units and conversion spares</p>
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
                    <div className="aspect-square bg-muted/40 flex items-center justify-center border-b p-4 relative overflow-hidden">
                      {prod.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Zap className="h-12 w-12 text-muted-foreground/30" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={prod.stock_quantity > 0 ? "success" : "destructive"} className="text-[10px]">
                          {prod.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-1.5">
                      {prod.categories && (
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          {prod.categories.name}
                        </span>
                      )}
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground">SKU: {prod.sku}</p>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="flex items-baseline justify-between border-t pt-3">
                      <div>
                        <span className="text-base font-bold text-foreground">
                          {formatCurrency(Number(prod.price), currency)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          /{prod.unit}
                        </span>
                      </div>
                      {prod.minimum_quantity > 1 && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          MOQ: {prod.minimum_quantity}
                        </span>
                      )}
                    </div>
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
              <p className="text-sm text-muted-foreground">Recently added parts and replacement hardware</p>
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
                    <div className="aspect-square bg-muted/40 flex items-center justify-center border-b p-4 relative overflow-hidden">
                      {prod.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Zap className="h-12 w-12 text-muted-foreground/30" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={prod.stock_quantity > 0 ? "success" : "destructive"} className="text-[10px]">
                          {prod.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-1.5">
                      {prod.categories && (
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          {prod.categories.name}
                        </span>
                      )}
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground">SKU: {prod.sku}</p>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="flex items-baseline justify-between border-t pt-3">
                      <div>
                        <span className="text-base font-bold text-foreground">
                          {formatCurrency(Number(prod.price), currency)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          /{prod.unit}
                        </span>
                      </div>
                      {prod.minimum_quantity > 1 && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          MOQ: {prod.minimum_quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Direct WhatsApp Inquiry Banner */}
      {cleanPhone && (
        <section className="container">
          <Card className="bg-muted/30 border-primary/20 overflow-hidden shadow-sm">
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left max-w-xl">
                <h3 className="text-2xl font-bold text-foreground">
                  Need a Specific Part or Custom Wholesale Pack?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Send part numbers, voltage specifications, or photos directly to our dispatch desk on WhatsApp for instant identification.
                </p>
              </div>
              <a
                href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20need%20assistance%20locating%20a%20specific%20EV%20spare%20part.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="whatsapp" size="lg" className="gap-2 shadow-sm h-11 px-6 font-semibold">
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

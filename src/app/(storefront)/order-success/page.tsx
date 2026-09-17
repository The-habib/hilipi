import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, MessageSquare, ArrowRight, ShoppingBag, Clock, PackageCheck } from "lucide-react";

interface OrderSuccessPageProps {
  searchParams: Promise<{
    order_number?: string;
    whatsapp_url?: string;
  }>;
}

export default async function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const params = await searchParams;
  const orderNumber = params.order_number || "Pending";
  const whatsappUrl = params.whatsapp_url || "";

  return (
    <div className="container py-16 max-w-lg mx-auto">
      <Card className="text-center overflow-hidden border-emerald-500/20 shadow-xl">
        <div className="bg-emerald-500/10 p-8 flex flex-col items-center justify-center border-b border-emerald-500/10">
          <div className="h-16 w-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-4">
            Order Request Submitted!
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reference Number:{" "}
            <span className="font-mono font-bold text-foreground text-sm">{orderNumber}</span>
          </p>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed text-left bg-muted/20 p-4 rounded-lg border">
            <div className="flex items-start gap-2 text-foreground font-semibold text-xs">
              <PackageCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>What happens next:</span>
            </div>
            <p>
              1. <strong>Direct WhatsApp Confirmation:</strong> Click the button below to send your pre-formatted order specifications directly to our dispatch desk.
            </p>
            <p>
              2. <strong>Inventory & Lead Time:</strong> Our staff will immediately verify live warehouse stock, packing timeline, and delivery options with you.
            </p>
            <p>
              3. <strong>Manual Invoicing:</strong> No online payment has been taken. Commercial invoice and delivery details are arranged directly with our team.
            </p>
          </div>

          {whatsappUrl ? (
            <a
              href={decodeURIComponent(whatsappUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="whatsapp" size="lg" className="w-full gap-2 text-base h-12 shadow-sm font-semibold">
                <MessageSquare className="h-5 w-5" /> Open WhatsApp Dispatch
              </Button>
            </a>
          ) : (
            <div className="p-4 rounded-lg bg-muted text-xs text-muted-foreground">
              Order logged. Please contact support via WhatsApp with reference: {orderNumber}.
            </div>
          )}

          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/shop" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="gap-2 w-full text-xs">
                <ShoppingBag className="h-4 w-4" /> Continue Browsing
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="gap-2 w-full text-xs">
                Go to Homepage <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-6 shadow-lg border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Zap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">404 - Page Not Found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The EV component, category, or page you are requesting is unavailable, may have been relocated, or is no longer in the active catalog.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/shop">
              <Button className="w-full sm:w-auto gap-2">
                <ShoppingBag className="h-4 w-4" /> Browse Catalog
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <ArrowLeft className="h-4 w-4" /> Go to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

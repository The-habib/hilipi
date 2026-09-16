"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/context";
import { ShoppingBag, Zap, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  storeName?: string;
}

export function Header({ storeName = "EV Spare Parts" }: HeaderProps) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
            {storeName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
            All Products
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/shop">
            <Button variant="ghost" size="icon" aria-label="Search Catalog">
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="outline" size="sm" className="relative gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/admin">
            <Button variant="ghost" size="icon" aria-label="Admin Portal" title="Admin Portal">
              <ShieldCheck className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

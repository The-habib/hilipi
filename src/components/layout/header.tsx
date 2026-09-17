"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/context";
import { ShoppingBag, Zap, Search, ShieldCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  storeName?: string;
  whatsappNumber?: string | null;
}

export function Header({
  storeName = "EV Spare Parts",
  whatsappNumber,
}: HeaderProps) {
  const { itemCount } = useCart();
  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, "") : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text font-extrabold tracking-tight">
              {storeName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
              Shop Parts
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/shop">
            <Button variant="ghost" size="icon" aria-label="Search Catalog" title="Search Catalog">
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20have%20an%20inquiry%20regarding%20EV%20spare%20parts.`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="whatsapp" size="sm" className="gap-1.5 text-xs h-9">
                <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Us
              </Button>
            </a>
          )}

          <Link href="/cart">
            <Button variant="outline" size="sm" className="relative gap-2 h-9">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Cart</span>
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/admin">
            <Button variant="ghost" size="icon" aria-label="Staff Admin" title="Staff Admin Portal">
              <ShieldCheck className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

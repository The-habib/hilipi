"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart/context";
import {
  ShoppingBag,
  Zap,
  Search,
  ShieldCheck,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
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
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, "") : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm sm:text-lg tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            aria-label={`${storeName} Home`}
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shrink-0">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            </div>
            <span className="font-extrabold tracking-tight truncate max-w-[130px] sm:max-w-none text-foreground">
              {storeName}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-foreground ${
                pathname === "/" ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              href="/shop"
              className={`transition-colors hover:text-foreground ${
                pathname.startsWith("/shop") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Parts Catalog
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/shop" aria-label="Search catalog">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Search Catalog"
            >
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20have%20an%20inquiry%20regarding%20EV%20spare%20parts.`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact us on WhatsApp"
              className="hidden sm:inline-flex"
            >
              <Button
                variant="whatsapp"
                size="sm"
                className="gap-1.5 text-xs h-9 px-3 font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span>WhatsApp</span>
              </Button>
            </a>
          )}

          <Link href="/cart" aria-label={`View shopping cart with ${itemCount} items`}>
            <Button variant="outline" size="sm" className="relative gap-1.5 h-9 px-2.5 sm:px-3">
              <ShoppingBag className="h-4 w-4 text-foreground" />
              <span className="hidden sm:inline text-xs font-semibold">Cart</span>
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/admin" aria-label="Staff administration portal">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary hidden sm:inline-flex"
              title="Staff Portal"
            >
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3 shadow-md animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2 rounded-md transition-colors ${
                pathname === "/" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2 rounded-md transition-colors ${
                pathname.startsWith("/shop") ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              All Spare Parts
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-muted-foreground hover:bg-muted flex items-center justify-between"
            >
              <span>Shopping Cart</span>
              {itemCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-muted-foreground hover:bg-muted flex items-center gap-2 text-xs"
            >
              <ShieldCheck className="h-4 w-4 text-primary" /> Staff Admin Portal
            </Link>

            {cleanPhone && (
              <div className="pt-2 border-t">
                <a
                  href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(storeName)},%20I%20have%20an%20inquiry%20regarding%20EV%20spare%20parts.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="whatsapp" className="w-full gap-2 text-xs h-9 font-semibold shadow-sm">
                    <MessageSquare className="h-4 w-4" /> Order / Inquire on WhatsApp
                  </Button>
                </a>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

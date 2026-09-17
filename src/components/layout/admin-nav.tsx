"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Settings,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/settings", label: "Store Settings", icon: Settings },
];

export function AdminNav({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Don't show navigation on the login page
  if (pathname === "/admin/login") return null;

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">EV Admin Portal</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {userEmail && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground border">
              <User className="h-3.5 w-3.5 text-primary" />
              <span className="max-w-[150px] truncate">{userEmail}</span>
            </div>
          )}

          <Link href="/" target="_blank" className="hidden md:inline-block">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              Storefront <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={loggingOut}
            className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Sign out of staff portal"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{loggingOut ? "Signing out..." : "Logout"}</span>
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-card px-4 py-3 space-y-1 shadow-lg">
          {userEmail && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-b mb-2 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Signed in as: <strong className="text-foreground">{userEmail}</strong></span>
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t mt-2">
            <Link
              href="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" /> View Storefront
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

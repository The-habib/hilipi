import Link from "next/link";
import { Zap, Phone, Mail, MapPin } from "lucide-react";

interface FooterProps {
  storeName?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export function Footer({
  storeName = "EV Spare Parts Direct",
  phone = "+1 (800) 555-0199",
  email = "sales@evparts.example.com",
  address = "Industrial Zone, EV Hub, Bay 4",
}: FooterProps) {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <span>{storeName}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Reliable high-grade EV components, controllers, conversion kits, battery management systems, and specialized replacement hardware.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-foreground transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-foreground transition-colors">
                  My Cart
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-foreground transition-colors">
                  Staff Admin
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-wide uppercase">Contact & Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>{phone}</span>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span>{email}</span>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p>Direct WhatsApp Order Fulfillment</p>
        </div>
      </div>
    </footer>
  );
}

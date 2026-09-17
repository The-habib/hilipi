import Link from "next/link";
import { Zap, Phone, Mail, MapPin } from "lucide-react";

interface FooterProps {
  storeName?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export function Footer({
  storeName = "EV Spare Parts Store",
  phone,
  email,
  address,
}: FooterProps) {
  const hasContactInfo = Boolean(phone || email || address);

  return (
    <footer className="border-t bg-muted/20">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <span className="text-foreground">{storeName}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
              Specialized electric vehicle replacement parts, motor controllers, battery accessories, and conversion components with direct WhatsApp order fulfillment.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-foreground transition-colors">
                  Parts Catalog
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-foreground transition-colors">
                  Order Cart
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-foreground transition-colors">
                  Staff Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Contact & Inquiries
            </h4>
            {hasContactInfo ? (
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                {phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{phone}</span>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{email}</span>
                  </li>
                )}
                {address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{address}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Contact information can be configured by staff in the Admin Settings panel. Submit order inquiries directly through the cart.
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p>Direct WhatsApp Order Desk</p>
        </div>
      </div>
    </footer>
  );
}

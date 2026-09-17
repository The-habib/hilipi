import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart/context";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "HILIPI | Electric Vehicle Spares & Conversion Components",
    template: "%s | HILIPI",
  },
  description:
    "HILIPI provides quality electric vehicle spare parts, motor controllers, battery accessories, and conversion components with direct WhatsApp ordering.",
  openGraph: {
    title: "HILIPI | Electric Vehicle Spares & Conversion Components",
    description:
      "Quality electric vehicle spare parts, motor controllers, battery accessories, and conversion components with direct WhatsApp ordering.",
    siteName: "HILIPI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

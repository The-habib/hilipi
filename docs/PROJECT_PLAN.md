# EV Spare Parts Store - Project Implementation Plan

## 1. Project Overview
Building a production-ready EV spare-parts ecommerce/catalog website with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase.
- **Storefront**: Browse categories, search/filter products, product detail with MOQ/unit pricing, cart, customer checkout form, WhatsApp order dispatch.
- **Admin**: Dashboard, category management, product management with image uploads, order management & status tracking, store settings.
- **Payments**: No online payment gateway in V1 (WhatsApp order placement workflow).

## 2. Environment & Tooling Status
- **Working Directory**: `c:\Users\HABIB\hilipi`
- **Initial State**: Empty directory with `.agents/skills` installed.
- **Package Manager**: npm / npx
- **Supabase Project URL**: `https://nfniehhhxpcxfmnthbln.supabase.co`
- **Supabase Status**: Verified active and connected via MCP. Zero existing tables, zero storage buckets, zero prior migrations. Clean slate.

## 3. Implementation Phases

### Phase 0: Inspection & Planning (Completed)
- Inspected workspace and confirmed greenfield status.
- Verified live Supabase MCP connection and credentials.

### Phase 1: Supabase Connectivity & Verification (Completed)
- Verified database response, zero conflicting tables or buckets.
- Retrieved verified project URL and publishable key.

### Phase 2 & 3: Database Architecture & Safety
- Tables:
  1. `categories` (UUID PK, name, slug UNIQUE, description, image_url, sort_order, is_active, timestamps)
  2. `products` (UUID PK, category_id FK, name, slug UNIQUE, sku UNIQUE, description, price NUMERIC(12,2), unit, minimum_quantity INT >= 1, stock_quantity INT >= 0, image_url, is_featured, is_active, timestamps)
  3. `orders` (UUID PK, order_number SERIAL/TEXT, customer_name, phone, address, note, subtotal NUMERIC(12,2), status CHECK, whatsapp_message, timestamps)
  4. `order_items` (UUID PK, order_id FK ON DELETE CASCADE, product_id FK, product_name TEXT, quantity INT >= 1, unit_price NUMERIC(12,2), subtotal NUMERIC(12,2), created_at)
  5. `store_settings` (UUID PK, store_name, whatsapp_number, phone, email, address, logo_url, currency, timestamps)
  6. `admin_users` (user_id UUID PK FK auth.users ON DELETE CASCADE, role TEXT, created_at)
- Indexes:
  - `products(category_id)`
  - `products(slug)`
  - `products(is_active, is_featured)`
  - `categories(slug)`
  - `categories(is_active, sort_order)`
  - `orders(status, created_at DESC)`
  - `order_items(order_id)`
- Triggers:
  - `handle_updated_at` automated timestamp update.

### Phase 4: Row Level Security (RLS)
- `categories`: Public SELECT for `is_active = true`. Full access for authenticated admins.
- `products`: Public SELECT for `is_active = true`. Full access for authenticated admins.
- `store_settings`: Public SELECT for all. UPDATE/INSERT for authenticated admins.
- `orders`: Public INSERT (anyone can place an order). SELECT/UPDATE only by authenticated admins.
- `order_items`: Public INSERT. SELECT only by authenticated admins.
- `admin_users`: Only authenticated admins can read admin table. Helper function `is_admin()`.

### Phase 5: Storage Configuration
- Create `product-images` storage bucket (public: true).
- Storage RLS:
  - Public SELECT for all images.
  - Authenticated admin INSERT, UPDATE, DELETE.

### Phase 6: Reproducible Migrations
- Migration file saved under `supabase/migrations/20260917000000_initial_schema.sql`.
- Executed and validated against live Supabase project.

### Phase 7: Types & Validation
- Generate TypeScript types from Supabase schema (`types/database.types.ts`).
- Zod schemas in `lib/validations/`:
  - `product.ts` (create, update)
  - `category.ts` (create, update)
  - `checkout.ts` (customer info, order creation)
  - `settings.ts` (store & WhatsApp configuration)

### Phase 8: Application Foundation (Next.js 15+ App Router)
- Next.js project initialization with TypeScript, Tailwind CSS, App Router.
- Base UI component system with Lucide icons.
- Routing structure:
  - `/` (Home / Hero / Featured categories & products)
  - `/shop` (Catalog with search, category filtering, sorting)
  - `/category/[slug]` (Category-specific products)
  - `/product/[slug]` (Product detail with unit, MOQ selector, specs, add to cart)
  - `/cart` (Cart summary, MOQ checks, customer details, order submission)
  - `/order-success` (Order confirmation with direct WhatsApp dispatch CTA)
  - `/admin/login` (Admin auth)
  - `/admin` (Dashboard overview: recent orders, product counts)
  - `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`
  - `/admin/categories`
  - `/admin/orders`
  - `/admin/settings`

### Phase 9: Core Domain Logic
- `lib/cart/`: Cart state management with MOQ enforcement and persistence.
- `lib/supabase/`: Client & server Supabase factory helpers using official `@supabase/ssr` pattern.
- Domain calculators: Subtotals, quantity increment constraints based on MOQ.

### Phase 10: WhatsApp Ordering Architecture
- `lib/whatsapp/`: Reusable, robust URL-encoded WhatsApp message generator formatting order items, customer details, delivery address, notes, and store name.

### Phase 11: Quality Assurance & Build Verification
- Verification of TypeScript compilation without errors (`tsc --noEmit`).
- Verification of Next.js production build (`npm run build`).
- Security audit: No exposed secrets, proper RLS, no client service-role key.

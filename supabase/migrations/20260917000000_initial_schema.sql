-- Migration: 20260917000000_initial_schema.sql
-- Description: Production schema for EV Spare Parts eCommerce catalog with RLS, Storage, and strict security lint compliance

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMAS
CREATE SCHEMA IF NOT EXISTS app_private;

-- 3. UPDATED_AT TRIGGER FUNCTION (SECURITY INVOKER with empty search_path)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. ADMIN USERS TABLE & HELPER FUNCTION
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION app_private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = (SELECT auth.uid())
  );
$$;

REVOKE EXECUTE ON FUNCTION app_private.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION app_private.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION app_private.is_admin() TO authenticated;

CREATE POLICY "Allow admin to read admin_users"
ON public.admin_users
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR app_private.is_admin());

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.categories(is_active, sort_order);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (is_active = true OR app_private.is_admin());

CREATE POLICY "Admin insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (app_private.is_admin());

CREATE POLICY "Admin update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY "Admin delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (app_private.is_admin());

-- 6. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL DEFAULT 'PIECE',
  minimum_quantity INTEGER NOT NULL DEFAULT 1 CHECK (minimum_quantity >= 1),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select products"
ON public.products FOR SELECT
TO anon, authenticated
USING (is_active = true OR app_private.is_admin());

CREATE POLICY "Admin insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (app_private.is_admin());

CREATE POLICY "Admin update products"
ON public.products FOR UPDATE
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY "Admin delete products"
ON public.products FOR DELETE
TO authenticated
USING (app_private.is_admin());

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  note TEXT,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  whatsapp_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow create orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin select orders"
ON public.orders FOR SELECT
TO authenticated
USING (app_private.is_admin());

CREATE POLICY "Admin update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY "Admin delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (app_private.is_admin());

-- 8. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin select order items"
ON public.order_items FOR SELECT
TO authenticated
USING (app_private.is_admin());

CREATE POLICY "Admin update order items"
ON public.order_items FOR UPDATE
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY "Admin delete order items"
ON public.order_items FOR DELETE
TO authenticated
USING (app_private.is_admin());

-- 9. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'EV Spare Parts Store',
  whatsapp_number TEXT NOT NULL DEFAULT '+1234567890',
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER set_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select store settings"
ON public.store_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin insert store settings"
ON public.store_settings FOR INSERT
TO authenticated
WITH CHECK (app_private.is_admin());

CREATE POLICY "Admin update store settings"
ON public.store_settings FOR UPDATE
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

CREATE POLICY "Admin delete store settings"
ON public.store_settings FOR DELETE
TO authenticated
USING (app_private.is_admin());

-- Seed initial store settings if not present
INSERT INTO public.store_settings (store_name, whatsapp_number, phone, email, address, currency)
VALUES (
  'EV Parts Direct',
  '+1234567890',
  '+1 (800) 555-0199',
  'sales@evparts.example.com',
  'Industrial Zone, EV Hub, Bay 4',
  'USD'
)
ON CONFLICT DO NOTHING;

-- 10. STORAGE BUCKET & POLICIES FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;
END $$;

CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND app_private.is_admin());

CREATE POLICY "Admin can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND app_private.is_admin())
WITH CHECK (bucket_id = 'product-images' AND app_private.is_admin());

CREATE POLICY "Admin delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND app_private.is_admin());

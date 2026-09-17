-- Migration: 20260917000001_security_hardening.sql
-- Description: Hardens storage bucket constraints, orders RLS policies, search_paths, and introduces atomic order creation.

-- 1. Storage bucket configuration: Restrict to image MIME types and 5MB limit
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'product-images';

-- 2. Harden orders table insert policy for anon and authenticated
DROP POLICY IF EXISTS "Allow create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon create pending orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated create orders" ON public.orders;

CREATE POLICY "Allow anon create pending orders"
ON public.orders FOR INSERT
TO anon
WITH CHECK (
  status = 'pending' AND 
  subtotal >= 0 AND
  char_length(customer_name) >= 2 AND
  char_length(phone) >= 7 AND
  char_length(address) >= 5
);

CREATE POLICY "Allow authenticated create orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (
  (status = 'pending' AND subtotal >= 0) OR app_private.is_admin()
);

-- 3. Harden order items table insert policy
DROP POLICY IF EXISTS "Allow insert order items" ON public.order_items;

CREATE POLICY "Allow insert order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (
  quantity >= 1 AND 
  unit_price >= 0 AND 
  subtotal >= 0 AND
  char_length(product_name) >= 1
);

-- 4. Ensure admin helper has qualified search_path and restricted execute
CREATE OR REPLACE FUNCTION app_private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- 5. Atomic Order Creation Function (SECURITY INVOKER - single PostgreSQL transaction)
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_id UUID,
  p_order_number TEXT,
  p_customer_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_note TEXT,
  p_items JSONB,
  p_whatsapp_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item JSONB;
  v_product RECORD;
  v_computed_subtotal NUMERIC(12, 2) := 0;
  v_line_subtotal NUMERIC(12, 2);
  v_quantity INTEGER;
  v_unit_price NUMERIC(12, 2);
  v_item_count INTEGER := 0;
BEGIN
  -- Validate basic customer fields
  IF char_length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Customer name must be at least 2 characters';
  END IF;
  IF char_length(trim(p_phone)) < 7 THEN
    RAISE EXCEPTION 'Phone number must be at least 7 digits';
  END IF;
  IF char_length(trim(p_address)) < 5 THEN
    RAISE EXCEPTION 'Delivery address must be at least 5 characters';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Verify all items against live products table and compute line totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    IF v_quantity < 1 THEN
      RAISE EXCEPTION 'Item quantity must be at least 1';
    END IF;

    SELECT id, name, price, unit, minimum_quantity, is_active
    INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID;

    IF NOT FOUND OR NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product % is unavailable or inactive in catalog', (v_item->>'product_id');
    END IF;

    IF v_quantity < v_product.minimum_quantity THEN
      RAISE EXCEPTION 'Quantity for % must be at least % %', v_product.name, v_product.minimum_quantity, v_product.unit;
    END IF;

    v_unit_price := v_product.price;
    v_line_subtotal := round(v_unit_price * v_quantity, 2);
    v_computed_subtotal := v_computed_subtotal + v_line_subtotal;
    v_item_count := v_item_count + 1;
  END LOOP;

  -- 1. Insert order header inside atomic transaction
  INSERT INTO public.orders (
    id,
    order_number,
    customer_name,
    phone,
    address,
    note,
    subtotal,
    status,
    whatsapp_message
  ) VALUES (
    p_order_id,
    p_order_number,
    trim(p_customer_name),
    trim(p_phone),
    trim(p_address),
    NULLIF(trim(p_note), ''),
    v_computed_subtotal,
    'pending',
    p_whatsapp_message
  );

  -- 2. Insert order items inside the exact same atomic transaction
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    SELECT id, name, price
    INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID;

    v_unit_price := v_product.price;
    v_line_subtotal := round(v_unit_price * v_quantity, 2);

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      subtotal
    ) VALUES (
      p_order_id,
      v_product.id,
      v_product.name,
      v_quantity,
      v_unit_price,
      v_line_subtotal
    );
  END LOOP;

  -- Return created order details
  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', p_order_number,
    'subtotal', v_computed_subtotal,
    'item_count', v_item_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_atomic TO anon, authenticated;

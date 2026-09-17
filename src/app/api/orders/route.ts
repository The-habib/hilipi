import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validations/order";
import { generateOrderNumber } from "@/lib/utils";
import { generateWhatsAppUrl } from "@/lib/whatsapp/generator";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validatedData = createOrderSchema.parse(json);

    const supabase = await createClient();

    // 1. Fetch store settings
    const { data: settings } = await supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .single();

    const storeName = settings?.store_name ?? "EV Spare Parts Direct";
    const whatsappNumber = settings?.whatsapp_number ?? "+1234567890";
    const currency = settings?.currency ?? "USD";

    // 2. Fetch live product records from database for all requested items
    const productIds = Array.from(new Set(validatedData.items.map((i) => i.product_id)));
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, unit, minimum_quantity, is_active, stock_quantity")
      .in("id", productIds);

    if (productsError) {
      console.error("Failed to fetch products for order validation:", productsError);
      return NextResponse.json(
        { error: "Unable to verify product catalog availability. Please try again." },
        { status: 500 }
      );
    }

    const productMap = new Map((dbProducts || []).map((p) => [p.id, p]));

    // 3. Verify that all products exist, are active, and meet minimum order quantity
    let calculatedSubtotal = 0;
    const resolvedItems = [];

    for (const item of validatedData.items) {
      const dbProduct = productMap.get(item.product_id);

      if (!dbProduct || !dbProduct.is_active) {
        return NextResponse.json(
          { error: `Item "${item.product_id}" is no longer available or inactive in the catalog.` },
          { status: 400 }
        );
      }

      if (item.quantity < dbProduct.minimum_quantity) {
        return NextResponse.json(
          {
            error: `Order quantity for "${dbProduct.name}" must be at least ${dbProduct.minimum_quantity} ${dbProduct.unit}(s). Requested: ${item.quantity}.`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(dbProduct.price);
      const itemSubtotal = Math.round(unitPrice * item.quantity * 100) / 100;
      calculatedSubtotal += itemSubtotal;

      resolvedItems.push({
        product_id: dbProduct.id,
        product_name: dbProduct.name,
        quantity: item.quantity,
        unit: dbProduct.unit,
        unit_price: unitPrice,
        subtotal: itemSubtotal,
      });
    }

    calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;

    // 4. Generate unique IDs and order number securely on the server
    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();

    // 5. Prepare WhatsApp message content
    const whatsappPayload = {
      order_number: orderNumber,
      store_name: storeName,
      currency,
      customer_name: validatedData.customer_name,
      phone: validatedData.phone,
      address: validatedData.address,
      note: validatedData.note ?? null,
      items: resolvedItems,
      subtotal: calculatedSubtotal,
    };

    const whatsappUrl = generateWhatsAppUrl(whatsappNumber, whatsappPayload);

    // 6. Execute atomic database transaction via create_order_atomic RPC
    // Guarantees order header + order items commit together or rollback together
    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_order_atomic", {
      p_order_id: orderId,
      p_order_number: orderNumber,
      p_customer_name: validatedData.customer_name,
      p_phone: validatedData.phone,
      p_address: validatedData.address,
      p_note: validatedData.note || "",
      p_items: validatedData.items,
      p_whatsapp_message: whatsappUrl,
    });

    if (rpcError || !rpcResult) {
      console.error("Order transaction error:", rpcError);
      const userMessage = rpcError?.message || "Could not complete order. Please try again.";
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      order_number: orderNumber,
      whatsapp_url: whatsappUrl,
    });
  } catch (err: unknown) {
    console.error("Order creation error:", err);
    const message = err instanceof Error ? err.message : "Invalid order payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


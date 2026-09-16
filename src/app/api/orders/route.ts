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

    // 2. Calculate subtotal safely on the server
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const orderNumber = generateOrderNumber();

    // 3. Prepare WhatsApp message content
    const whatsappItems = validatedData.items.map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    }));

    const whatsappPayload = {
      order_number: orderNumber,
      store_name: storeName,
      currency,
      customer_name: validatedData.customer_name,
      phone: validatedData.phone,
      address: validatedData.address,
      note: validatedData.note,
      items: whatsappItems,
      subtotal,
    };

    const whatsappUrl = generateWhatsAppUrl(whatsappNumber, whatsappPayload);

    // 4. Insert order in Supabase
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: validatedData.customer_name,
        phone: validatedData.phone,
        address: validatedData.address,
        note: validatedData.note ?? null,
        subtotal,
        status: "pending",
        whatsapp_message: whatsappUrl,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order: " + (orderError?.message || "Unknown error") },
        { status: 500 }
      );
    }

    // 5. Insert order items (preserving product_name and unit_price at time of order)
    const orderItemsToInsert = validatedData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error("Failed to insert order items:", itemsError);
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      whatsapp_url: whatsappUrl,
    });
  } catch (err: unknown) {
    console.error("Order creation error:", err);
    const message = err instanceof Error ? err.message : "Invalid order payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

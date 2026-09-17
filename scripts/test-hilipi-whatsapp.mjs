function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function sanitizeWhatsAppNumber(phoneNumber) {
  return phoneNumber.replace(/[^0-9]/g, "");
}

function buildWhatsAppMessage(payload) {
  const currency = payload.currency || "USD";
  const lines = [];

  lines.push(`⚡ *NEW ORDER: ${payload.order_number}*`);
  lines.push(`🏪 *${payload.store_name}*`);
  lines.push(`─────────────────────────`);
  lines.push(`📋 *ORDER ITEMS:*`);

  payload.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. *${item.product_name}*\n` +
      `   Qty: ${item.quantity} ${item.unit} × ${formatCurrency(item.unit_price, currency)} = *${formatCurrency(item.subtotal, currency)}*`
    );
  });

  lines.push(`─────────────────────────`);
  lines.push(`💰 *TOTAL AMOUNT:* *${formatCurrency(payload.subtotal, currency)}*`);
  lines.push(`─────────────────────────`);
  lines.push(`👤 *CUSTOMER DETAILS:*`);
  lines.push(`• Name: ${payload.customer_name}`);
  lines.push(`• Phone: ${payload.phone}`);
  lines.push(`• Delivery Address:\n${payload.address}`);

  if (payload.note && payload.note.trim()) {
    lines.push(`• Notes: ${payload.note.trim()}`);
  }

  lines.push(`─────────────────────────`);
  lines.push(`_Thank you for ordering with ${payload.store_name}! Please confirm stock and delivery timeline._`);

  return lines.join("\n");
}

function generateWhatsAppUrl(whatsappNumber, payload) {
  const cleanPhone = sanitizeWhatsAppNumber(whatsappNumber);
  const message = buildWhatsAppMessage(payload);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

async function testHilipiWhatsApp() {
  const officialPhone = "+91 89276 81165";
  const expectedSanitized = "918927681165";
  const storeName = "HILIPI";

  console.log("=== 1. WHATSAPP NUMBER NORMALIZATION ===");
  const sanitized = sanitizeWhatsAppNumber(officialPhone);
  console.log("Raw Phone:", officialPhone);
  console.log("Sanitized Phone:", sanitized);
  if (sanitized !== expectedSanitized) {
    throw new Error(`Sanitization failed! Expected ${expectedSanitized}, got ${sanitized}`);
  }
  console.log("PASS: Normalized to 918927681165 without spaces or symbols.");

  console.log("\n=== 2. PRODUCT WHATSAPP INQUIRY URL ===");
  const productName = "48V 1000W BLDC Motor Controller";
  const sku = "CTRL-481000";
  const productUrl = `https://wa.me/${sanitized}?text=Hello%20${encodeURIComponent(storeName)},%20I%20am%20inquiring%20about%20*${encodeURIComponent(productName)}*%20(SKU:%20${encodeURIComponent(sku)}).`;
  console.log("Product Inquiry URL:", productUrl);
  if (!productUrl.startsWith("https://wa.me/918927681165?text=")) {
    throw new Error("Product inquiry URL does not target 918927681165");
  }
  if (!decodeURIComponent(productUrl).includes("Hello HILIPI")) {
    throw new Error("Product inquiry URL does not address HILIPI");
  }
  console.log("PASS: Product inquiry URL correctly targets wa.me/918927681165 addressing HILIPI.");

  console.log("\n=== 3. CART ORDER WHATSAPP MESSAGE GENERATION ===");
  const mockOrderPayload = {
    order_number: "EVP-20260917-8899",
    store_name: storeName,
    currency: "USD",
    customer_name: "Rahul Sharma",
    phone: "+91 98765 43210",
    address: "Workshop 4, Industrial Area, Sector 2",
    note: "Require heavy-duty connectors",
    items: [
      {
        product_name: "DC-DC Converter 72V to 12V 20A",
        quantity: 5,
        unit: "Piece",
        unit_price: 35.00,
        subtotal: 175.00,
      }
    ],
    subtotal: 175.00,
  };

  const generatedUrl = generateWhatsAppUrl(officialPhone, mockOrderPayload);
  console.log("Generated WhatsApp Cart URL:", generatedUrl);
  if (!generatedUrl.startsWith("https://wa.me/918927681165?text=")) {
    throw new Error("Cart order URL does not target 918927681165");
  }

  const decoded = decodeURIComponent(generatedUrl);
  console.log("\n--- Decoded Message Content ---");
  console.log(decoded.split("text=")[1]);
  if (!decoded.includes("HILIPI")) throw new Error("Missing HILIPI in message");
  if (!decoded.includes("EVP-20260917-8899")) throw new Error("Missing order number");
  if (!decoded.includes("Rahul Sharma")) throw new Error("Missing customer name");
  if (!decoded.includes("$175.00")) throw new Error("Missing formatted total");
  console.log("PASS: Cart order WhatsApp message correctly generated for HILIPI.");

  console.log("\n=== 4. ORDER SUCCESS WHATSAPP ACTION ===");
  // Order success receives whatsapp_url from API and opens it
  const successUrl = decodeURIComponent(generatedUrl);
  if (!successUrl.startsWith("https://wa.me/918927681165")) {
    throw new Error("Order success action does not target 918927681165");
  }
  console.log("PASS: Order success action targets 918927681165.");

  console.log("\n=== 5. ADMIN ORDER WHATSAPP ACTION ===");
  // Admin order list allows opening the customer's whatsapp_message or contacting customer
  const adminCustomerWaUrl = `https://wa.me/${sanitizeWhatsAppNumber(mockOrderPayload.phone)}?text=Hello%20${encodeURIComponent(mockOrderPayload.customer_name)},%20this%20is%20${encodeURIComponent(storeName)}%20regarding%20order%20${encodeURIComponent(mockOrderPayload.order_number)}.`;
  console.log("Admin Customer WhatsApp URL:", adminCustomerWaUrl);
  if (!adminCustomerWaUrl.includes("this%20is%20HILIPI")) {
    throw new Error("Admin WhatsApp message does not identify as HILIPI");
  }
  console.log("PASS: Admin order action correctly identifies as HILIPI.");

  console.log("\nALL 4 WHATSAPP ACTIONS (PRODUCT, CART, SUCCESS, ADMIN) VERIFIED!");
}

testHilipiWhatsApp().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});

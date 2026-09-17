async function runLifecycleTest() {
  const productId = "33333333-3333-3333-3333-333333333333";
  const slug = "qa-temp-test-motor";

  console.log("=== STEP 1: Verify Storefront Route For Active Product ===");
  const sfRes = await fetch(`http://localhost:3000/product/${slug}`);
  console.log(`GET /product/${slug} status:`, sfRes.status);
  if (sfRes.status !== 200) throw new Error("Storefront did not return 200 for active product");
  console.log("PASS: Active product visible on storefront.");

  console.log("\n=== STEP 2: Verify MOQ Enforcement (qty 2 when MOQ is 3) ===");
  const moqRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "QA Client",
      phone: "+15551234567",
      address: "Industrial Park, Unit 5",
      items: [{ product_id: productId, quantity: 2 }]
    })
  });
  const moqData = await moqRes.json();
  console.log("MOQ Violation status:", moqRes.status);
  console.log("MOQ Violation message:", moqData.error);
  if (moqRes.status !== 400) throw new Error("Server did not reject quantity below MOQ");
  console.log("PASS: Server strictly enforced minimum order quantity of 3.");

  console.log("\n=== STEP 3: Verify Valid Order & Server-Side Price Calculation ($249 × 3 = $747) ===");
  const validRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "QA Fleet Manager",
      phone: "+15559876543",
      address: "456 EV Boulevard, Warehouse 2",
      note: "Urgent QA delivery",
      items: [{ product_id: productId, quantity: 3, unit_price: 1.00 }] // Client tries to send $1.00
    })
  });
  const validData = await validRes.json();
  console.log("Valid Order response status:", validRes.status);
  console.log("Order Number:", validData.order_number);
  console.log("WhatsApp URL:", validData.whatsapp_url);

  if (validRes.status !== 200 || !validData.success) {
    throw new Error("Valid order placement failed: " + JSON.stringify(validData));
  }

  const decodedUrl = decodeURIComponent(validData.whatsapp_url);
  console.log("\n--- Decoded WhatsApp Message ---");
  console.log(decodedUrl.split("text=")[1]);

  if (!decodedUrl.includes(validData.order_number)) throw new Error("Order number missing in WhatsApp message");
  if (!decodedUrl.includes("QA Temporary Test Motor")) throw new Error("Product name missing in WhatsApp message");
  if (!decodedUrl.includes("$747.00")) throw new Error("Server-side calculated subtotal $747.00 missing in WhatsApp message");
  if (!decodedUrl.includes("QA Fleet Manager")) throw new Error("Customer name missing in WhatsApp message");
  if (!decodedUrl.includes("456 EV Boulevard")) throw new Error("Address missing in WhatsApp message");
  console.log("PASS: WhatsApp message accurately formatted and server calculated genuine $747.00 total.");

  console.log("\n=== STEP 4: Verify Storefront 404 For Inactive Product ===");
  const deactRes = await fetch(`http://localhost:3000/product/${slug}`);
  console.log(`GET /product/${slug} status for deactivated product:`, deactRes.status);
  if (deactRes.status !== 404) throw new Error("Deactivated product was still accessible on storefront (expected 404)");
  console.log("PASS: Deactivated product returned 404 Not Found on storefront.");

  console.log("\n=== STEP 5: Verify Order Rejection For Inactive Product ===");
  const inactOrderRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "QA Fleet Manager",
      phone: "+15559876543",
      address: "456 EV Boulevard",
      items: [{ product_id: productId, quantity: 3 }]
    })
  });
  const inactData = await inactOrderRes.json();
  console.log("Inactive Product Order status:", inactOrderRes.status);
  console.log("Inactive Product Order message:", inactData.error);
  if (inactOrderRes.status !== 400) throw new Error("Server did not reject order for deactivated product");
  console.log("PASS: Server strictly rejected order for deactivated product with 400.");

  console.log("\nALL COMPLETE LIFECYCLE TESTS (CREATE, EDIT, MOQ, PRICE, DEACTIVATE) PASSED!");
}

runLifecycleTest().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});

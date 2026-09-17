async function testOrderApi() {
  const activeProductId = "a9331bd3-a86b-40c6-bc0d-b7230fa54853"; // 72V 3000W BLDC Hub Motor ($499.00, MOQ 1)
  const draftProductId = "53bbd1c1-28d8-4d8d-beaa-111a83319f68"; // Draft 48V Battery Pack (is_active: false)

  console.log("--- 1. Testing Valid Order Placement ---");
  const validRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Phase 25 E2E Verification",
      phone: "+15551234567",
      address: "123 Industrial Way, Sector 4",
      note: "Urgent dispatch for test suite",
      items: [
        { product_id: activeProductId, quantity: 2 }
      ]
    })
  });

  const validData = await validRes.json();
  console.log("Valid Order Status:", validRes.status);
  console.log("Valid Order Response:", validData);

  if (validRes.status !== 200 || !validData.success || !validData.order_number) {
    console.error("FAIL: Valid order creation failed");
    process.exit(1);
  }

  // Check WhatsApp URL
  if (!validData.whatsapp_url.startsWith("https://wa.me/")) {
    console.error("FAIL: Invalid WhatsApp URL generated");
    process.exit(1);
  }
  console.log("PASS: Valid order placed with order number:", validData.order_number);
  console.log("PASS: WhatsApp URL properly formed:", validData.whatsapp_url.slice(0, 50) + "...");

  console.log("\n--- 2. Testing Inactive Product Rejection ---");
  const inactiveRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Hacker",
      phone: "+15551234567",
      address: "123 Darknet Road",
      items: [
        { product_id: draftProductId, quantity: 2 }
      ]
    })
  });
  console.log("Inactive Product Status:", inactiveRes.status);
  if (inactiveRes.status !== 400) {
    console.error("FAIL: Inactive product was not rejected with 400");
    process.exit(1);
  }
  console.log("PASS: Inactive product was properly rejected with 400");

  console.log("\n--- 3. Testing Missing Fields Rejection ---");
  const invalidRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "A", // too short
      phone: "12",       // too short
      address: "No",     // too short
      items: []
    })
  });
  console.log("Invalid Fields Status:", invalidRes.status);
  if (invalidRes.status !== 400) {
    console.error("FAIL: Malformed payload was not rejected with 400");
    process.exit(1);
  }
  console.log("PASS: Malformed order payload properly rejected with 400");

  console.log("\nALL ORDER API TESTS PASSED!");
}

testOrderApi();

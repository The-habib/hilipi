async function testOrderApi() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nfniehhhxpcxfmnthbln.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbmllaGhoeHBjeGZtbnRoYmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1ODExMTgsImV4cCI6MjEwNTE1NzExOH0.MnD7xprs5WJDOCmH0d7ypZ6umrRA67SYjtZafGGYYKU";

  console.log("--- 1. Checking Active Catalog Products in Database ---");
  let activeProduct = null;
  try {
    const prodRes = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,price,minimum_quantity,unit&is_active=eq.true&limit=1`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
    });
    if (prodRes.ok) {
      const prods = await prodRes.json();
      if (prods && prods.length > 0) {
        activeProduct = prods[0];
      }
    }
  } catch (err) {
    console.warn("Could not query products from Supabase:", err.message);
  }

  if (activeProduct) {
    console.log(`Found active product: "${activeProduct.name}" (ID: ${activeProduct.id}, Price: $${activeProduct.price}, MOQ: ${activeProduct.minimum_quantity})`);
    console.log("\n--- Testing Valid Order Placement ---");
    const validRes = await fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: "Phase 30 Client Verification",
        phone: "+15551234567",
        address: "123 Industrial Way, Sector 4",
        note: "Urgent dispatch for test suite",
        items: [
          { product_id: activeProduct.id, quantity: Math.max(activeProduct.minimum_quantity, 1) }
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

    if (!validData.whatsapp_url.startsWith("https://wa.me/")) {
      console.error("FAIL: Invalid WhatsApp URL generated");
      process.exit(1);
    }
    console.log("PASS: Valid order placed with order number:", validData.order_number);
    console.log("PASS: WhatsApp URL properly formed:", validData.whatsapp_url.slice(0, 50) + "...");
  } else {
    console.log("Catalog is currently empty (0 active products in Supabase).");
    console.log("Testing secure rejection of orders when no active products exist...");

    const fakeProductId = "00000000-0000-0000-0000-000000000000";
    const emptyCatalogOrderRes = await fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: "Customer Attempt",
        phone: "+15551234567",
        address: "123 Street",
        items: [{ product_id: fakeProductId, quantity: 1 }]
      })
    });

    console.log("Empty Catalog Order Status:", emptyCatalogOrderRes.status);
    if (emptyCatalogOrderRes.status !== 400) {
      console.error("FAIL: Order with unavailable product was not rejected with 400");
      process.exit(1);
    }
    console.log("PASS: Order for non-catalog item strictly rejected with 400.");
  }

  console.log("\n--- 2. Testing Inactive / Non-Existent Product Rejection ---");
  const randomNonExistentId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
  const inactiveRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Hacker",
      phone: "+15551234567",
      address: "123 Darknet Road",
      items: [
        { product_id: randomNonExistentId, quantity: 2 }
      ]
    })
  });
  console.log("Inactive / Non-Existent Product Status:", inactiveRes.status);
  if (inactiveRes.status !== 400) {
    console.error("FAIL: Inactive/non-existent product was not rejected with 400");
    process.exit(1);
  }
  console.log("PASS: Inactive / non-existent product was properly rejected with 400");

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

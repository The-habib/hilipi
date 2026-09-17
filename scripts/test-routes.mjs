async function testRoutes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nfniehhhxpcxfmnthbln.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbmllaGhoeHBjeGZtbnRoYmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1ODExMTgsImV4cCI6MjEwNTE1NzExOH0.MnD7xprs5WJDOCmH0d7ypZ6umrRA67SYjtZafGGYYKU";

  const routes = [
    { path: '/', expectedStatus: 200, desc: 'Public Storefront Homepage' },
    { path: '/shop', expectedStatus: 200, desc: 'Parts Catalog' },
    { path: '/cart', expectedStatus: 200, desc: 'Shopping Cart & Checkout' },
    { path: '/order-success', expectedStatus: 200, desc: 'Order Success Confirmation' },
    { path: '/admin/login', expectedStatus: 200, desc: 'Staff Portal Sign-in' },
    { path: '/robots.txt', expectedStatus: 200, desc: 'Robots.txt Crawler Rules' },
    { path: '/sitemap.xml', expectedStatus: 200, desc: 'Dynamic XML Sitemap' },
    { path: '/admin', expectedStatus: 307, desc: 'Admin Protected Route Auth Redirect' },
  ];

  // Dynamically check if any active products or categories exist in the database
  try {
    const prodRes = await fetch(`${supabaseUrl}/rest/v1/products?select=slug&is_active=eq.true&limit=1`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
    });
    if (prodRes.ok) {
      const prods = await prodRes.json();
      if (prods && prods.length > 0) {
        routes.push({ path: `/product/${prods[0].slug}`, expectedStatus: 200, desc: `Active Product (${prods[0].slug})` });
      }
    }

    const catRes = await fetch(`${supabaseUrl}/rest/v1/categories?select=slug&is_active=eq.true&limit=1`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
    });
    if (catRes.ok) {
      const cats = await catRes.json();
      if (cats && cats.length > 0) {
        routes.push({ path: `/category/${cats[0].slug}`, expectedStatus: 200, desc: `Active Category (${cats[0].slug})` });
      }
    }
  } catch (err) {
    console.warn("Could not query dynamic catalog items:", err.message);
  }

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r.path}`, {
        redirect: 'manual',
      });
      const status = res.status;
      const isRedirectMatch = r.expectedStatus === 307 && (status === 307 || status === 302 || status === 308);
      if (status === r.expectedStatus || isRedirectMatch) {
        console.log(`PASS: ${r.path} -> HTTP ${status} (${r.desc})`);
        passed++;
      } else {
        console.error(`FAIL: ${r.path} -> Expected HTTP ${r.expectedStatus}, got ${status} (${r.desc})`);
        failed++;
      }
    } catch (e) {
      console.error(`ERROR: ${r.path} -> ${e.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

testRoutes();

async function testRoutes() {
  const routes = [
    { path: '/', expectedStatus: 200 },
    { path: '/shop', expectedStatus: 200 },
    { path: '/cart', expectedStatus: 200 },
    { path: '/admin/login', expectedStatus: 200 },
    { path: '/robots.txt', expectedStatus: 200 },
    { path: '/sitemap.xml', expectedStatus: 200 },
    { path: '/category/active-cat', expectedStatus: 200 },
    { path: '/product/72v-3000w-bldc-hub-motor', expectedStatus: 200 },
    { path: '/admin', expectedStatus: 307 }, // Protected redirect to /admin/login
  ];

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r.path}`, {
        redirect: 'manual',
      });
      const status = res.status;
      if (status === r.expectedStatus || (r.expectedStatus === 307 && (status === 307 || status === 302 || status === 308))) {
        console.log(`PASS: ${r.path} -> HTTP ${status}`);
        passed++;
      } else {
        console.error(`FAIL: ${r.path} -> Expected ${r.expectedStatus}, got ${status}`);
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

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = "C:\\Users\\HABIB\\.gemini\\antigravity-ide\\brain\\04b7f6ad-feaf-4c0e-9763-8f4a2f407388\\screenshots";
const PORT = 9225;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const viewports = [
  // Desktop
  { name: "desktop_1280", width: 1280, height: 1200, mobile: false, scale: 1 },
  { name: "desktop_1440", width: 1440, height: 1200, mobile: false, scale: 1 },
  { name: "desktop_1920", width: 1920, height: 1200, mobile: false, scale: 1 },
  // Mobile
  { name: "mobile_320", width: 320, height: 800, mobile: true, scale: 2 },
  { name: "mobile_375", width: 375, height: 850, mobile: true, scale: 2 },
  { name: "mobile_390", width: 390, height: 850, mobile: true, scale: 2 },
  { name: "mobile_414", width: 414, height: 900, mobile: true, scale: 2 },
];

const pages = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "cart", path: "/cart" },
  { name: "admin_login", path: "/admin/login" },
];

async function run() {
  console.log("Launching Headless Chrome with CDP for exact viewport screenshots...");
  const chrome = spawn(CHROME_PATH, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "about:blank",
  ]);

  // Wait for Chrome to bind port
  await new Promise((r) => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json`);
    const tabs = await listRes.json();
    const tab = tabs.find((t) => t.type === "page") || tabs[0];
    if (!tab) throw new Error("No CDP page tab found");

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let messageId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = messageId++;
        const handler = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.id === id) {
              ws.removeEventListener("message", handler);
              if (data.error) reject(data.error);
              else resolve(data.result);
            }
          } catch (e) {
            reject(e);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    for (const p of pages) {
      for (const vp of viewports) {
        // 1. Set Device Metrics
        await sendCommand("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: vp.scale,
          mobile: vp.mobile,
        });

        // 2. Navigate to page
        await sendCommand("Page.navigate", { url: `http://localhost:3000${p.path}` });

        // 3. Wait for layout and network idle
        await new Promise((r) => setTimeout(r, 800));

        // 4. Capture screenshot
        const screenshotResult = await sendCommand("Page.captureScreenshot", {
          format: "png",
        });

        const destFile = path.join(OUTPUT_DIR, `${p.name}_${vp.name}.png`);
        const buffer = Buffer.from(screenshotResult.data, "base64");
        fs.writeFileSync(destFile, buffer);
        console.log(`Rendered: ${p.name} at ${vp.name} (${vp.width}x${vp.height}, mobile=${vp.mobile}) -> OK`);
      }
    }

    ws.close();
  } finally {
    chrome.kill();
  }

  console.log("\nAll 28 exact viewport renders completed successfully!");
}

run().catch((err) => {
  console.error("Screenshot capture failure:", err);
  process.exit(1);
});
